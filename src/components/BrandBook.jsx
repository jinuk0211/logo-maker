import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { fontEmbedCSSFor } from "../lib/fontEmbed.js";
import LogoRender from "./LogoRender.jsx";
import CardFront from "./CardFront.jsx";
import { FONT_GROUPS, DEFAULT_FONT, loadCardFonts } from "../lib/fonts.js";
import { buildBrandbook, recommendFont, rgbStr, cmykStr, readableOn, isLight, cleanRationale } from "../lib/brandbook.js";
import { exportBrandbookPptx } from "../lib/brandbookPptx.js";
import { generateBrandbookDoc } from "../lib/api.js";
import "./BrandBook.css";

// 캡처 노드 → { data, w, h }
async function capture(node) {
  if (!node) return null;
  const data = await toPng(node, { pixelRatio: 2, cacheBust: true, backgroundColor: null });
  const size = await new Promise((res) => {
    const img = new Image();
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => res({ w: node.offsetWidth, h: node.offsetHeight });
    img.src = data;
  });
  return { data, ...size };
}

// 슬라이드 상단 러닝 헤더
function Head({ n, en, ko, accent }) {
  return (
    <header className="sl-head">
      <div className="sl-idx"><b style={{ color: accent }}>{n}</b><span>{en}</span></div>
      <h4 className="sl-t">{ko}</h4>
      <span className="sl-rule" style={{ background: accent }} />
    </header>
  );
}

