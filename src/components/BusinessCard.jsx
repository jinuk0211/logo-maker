import { useEffect, useRef, useState } from "react";
import { fontEmbedCSSFor } from "../lib/fontEmbed.js";
import { downloadNodeAsPng } from "../lib/download.js";
import LogoRender from "./LogoRender.jsx";
import CardFront, { cardAccent } from "./CardFront.jsx";
import { FONT_GROUPS, DEFAULT_FONT, loadCardFonts } from "../lib/fonts.js";
import { useLang } from "../lib/i18n.jsx";
import "./BusinessCard.css";

const TEMPLATES = [
  { id: "classic", label: "클래식" },
  { id: "modern", label: "모던" },
  { id: "minimal", label: "미니멀" },
  { id: "split", label: "분할" },
];
// 뒷면 구성 — 앞면과 달리 정보가 없어서 조형만 남는다
const BACK_LAYOUTS = [
  { id: "mark", label: "심볼만" },
  { id: "lockup", label: "심볼 + 이름" },
  { id: "wordmark", label: "이름만" },
  { id: "tagline", label: "심볼 + 문구" },
  { id: "plain", label: "빈 면" },
];
const BACK_BGS = [
  { id: "brand", label: "브랜드색" },
  { id: "gradient", label: "그라데이션" },
  { id: "light", label: "화이트" },
  { id: "dark", label: "다크" },
];

const THEMES = [
  { id: "light", label: "화이트" },
  { id: "dark", label: "다크" },
  { id: "brand", label: "브랜드" },
];

const FIELDS = [
  { key: "company", label: "회사명", ph: "브랜드명" },
  { key: "person", label: "이름", ph: "홍길동" },
  { key: "title", label: "직함", ph: "대표 / CEO" },
  { key: "phone", label: "전화", ph: "010-1234-5678" },
  { key: "email", label: "이메일", ph: "hello@brand.com" },
  { key: "website", label: "웹사이트", ph: "www.brand.com" },
  { key: "address", label: "주소", ph: "서울시 강남구" },
];

export default function BusinessCard({ logo, brief, initialSpec, onChange, onBack, onMakeBook }) {
  const accent = cardAccent(logo);
  const { lang } = useLang();
  const en = lang === "en";

  // 예시 값도 언어에 맞게 — 영어 모드면 영어 이름·직함·주소
  const [card, setCard] = useState(initialSpec?.card || (en ? {
    company: brief?.nameEn || brief?.name || logo.name || "Brand",
    person: "Jane Doe",
    title: "Founder / CEO",
    phone: "+1 (555) 123-4567",
    email: "hello@brand.com",
    website: "www.brand.com",
    address: "123 Market St, San Francisco",
  } : {
    company: brief?.name || logo.name || "브랜드",
    person: "홍길동",
    title: "대표 / CEO",
    phone: "010-1234-5678",
    email: "hello@brand.com",
    website: "www.brand.com",
    address: "서울시 강남구 테헤란로",
  }));
  const [template, setTemplate] = useState(
    initialSpec?.template || new URLSearchParams(window.location.search).get("tmpl") || "classic"
  );
  const [theme, setTheme] = useState(
    initialSpec?.theme || new URLSearchParams(window.location.search).get("theme") || "light"
  );
  const [side, setSide] = useState(
    new URLSearchParams(window.location.search).get("side") || "front"
  );
  const [font, setFont] = useState(initialSpec?.font || DEFAULT_FONT);
  const [logoScale, setLogoScale] = useState(initialSpec?.logoScale ?? 1); // 앞면 로고 크기 배율
  const [textScale, setTextScale] = useState(initialSpec?.textScale ?? 1); // 앞면 글자 크기 배율
  // 브랜드북 활용 예시가 이 명함을 그대로 쓰도록 선택 상태를 올려보낸다
  useEffect(() => { onChange?.({ card, template, theme, font, logoScale, textScale }); }, [card, template, theme, font, logoScale, textScale, onChange]);
  const [backLayout, setBackLayout] = useState("lockup");
  const [backBg, setBackBg] = useState("brand");
  const [tagline, setTagline] = useState("");
  useEffect(() => { loadCardFonts(); }, []);

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setCard((c) => ({ ...c, [k]: v }));

  async function download(which) {
    const node = which === "back" ? backRef.current : frontRef.current;
    if (!node) return;
    setSaving(true);
    // 보고 있지 않은 면은 display:none 이라 그대로 찍으면 빈 이미지가 된다 — 캡처 동안만 펼친다
    const prevDisplay = node.style.display;
    node.style.display = "flex";
    try {
      // 로고 PNG 와 같은 경로 — 폰트·이미지 디코딩을 기다리고 한 번 예열한 뒤 캡처해서
      // 심볼이 빠진 채 저장되는 일을 막는다. 폰트는 실제 쓰는 것만 인라인.
      await downloadNodeAsPng(
        node,
        `${(card.company || "card").replace(/\s+/g, "-")}-명함-${which}.png`,
        undefined,
        { fontEmbedCSS: await fontEmbedCSSFor(node) }
      );
    } catch (e) {
      console.error(e);
      alert("이미지 저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      node.style.display = prevDisplay;
      setSaving(false);
    }
  }

  const logoLockup = { ...logo, name: card.company };
  // 뒷면 배경이 밝으면 잉크색, 어두우면 흰색 (로고 이미지는 filter 로 반전)
  const backOnColor = backBg !== "light";

  return (
    <section className="bcard">
      <div className="bcard-shell">
        {/* 왼쪽: 명함 미리보기 */}
        <aside className="bcard-preview">
          <div className="bcard-stage">
            {/* 앞면 — CardFront (브랜드북과 공용) */}
            <CardFront
              innerRef={frontRef}
              spec={{ card, template, theme, font, logoScale, textScale }}
              logo={logo}
              style={{ display: side === "front" ? "flex" : "none" }}
            />

            {/* 뒷면 — 구성·배경을 따로 고를 수 있다 */}
            <div
              ref={backRef}
              className={`bc bc-back back-${backLayout} backbg-${backBg}`}
              style={{
                "--accent": accent,
                fontFamily: `'${font}', sans-serif`,
                display: side === "back" ? "flex" : "none",
              }}
            >
              {backLayout !== "plain" && backLayout !== "wordmark" && (
                <div className={"bc-back-mark" + (backOnColor ? " bc-logo-reverse" : "")}>
                  <LogoRender
                    logo={{ ...logoLockup, layout: "icon", includeText: false, ratio: 60 }}
                    size={backLayout === "mark" ? "md" : "sm"}
                  />
                </div>
              )}
              {(backLayout === "lockup" || backLayout === "wordmark") && (
                <div className="bc-back-name">{card.company}</div>
              )}
              {backLayout === "tagline" && tagline.trim() && (
                <div className="bc-back-tag">{tagline}</div>
              )}
            </div>
          </div>

          <div className="bcard-sidetab">
            <button className={side === "front" ? "on" : ""} onClick={() => setSide("front")}>
              앞면
            </button>
            <button className={side === "back" ? "on" : ""} onClick={() => setSide("back")}>
              뒷면
            </button>
          </div>
        </aside>

        {/* 오른쪽: 컨트롤 컬럼 */}
        <div className="bcard-main">
          <button className="step-back" onClick={onBack}>
            ← 로고 조율로 돌아가기
          </button>

          <span className="step-eyebrow">Step 4 / Card</span>
          <h1 className="bcard-title">{card.company || "브랜드"}</h1>
          <div className="bcard-meta">
            완성한 로고와 브랜드 컬러가 그대로 적용됐어요. 정보만 채우면 끝.
          </div>

          <div className="bcard-fields">
            <div className="pick-field">
              <span className="pick-label">
                Layout
                <b>{TEMPLATES.find((t) => t.id === template)?.label}</b>
              </span>
              <div className="tmpl-row">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    className={"tmpl-btn" + (template === t.id ? " on" : "")}
                    onClick={() => setTemplate(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {template !== "minimal" && (
              <div className="pick-field">
                <span className="pick-label">
                  Logo size
                  <b>{Math.round(logoScale * 100)}%</b>
                </span>
                <input
                  type="range"
                  className="slider"
                  min="0.6"
                  max="2"
                  step="0.05"
                  value={logoScale}
                  onChange={(e) => setLogoScale(Number(e.target.value))}
                  aria-label="로고 크기"
                />
                <div className="slider-legend"><span>작게</span><span>기본</span><span>크게</span></div>
              </div>
            )}

            <div className="pick-field">
              <span className="pick-label">
                Front theme
                <b>{THEMES.find((t) => t.id === theme)?.label}</b>
              </span>
              <div className="tmpl-row">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={"tmpl-btn" + (theme === t.id ? " on" : "")}
                    onClick={() => setTheme(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pick-field">
              <span className="pick-label">
                Back side
                <b>
                  {BACK_LAYOUTS.find((l) => l.id === backLayout)?.label} ·{" "}
                  {BACK_BGS.find((b) => b.id === backBg)?.label}
                </b>
              </span>
              <div className="tmpl-row back-layout-row">
                {BACK_LAYOUTS.map((l) => (
                  <button
                    key={l.id}
                    className={"tmpl-btn" + (backLayout === l.id ? " on" : "")}
                    onClick={() => { setBackLayout(l.id); setSide("back"); }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="tmpl-row back-bg-row">
                {BACK_BGS.map((b) => (
                  <button
                    key={b.id}
                    className={"tmpl-btn" + (backBg === b.id ? " on" : "")}
                    onClick={() => { setBackBg(b.id); setSide("back"); }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              {backLayout === "tagline" && (
                <input
                  className="q-input"
                  placeholder="뒷면에 넣을 문구 — 예: 당신의 하루에 초록을"
                  value={tagline}
                  maxLength={40}
                  onChange={(e) => setTagline(e.target.value)}
                />
              )}
            </div>

            <div className="pick-field">
              <span className="pick-label">
                Font
                <b>{font}</b>
              </span>
              <select
              className="font-select"
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={{ fontFamily: `'${font}', sans-serif` }}
            >
              {FONT_GROUPS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.fonts.map((f) => (
                    <option key={f.family} value={f.family} style={{ fontFamily: `'${f.family}', sans-serif` }}>
                      {f.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
              <div className="pick-field" style={{ marginTop: 14 }}>
                <span className="pick-label">
                  Text size
                  <b>{Math.round(textScale * 100)}%</b>
                </span>
                <input type="range" className="slider" min="0.7" max="1.6" step="0.05" value={textScale}
                  onChange={(e) => setTextScale(Number(e.target.value))} aria-label="글자 크기" />
                <div className="slider-legend"><span>작게</span><span>기본</span><span>크게</span></div>
              </div>
              <p className="font-preview" style={{ fontFamily: `'${font}', sans-serif` }}>
                가나다 ABC 123 — 미리보기
              </p>
            </div>

            <div className="pick-field">
              <span className="pick-label">Card details</span>
              <div className="bc-fields">
                {FIELDS.map((f) => (
                  <label key={f.key} className="bc-field">
                    <span>{f.label}</span>
                    <input
                      value={card[f.key]}
                      placeholder={f.ph}
                      onChange={(e) => set(f.key, e.target.value)}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="bar-stack">
            {onMakeBook && (
              <button className="bar-btn bar-dark" onClick={onMakeBook}>
                브랜드북 만들기 <span className="bar-ico">→</span>
              </button>
            )}
            <button
              className={"bar-btn " + (onMakeBook ? "bar-ghost" : "bar-dark")}
              disabled={saving}
              onClick={() => download(side)}
            >
              {saving ? "저장 중…" : `${side === "back" ? "뒷면" : "앞면"} PNG 저장`}
            </button>
            <div className="bar-row">
              <button className="bar-btn bar-ghost" disabled={saving} onClick={() => download("front")}>
                앞면 저장
              </button>
              <button className="bar-btn bar-ghost" disabled={saving} onClick={() => download("back")}>
                뒷면 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