export default function BrandBook({ logo, brief, cardSpec, onBack }) {
  const rec = recommendFont(logo, brief);
  // 템플릿으로 먼저 채워 두고, Claude 응답이 오면 덮어쓴다 (키가 없으면 템플릿 그대로)
  const [doc, setDoc] = useState(() => buildBrandbook(brief, logo, { font: rec.family }));
  const [busy, setBusy] = useState(false);
  const [aiState, setAiState] = useState("idle"); // idle | loading | ready | fallback
  const [aiErr, setAiErr] = useState("");
  const [copied, setCopied] = useState("");

  // HEX 는 바로 복사돼야 실무에서 쓰인다
  function copyHex(hex) {
    navigator.clipboard?.writeText(hex).then(() => {
      setCopied(hex);
      setTimeout(() => setCopied(""), 1400);
    }).catch(() => {});
  }
  useEffect(() => { loadCardFonts(); }, []);

  // Claude 로 브랜드북 내용 생성 — 로고 분석 기반이라 브랜드마다 다르게 나온다.
  // 진입 시 바로 생성하지 않고, 참고 자료·요청사항을 먼저 물어본다 (건너뛰면 로고 정보만으로 생성)
  const [askOpen, setAskOpen] = useState(true);
  const [extraNotes, setExtraNotes] = useState("");
  const [extraText, setExtraText] = useState("");
  const [extraFile, setExtraFile] = useState("");
  const [fileMsg, setFileMsg] = useState("");

  async function onExtraFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setFileMsg("파일이 너무 커요 (최대 5MB)"); return; }
    const ext = (f.name.split(".").pop() || "").toLowerCase();
    if (!["txt", "md", "csv", "rtf", "json"].includes(ext)) {
      setFileMsg("지금은 텍스트 파일(.txt .md .csv)만 읽을 수 있어요. PDF·워드는 내용을 복사해 붙여넣어 주세요.");
      return;
    }
    try {
      const text = (await f.text()).slice(0, 20000);
      setExtraText(text); setExtraFile(f.name); setFileMsg("");
    } catch { setFileMsg("파일을 읽지 못했어요."); }
  }

  function runAi(extra) {
    setAskOpen(false);
    setAiState("loading");
    generateBrandbookDoc(brief, logo, extra)
      .then((ai) => {
        setDoc((d) => mergeBrandbook(d, ai));
        setAiState("ready");
      })
      .catch((e) => {
        console.warn("브랜드북 AI 생성 실패 → 템플릿 사용:", e.message);
        setAiErr(e.message);
        setAiState("fallback");
      });
  }
  const extraPayload = () => {
    const notes = extraNotes.trim(), materials = extraText.trim();
    return notes || materials ? { notes, materials } : null;
  };

  const font = doc.font?.family || DEFAULT_FONT;
  const primary = doc.palette[0]?.hex || "#2f6bf6";
  const ink = doc.palette.find((c) => c.role === "Ink")?.hex || "#1a2238";
  const onPrimaryInk = readableOn(primary);

  // 편집 헬퍼 (불변)
  const set = (patch) => setDoc((d) => ({ ...d, ...patch }));
  const setList = (key, i, val) => setDoc((d) => ({ ...d, [key]: d[key].map((v, j) => (j === i ? val : v)) }));
  const addList = (key, val = "") => setDoc((d) => ({ ...d, [key]: [...d[key], val] }));
  const delList = (key, i) => setDoc((d) => ({ ...d, [key]: d[key].filter((_, j) => j !== i) }));
  const setPal = (i, patch) => setDoc((d) => ({ ...d, palette: d.palette.map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const setFont = (family) => setDoc((d) => ({ ...d, font: { ...d.font, family } }));

  // 편집된 브랜드명을 로고 락업에 반영
  const dispLogo = { ...logo, name: doc.name };
  const symbolOnly = { ...dispLogo, layout: "icon", includeText: false };

  const rLight = useRef(null), rSymbol = useRef(null), rCard = useRef(null);
  const rDeck = useRef(null); // 화면의 슬라이드 전체 — PDF 는 이걸 장별로 찍는다
  // 슬라이드는 항상 1280px 기준으로 그리고(px 고정 레이아웃이 창 폭에 따라 깨지지 않게)
  // 컬럼 폭에 맞춰 통째로 축소한다. 캡처는 축소 전 1280px 노드를 찍으므로 PDF 도 동일.
  const DECK_W = 1280;
  const rWrap = useRef(null);
  const [deckScale, setDeckScale] = useState(1);
  const [deckH, setDeckH] = useState(0);
  useEffect(() => {
    const wrap = rWrap.current, deck = rDeck.current;
    if (!wrap || !deck) return;
    const sync = () => {
      const s = Math.min(1, wrap.clientWidth / DECK_W);
      setDeckScale(s);
      setDeckH(deck.offsetHeight * s);
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(wrap); ro.observe(deck);
    return () => ro.disconnect();
  }, []);
  const [pdfBusy, setPdfBusy] = useState("");

  // 슬라이드 번호는 렌더 순서대로 매긴다 — 조건부로 빠지는 장이 있어 고정 번호를 쓸 수 없다
  let slideNo = 0;
  const NO = () => String(++slideNo).padStart(2, "0");

  // 캡처 PNG 를 캔버스에 다시 그려 1) 실제로 디코딩되는지 확인하고 2) 백지인지 검사한 뒤 3) JPEG 로 바꾼다.
  // (html-to-image 가 간헐적으로 빈/깨진 이미지를 주는데, 그게 그대로 PDF 에 들어가면 흰 페이지가 된다)
  async function toValidJpeg(dataUrl, w, h) {
    const img = new Image();
    const ok = await new Promise((res) => { img.onload = () => res(true); img.onerror = () => res(false); img.src = dataUrl; });
    if (!ok || !img.naturalWidth) return null;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    // 백지 검사 — 축소 샘플에서 흰색이 99% 이상이면 실패로 본다
    const s = document.createElement("canvas");
    s.width = 64; s.height = 36;
    const sc = s.getContext("2d", { willReadFrequently: true });
    sc.drawImage(c, 0, 0, 64, 36);
    const d = sc.getImageData(0, 0, 64, 36).data;
    let nonWhite = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 245 || d[i + 1] < 245 || d[i + 2] < 245) nonWhite++;
    if (nonWhite / (64 * 36) < 0.01) return null;
    return c.toDataURL("image/jpeg", 0.92);
  }

  async function captureSlide(node, opts, w, h) {
    let last = null;
    for (let t = 0; t < 4; t++) {
      try {
        const png = await toPng(node, opts);
        const jpg = await toValidJpeg(png, w, h);
        if (jpg) return jpg;
      } catch (e) { last = e; }
      console.warn("[brandbook] 캡처 실패/백지 → 재시도", t + 1, last?.message || "");
      await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error("슬라이드 캡처에 계속 실패했어요");
  }

  // PDF — 화면에 렌더된 슬라이드(AI 장 포함 전부)를 장별로 캡처해 그대로 담는다.
  // 이미지라 폰트가 깨지지 않고, PPT(7장·네이티브)와 달리 12장이 모두 들어간다.
  async function downloadPdf() {
    const deck = rDeck.current;
    if (!deck) return;
    const slides = Array.from(deck.querySelectorAll(".slide:not(.slide-pending)"));
    if (!slides.length) return;
    setPdfBusy("0");
    try {
      if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
      const fontEmbedCSS = await fontEmbedCSSFor(deck); // 실제 쓰는 폰트만, 한 번만
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 720], compress: true });
      for (let i = 0; i < slides.length; i++) {
        setPdfBusy(`${i + 1}/${slides.length}`);
        const node = slides[i];
        const opts = { pixelRatio: 2, backgroundColor: "#ffffff", fontEmbedCSS, width: node.offsetWidth, height: node.offsetHeight };
        if (i === 0) await toPng(node, opts).catch(() => {}); // 첫 캡처 예열 (이미지 누락 방지)
        const data = await captureSlide(node, opts, 2560, 1440);
        if (i > 0) pdf.addPage([1280, 720], "landscape");
        pdf.addImage(data, "JPEG", 0, 0, 1280, 720, undefined, "FAST");
      }
      pdf.save(`${(doc.name || "brandbook").replace(/\s+/g, "-")}-브랜드북.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setPdfBusy("");
    }
  }

  async function downloadPptx() {
    setBusy(true);
    try {
      const [logoOnLight, symbolOnLight, cardFront] = await Promise.all([
        capture(rLight.current), capture(rSymbol.current), capture(rCard.current),
      ]);
      const safeDoc = { ...doc, rationale: cleanRationale(doc.rationale, 160) };
      await exportBrandbookPptx(safeDoc, { logoOnLight, symbolOnLight, cardFront });
    } catch (e) {
      console.error(e);
      alert("PPT 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bb">
      <div className="bb-top">
        <button className="step-back" onClick={onBack}>
          ← 명함으로 돌아가기
        </button>
        <span className="step-eyebrow">Step 5 / Brand book</span>
        <h1 className="bb-title">{doc.name}</h1>
        <p className="bb-sub-title">
          {aiState === "idle"
            ? "참고 자료를 넣으면 AI가 그 내용으로 브랜드 가이드를 작성해요."
            : aiState === "loading"
            ? "로고를 분석해 브랜드 가이드를 작성하는 중입니다…"
            : aiState === "fallback"
            ? `기본 템플릿으로 표시 중 — ${aiErr}`
            : "모든 문구·컬러·규정을 자유롭게 고칠 수 있어요. 다 다듬고 PPT로 받아가세요."}
        </p>
      </div>

      <div className="bb-grid">
        {/* 슬라이드 덱 */}
        <div ref={rWrap} className="bb-deck-wrap" style={{ height: deckH || undefined }}>
        <div ref={rDeck} className="bb-deck" style={{ transform: `scale(${deckScale})`, fontFamily: `'${font}', sans-serif`, "--accent": primary, "--ink": ink }}>
          {/* 표지 — 메인 컬러 전면, 우측 상단 로고, 큰 Brand Book 타이틀 */}
          <article
            className={"slide cover" + (onPrimaryInk === "#ffffff" ? " cover-dark" : " cover-light")}
            style={{ background: primary, color: onPrimaryInk }}
          >
            {/* 심볼을 크게 눕힌 워터마크 — 배경색과 거의 같은 톤으로 깔린다 */}
            <div className="cover-watermark" aria-hidden="true">
              <LogoRender logo={symbolOnly} size="lg" />
            </div>

            <div className="cover-mark">
              <LogoRender logo={dispLogo} size="sm" />
            </div>

            <div className="cover-foot">
              <h3 className="cover-name">
                Brand <b>Book</b>
              </h3>
              <p className="cover-tag">
                {doc.name}{doc.tagline ? ` — ${doc.tagline}` : ""}
              </p>
            </div>

            <span className="cover-meta">{doc.business || "Brand Identity Guidelines"}</span>
          </article>

          {/* 개요 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Brand Overview" ko="브랜드 개요" accent={primary} />
            <div className="s-cols ov">
              <div>
                {doc.essence && <p className="s-essence" style={{ borderColor: primary }}>{doc.essence}</p>}
                <p className="s-mission">{doc.mission}</p>
                <small className="s-lbl">Keywords</small>
                <div className="s-kw">{doc.keywords.map((k, i) => <span key={i}>{k}</span>)}</div>
                {doc.personality?.length > 0 && (
                  <>
                    <small className="s-lbl">Personality</small>
                    <div className="s-kw s-kw-plain">{doc.personality.map((k, i) => <span key={i}>{k}</span>)}</div>
                  </>
                )}
              </div>
              <div className="s-meta-list">
                <div><small>업종</small><b>{doc.business || "-"}</b></div>
                <div><small>로고 스타일</small><b>{doc.styleLabel}</b></div>
                <div className="s-tone" style={{ borderColor: primary }}>
                  <small style={{ color: primary }}>Tone of voice</small>
                  <p>{doc.tone}</p>
                </div>
              </div>
            </div>
          </article>

          {/* 로고 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Logo" ko="로고" accent={primary} />
            <div className="s-logo-grid">
              <div className="s-frame hero"><LogoRender logo={dispLogo} size="md" /><em>Primary</em></div>
              <div className="s-logo-side">
                <div className="s-frame"><LogoRender logo={symbolOnly} size="sm" /><em>Symbol</em></div>
                <div className="s-frame small"><LogoRender logo={symbolOnly} size="sm" /><em>Small</em></div>
              </div>
            </div>
            {doc.rationale && <p className="s-rationale">“{doc.rationale}”</p>}
          </article>

          {/* 브랜드 코어 — 개요에 다 넣으면 16:9 밖으로 넘친다 */}
          {(doc.vision || doc.values?.length) && (
            <article className="slide slide-pad">
              <Head n={NO()} en="Brand Core" ko="브랜드 코어" accent={primary} />
              <div className="s-core">
                {doc.essence && (
                  <div><small className="s-lbl">Essence</small><p className="s-core-lead">{doc.essence}</p></div>
                )}
                {doc.vision && (
                  <div><small className="s-lbl">Vision</small><p className="s-vision">{doc.vision}</p></div>
                )}
                {doc.values?.length > 0 && (
                  <div>
                    <small className="s-lbl">Core values</small>
                    <div className="s-values">
                      {doc.values.map((v, i) => (
                        <div key={i}><b style={{ color: primary }}>{v.name}</b><span>{v.desc}</span></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {/* 로고 의미 — 로고를 크게 두고 부분마다 설명을 뽑아낸다 */}
          {doc.logoMeaning?.length > 0 && (
            <article className="slide slide-pad">
              <Head n={NO()} en="Our Logo" ko="로고에 담은 것" accent={primary} />
              <div className="s-meaning">
                <div className="s-mean-col">
                  {doc.logoMeaning.slice(0, 2).map((m, i) => (
                    <div className="s-mean l" key={i} style={{ "--c": primary }}>
                      <b>{m.part}</b><span>{m.meaning}</span>
                    </div>
                  ))}
                </div>
                <div className="s-mean-logo"><LogoRender logo={symbolOnly} size="md" /></div>
                <div className="s-mean-col">
                  {doc.logoMeaning.slice(2, 4).map((m, i) => (
                    <div className="s-mean r" key={i} style={{ "--c": primary }}>
                      <b>{m.part}</b><span>{m.meaning}</span>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          )}

          {/* 앱 아이콘 — 정사각 크롭에서 어떻게 보이는지 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="App Icon" ko="앱 아이콘" accent={primary} />
            <div className="s-appicon">
              <div className="s-ai-set">
                {[
                  { bg: "#ffffff", rev: false, label: "화이트" },
                  { bg: primary, rev: onPrimaryInk === "#ffffff", label: "브랜드" },
                  { bg: ink, rev: true, label: "다크" },
                ].map((v, i) => (
                  <figure key={i}>
                    <div className={"s-ai" + (v.rev ? " rev" : "")} style={{ background: v.bg }}>
                      <LogoRender logo={symbolOnly} size="sm" />
                    </div>
                    <figcaption>{v.label}</figcaption>
                  </figure>
                ))}
              </div>
              <div className="s-phone">
                <div className="s-phone-scr">
                  <div className={"s-ai" + (onPrimaryInk === "#ffffff" ? " rev" : "")} style={{ background: primary }}>
                    <LogoRender logo={symbolOnly} size="sm" />
                  </div>
                  <span className="s-phone-name">{doc.name}</span>
                </div>
              </div>
              <p className="s-ai-note">
                아이콘 여백은 변 길이의 12% 이상을 유지하고, 배경이 어두우면 로고를 흰색으로 반전해 씁니다.
              </p>
            </div>
          </article>

          {/* 컬러 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Color Palette" ko="컬러 팔레트" accent={primary} />
            <div className="s-swatch-row">
              {doc.palette.map((c, i) => (
                <div className="s-swatch" key={i}>
                  <div className="s-chip" style={{ background: c.hex, border: isLight(c.hex) ? "1px solid #e4e6ef" : "none", color: readableOn(c.hex) }}>
                    <span className="s-chip-role">{c.role}</span>
                    <b>{c.name}</b>
                  </div>
                  <dl>
                    <div>
                      <dt>HEX</dt>
                      <dd>
                        <button className="s-copy" onClick={() => copyHex(c.hex)} title="클릭해서 복사">
                          {c.hex}
                          <i>{copied === c.hex ? "복사됨" : "복사"}</i>
                        </button>
                      </dd>
                    </div>
                    <div><dt>RGB</dt><dd>{rgbStr(c.hex)}</dd></div>
                    <div><dt>CMYK</dt><dd>{cmykStr(c.hex)}</dd></div>
                  </dl>
                </div>
              ))}
            </div>
          </article>

          {/* 타이포 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Typography" ko="타이포그래피" accent={primary} />
            <div className="s-typo-hero">
              <span className="s-typo-aa" style={{ color: primary }}>Aa</span>
              <div>
                <b>{font}</b>
                <span>{rec.family === font ? `추천 서체 · ${rec.reason}` : "국문 / 영문 지원"}</span>
              </div>
            </div>
            {doc.typography?.hierarchy?.length ? (
              /* 지정한 수치를 그대로 style 로 넣어 실제 크기를 눈으로 확인시킨다 */
              <div className="s-type-scale">
                {doc.typography.hierarchy.map((h, i) => (
                  <div className="s-type-row" key={i}>
                    <span className="s-type-spec">
                      <b>{h.role}</b>
                      {h.size} · {h.weight} · {h.lineHeight} · {h.letterSpacing}
                    </span>
                    <span
                      className="s-type-sample"
                      /* --fs 로 넘겨 CSS 가 슬라이드 안에 들어오도록 상한을 건다.
                         왼쪽 스펙 표기는 지정 원본값을 그대로 유지한다. */
                      style={{
                        "--fs": h.size,
                        fontWeight: h.weight,
                        lineHeight: h.lineHeight,
                        letterSpacing: h.letterSpacing,
                      }}
                    >
                      {doc.name} 브랜드
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="s-cols">
                <div><small className="s-lbl">Heading</small><p className="s-type-h">{doc.name}</p></div>
                <div><small className="s-lbl">Body</small><p className="s-type-b">{doc.mission}</p></div>
              </div>
            )}
          </article>

          {/* 조형 언어 — 로고에서 파생한 형태 규칙 */}
          {doc.visualLanguage && (
            <article className="slide slide-pad">
              <Head n={NO()} en="Visual Language" ko="조형 언어" accent={primary} />
              <div className="s-vl">
                <div className="s-vl-txt">
                  <div><small className="s-lbl">Shape</small><p>{doc.visualLanguage.shape}</p></div>
                  <div><small className="s-lbl">Line</small><p>{doc.visualLanguage.line}</p></div>
                  <div><small className="s-lbl">Motif</small><p>{doc.visualLanguage.motif}</p></div>
                </div>
                {/* 규칙을 말로만 두지 않고 호(arc) 모티프를 실제로 그려 보여준다 */}
                <div className="s-vl-demo" style={{ borderColor: primary }}>
                  <svg viewBox="0 0 120 120" aria-hidden="true">
                    {[0, 90, 180, 270].map((deg, i) => (
                      <path key={deg} d="M60 60 C 60 40, 74 26, 92 24 C 90 44, 78 58, 60 60 Z"
                        fill="none" stroke={primary} strokeWidth="2" strokeLinejoin="round"
                        transform={`rotate(${deg} 60 60)`} opacity={0.4 + i * 0.2} />
                    ))}
                  </svg>
                  <em>Growth arc — 심볼 곡선을 회전 배치한 보조 모티프</em>
                </div>
              </div>
            </article>
          )}

          {/* 아이콘 · 레이아웃 */}
          {(doc.iconStyle || doc.layout) && (
            <article className="slide slide-pad">
              <Head n={NO()} en="Icon & Layout" ko="아이콘 · 레이아웃" accent={primary} />
              <div className="s-cols">
                {doc.iconStyle && (
                  <div>
                    <small className="s-lbl">Icon system</small>
                    <p className="s-body">{doc.iconStyle}</p>
                    <div className="s-icon-grid" style={{ borderColor: primary }}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <defs>
                          <pattern id="bbgrid" width="3" height="3" patternUnits="userSpaceOnUse">
                            <path d="M3 0 L0 0 0 3" fill="none" stroke="rgba(0,0,0,.1)" strokeWidth=".4" />
                          </pattern>
                        </defs>
                        <rect width="24" height="24" fill="url(#bbgrid)" />
                        <rect x="2" y="2" width="20" height="20" fill="none"
                          stroke={primary} strokeWidth=".5" strokeDasharray="1.5 1.5" />
                        <path d="M12 18 C 12 10, 16 7, 19 6 C 19 12, 16 17, 12 18 Z"
                          fill="none" stroke={primary} strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                      <em>24×24 그리드 · 여백 2px · 선 1.5px</em>
                    </div>
                  </div>
                )}
                {doc.layout && (
                  <div>
                    <small className="s-lbl">Layout system</small>
                    <p className="s-body">{doc.layout}</p>
                    <div className="s-col-grid" style={{ borderColor: primary }}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <span key={i} style={{ background: primary, opacity: i < 7 ? 0.22 : 0.08 }} />
                      ))}
                      <em>12 columns</em>
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {/* 사진 · 보이스 */}
          {(doc.photography || doc.voice) && (
            <article className="slide slide-pad">
              <Head n={NO()} en="Photography & Voice" ko="사진 · 브랜드 보이스" accent={primary} />
              <div className="s-cols">
                {doc.photography && (
                  <div>
                    <small className="s-lbl">Photography</small>
                    <p className="s-body">{doc.photography}</p>
                  </div>
                )}
                {doc.voice && (
                  <div>
                    <small className="s-lbl">Voice — {doc.voice.tone}</small>
                    <p className="s-body">{doc.voice.writingStyle}</p>
                    <div className="s-quotes">
                      {doc.voice.examples?.map((q, i) => (
                        <blockquote key={i} style={{ borderColor: primary }}>{q}</blockquote>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </article>
          )}

          {/* 활용 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Applications" ko="활용 예시" accent={primary} />
            <div className="s-app-grid">
              <div className="s-frame hero soft">
                {cardSpec
                  ? <div className="s-realcard"><CardFront spec={cardSpec} logo={dispLogo} /></div>
                  : <MiniCard logo={dispLogo} name={doc.name} font={font} />}
                <em>Business card</em>
              </div>
              <div className="s-frame hero soft">
                <WebMock logo={dispLogo} name={doc.name} />
                <em>Website</em>
              </div>
            </div>
          </article>

          {/* AI 가 아직 채우지 못한 장 — 비워두면 7장만 보고 나가버리므로 '작성 중' 자리로 보여준다 */}
          {aiState === "loading" && [
            ["Brand Core", "브랜드 코어", !(doc.vision || doc.values?.length)],
            ["Logo Meaning", "로고의 의미", !(doc.logoMeaning?.length > 0)],
            ["Visual Language", "조형 언어", !doc.visualLanguage],
            ["Icon & Layout", "아이콘 · 레이아웃", !(doc.iconStyle || doc.layout)],
            ["Photography & Voice", "사진 · 보이스", !(doc.photography || doc.voice)],
          ].filter(([, , missing]) => missing).map(([en, ko]) => (
            <article key={en} className="slide slide-pad slide-pending">
              <Head n={NO()} en={en} ko={ko} accent={primary} />
              <div className="s-pending">
                <span className="spinner" />
                <p>AI가 이 장을 작성하는 중이에요. 잠시만 기다려 주세요…</p>
              </div>
            </article>
          ))}

          {/* 요약 — 한 장으로 전체 시스템을 확인 */}
          <article className="slide slide-pad">
            <Head n={NO()} en="Brand Summary" ko="브랜드 요약" accent={primary} />
            <div className="s-sum">
              <div className="s-sum-logo"><LogoRender logo={dispLogo} size="sm" /></div>
              <div className="s-sum-cols">
                <div>
                  <small className="s-lbl">Colors</small>
                  <div className="s-sum-sw">
                    {doc.palette.map((c, i) => (
                      <span key={i} style={{ background: c.hex, border: isLight(c.hex) ? "1px solid #e4e6ef" : "none" }} title={`${c.name} ${c.hex}`} />
                    ))}
                  </div>
                </div>
                <div>
                  <small className="s-lbl">Typeface</small>
                  <b className="s-sum-b">{font}</b>
                </div>
                <div>
                  <small className="s-lbl">Personality</small>
                  <b className="s-sum-b">{(doc.personality || []).join(" · ") || doc.tone}</b>
                </div>
              </div>
              <div className="s-sum-kw">{doc.keywords.map((k, i) => <span key={i}>{k}</span>)}</div>
            </div>
          </article>
        </div>

        {/* 편집기 */}
        </div>
        <div className="bb-editor">
          <div className="bb-accs">
          <Acc title="기본 정보" open>
            <Field label="브랜드명" value={doc.name} onChange={(v) => set({ name: v })} />
            <Field label="태그라인" value={doc.tagline} onChange={(v) => set({ tagline: v })} />
            <Field label="브랜드 소개" area value={doc.mission} onChange={(v) => set({ mission: v })} />
            <Field label="업종" value={doc.business} onChange={(v) => set({ business: v })} />
            <Field label="로고 스타일" value={doc.styleLabel} onChange={(v) => set({ styleLabel: v })} />
            <Field label="톤 앤 보이스" area value={doc.tone} onChange={(v) => set({ tone: v })} />
          </Acc>

          <Acc title="키워드">
            <ListEdit items={doc.keywords} onChange={(i, v) => setList("keywords", i, v)}
              onAdd={() => addList("keywords", "키워드")} onDel={(i) => delList("keywords", i)} ph="키워드" />
          </Acc>

          <Acc title="로고 설명">
            <Field label="디자인 의도" area value={doc.rationale} onChange={(v) => set({ rationale: v })} ph="이 로고를 이렇게 만든 이유…" />
          </Acc>

          <Acc title="컬러">
            {doc.palette.map((c, i) => (
              <div className="bb-color-row" key={i}>
                <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#000000"}
                  onChange={(e) => setPal(i, { hex: e.target.value.toUpperCase() })} />
                <input className="bb-color-name" value={c.name} onChange={(e) => setPal(i, { name: e.target.value })} />
                <input className="bb-color-hex" value={c.hex} onChange={(e) => setPal(i, { hex: e.target.value.toUpperCase() })} />
              </div>
            ))}
          </Acc>

          <Acc title="폰트">
            <div className="bb-rec">
              <div className="bb-rec-info">
                <span className="bb-rec-badge">AI 추천</span>
                <b style={{ fontFamily: `'${font}', sans-serif` }}>{font}</b>
                <em>{doc.font?.reason || rec.reason}</em>
              </div>
              {font !== rec.family && (
                <button className="bb-rec-apply" onClick={() => setFont(rec.family)}>
                  {rec.label} 로 변경
                </button>
              )}
            </div>
            <select className="font-select" value={font} onChange={(e) => setFont(e.target.value)} style={{ fontFamily: `'${font}', sans-serif` }}>
              {FONT_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.fonts.map((f) => (
                    <option key={f.family} value={f.family}>{f.label}{f.family === rec.family ? "  · 추천" : ""}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Acc>

          <Acc title="로고 사용 규정">
            <small className="bb-sub ok">권장 (Do)</small>
            <ListEdit items={doc.dos} area onChange={(i, v) => setList("dos", i, v)}
              onAdd={() => addList("dos", "")} onDel={(i) => delList("dos", i)} ph="권장 사항" />
            <small className="bb-sub no">지양 (Don’t)</small>
            <ListEdit items={doc.donts} area onChange={(i, v) => setList("donts", i, v)}
              onAdd={() => addList("donts", "")} onDel={(i) => delList("donts", i)} ph="피해야 할 사항" />
            <Field label="최소 크기 · 여백" value={doc.minSize} onChange={(v) => set({ minSize: v })} />
          </Acc>
          </div>

          {/* 하단 액션 바 — 다른 화면과 같은 자리 */}
          <div className="bar-stack bb-actions">
            <button className="bar-btn bar-dark" disabled={!!pdfBusy || busy || aiState === "loading"} onClick={downloadPdf}>
              {pdfBusy ? `PDF 만드는 중… ${pdfBusy}` : aiState === "loading" ? "AI 작성 완료 후 받을 수 있어요" : "브랜드북 PDF 다운로드"}
              <span className="bar-ico">↓</span>
            </button>
            <p className="bb-note">
              화면 그대로 전체 슬라이드 · 폰트 유지 (.pdf)
            </p>
            <button className="bar-btn bar-ghost" disabled={busy || !!pdfBusy || aiState === "loading"} onClick={() => setAskOpen(true)}>
              ✦ AI로 다시 작성 (자료 추가)
            </button>
            <button className="bar-btn bar-ghost" disabled={busy || !!pdfBusy} onClick={downloadPptx}>
              {busy ? "PPT 생성 중…" : "편집용 PPT 다운로드"}
            </button>
            <p className="bb-note">
              7장 요약 · 편집 가능한 .pptx (PowerPoint / Keynote / 구글 슬라이드)
            </p>
          </div>
        </div>
      </div>

      {/* 참고 자료 · 요청사항 입력 */}
      {askOpen && (
        <div className="bb-modal-bg" onClick={() => aiState !== "loading" && setAskOpen(false)}>
          <div className="bb-modal" onClick={(e) => e.stopPropagation()}>
            <span className="step-eyebrow">BRAND BOOK</span>
            <h3>참고할 자료나 원하는 내용이 있나요?</h3>
            <p className="bb-modal-sub">
              사업계획서·소개글을 넣으면 미션·가치·톤·문구에 실제 내용이 반영돼요. 구도와 디자인은 그대로 유지됩니다.
            </p>

            <label className="bb-modal-label">참고 자료 <small>사업계획서 · 서비스 소개 · 홈페이지 문구 등</small></label>
            <textarea
              className="bb-modal-ta"
              rows={7}
              value={extraText}
              onChange={(e) => { setExtraText(e.target.value); setExtraFile(""); }}
              placeholder="예: 신독서논술은 대구 신매동에서 초등 3~6학년을 대상으로 독서와 논술을 함께 가르치는 학원입니다. 아이가 스스로 질문하고…"
            />
            <div className="bb-modal-file">
              <label className="bb-modal-attach">
                📎 텍스트 파일 올리기 <small>.txt .md .csv</small>
                <input type="file" accept=".txt,.md,.csv,.rtf,.json,text/plain" onChange={onExtraFile} hidden />
              </label>
              {extraFile && <span className="bb-modal-fname">📄 {extraFile}</span>}
            </div>
            {fileMsg && <p className="bb-modal-msg">{fileMsg}</p>}

            <label className="bb-modal-label">요청사항 <small>선택</small></label>
            <textarea
              className="bb-modal-ta"
              rows={3}
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
              placeholder="예: 학부모에게 신뢰감 있는 톤으로, 키워드에 '문해력' 꼭 넣어줘"
            />

            <div className="bb-modal-cta">
              <button className="bar-btn bar-ghost" onClick={() => runAi(null)}>자료 없이 생성</button>
              <button className="bar-btn bar-dark" onClick={() => runAi(extraPayload())}>
                {extraPayload() ? "이 내용으로 브랜드북 생성 ✦" : "브랜드북 생성 ✦"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 숨은 캡처 노드 */}
      <div className="bb-capture" aria-hidden="true" style={{ fontFamily: `'${font}', sans-serif` }}>
        <div ref={rLight} className="cap cap-light"><LogoRender logo={dispLogo} size="lg" /></div>
        <div ref={rSymbol} className="cap cap-light"><LogoRender logo={symbolOnly} size="lg" /></div>
        <div ref={rCard} className="cap cap-light">
          {cardSpec ? <CardFront spec={cardSpec} logo={dispLogo} /> : <MiniCard logo={dispLogo} name={doc.name} font={font} big />}
        </div>
      </div>
    </section>
  );
}

/* Claude 응답을 기존 문서 구조에 얹는다.
   렌더러·PPT 내보내기가 기대하는 필드 모양(palette 등)을 그대로 유지해야 하므로
   통째로 교체하지 않고 필드 단위로 덮어쓴다. */
function mergeBrandbook(base, ai) {
  return {
    ...base,
    tagline: ai.tagline || base.tagline,
    mission: ai.mission || base.mission,
    tone: ai.tone || base.tone,
    keywords: ai.keywords?.length ? ai.keywords : base.keywords,
    dos: ai.dos?.length ? ai.dos : base.dos,
    donts: ai.donts?.length ? ai.donts : base.donts,
    minSize: ai.minSize || base.minSize,
    palette: ai.palette?.length
      ? ai.palette.map((c) => ({ role: c.role, name: c.name, hex: c.hex, usage: c.usage }))
      : base.palette,
    font: ai.typography?.primary
      ? { ...base.font, family: ai.typography.primary, reason: ai.typography.primaryReason }
      : base.font,
    // 템플릿에는 없고 AI 응답에만 있는 섹션 — 값이 없으면 해당 슬라이드는 "작성 중" 으로 남는다
    essence: ai.essence,
    vision: ai.vision,
    values: ai.values,
    rulesWhy: ai.rulesWhy,
    logoMeaning: ai.logoMeaning,
    personality: ai.personality,
    typography: ai.typography,
    visualLanguage: ai.visualLanguage,
    iconStyle: ai.iconStyle,
    layout: ai.layout,
    photography: ai.photography,
    voice: ai.voice,
  };
}

/* 편집 UI 조각 */
function Acc({ title, open, children }) {
  return (
    <details className="bb-acc" open={open}>
      <summary>{title}<span className="bb-acc-caret">▾</span></summary>
      <div className="bb-acc-body">{children}</div>
    </details>
  );
}
function Field({ label, value, onChange, area, ph }) {
  return (
    <label className="bb-field">
      <span>{label}</span>
      {area
        ? <textarea rows={3} value={value} placeholder={ph} onChange={(e) => onChange(e.target.value)} />
        : <input value={value} placeholder={ph} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}
function ListEdit({ items, onChange, onAdd, onDel, ph, area }) {
  return (
    <div className="bb-list">
      {items.map((it, i) => (
        <div className="bb-list-row" key={i}>
          {area
            ? <textarea rows={2} value={it} placeholder={ph} onChange={(e) => onChange(i, e.target.value)} />
            : <input value={it} placeholder={ph} onChange={(e) => onChange(i, e.target.value)} />}
          <button className="bb-del" onClick={() => onDel(i)} title="삭제">✕</button>
        </div>
      ))}
      <button className="bb-add" onClick={onAdd}>+ 추가</button>
    </div>
  );
}

// 웹사이트 목업 — 히어로의 큰 워드마크 자리에 로고를 둔다
function WebMock({ logo, name }) {
  return (
    <div className="s-au">
      <div className="s-au-top">
        <span className="s-au-brand">{(name || "").toUpperCase()}</span>
        <span className="s-au-nav"><i>HOME</i><i>ABOUT</i><i>COLLECTION</i></span>
        <span className="s-au-buy">BUY</span>
      </div>
      <div className="s-au-hero">
        <div className="s-au-word"><LogoRender logo={{ ...logo, layout: "stacked" }} size="md" /></div>
        <span className="s-au-tag">Lorem ipsum dolor.</span>
        <div className="s-au-pedestal"><span className="s-au-scroll">⌄</span></div>
      </div>
    </div>
  );
}

// 명함 미니 목업 (명함 단계를 거치지 않았을 때 폴백)
function MiniCard({ logo, name, font, big }) {
  return (
    <div className={"minicard" + (big ? " minicard-big" : "")} style={{ fontFamily: `'${font}', sans-serif` }}>
      <LogoRender logo={{ ...logo, layout: "horizontal" }} size="sm" />
      <div className="minicard-info">
        <strong>{name}</strong>
        <span>대표 · 010-1234-5678</span>
        <span>hello@brand.com</span>
      </div>
    </div>
  );
}
