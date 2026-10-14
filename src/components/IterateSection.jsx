import { useRef, useState } from "react";
import { FORMS, MOODS, isCompatible } from "../lib/logoConfig.js";
import { MOOD_PREVIEW } from "../lib/previews.js";
import "./IterateSection.css";

/* 미리보기 주변에 떠 있는 컨트롤 카드들 — 전부 실제로 동작해서 가운데 로고를 바꾼다.
   형태/분위기/컬러/패드가 모두 하나의 state 로 모여 미리보기를 다시 그린다. */

const FORM_THUMBS = {
  symbol: (
    <path d="M18 6c4 2 6.5 4.5 8.5 8.5-4 2-6.5 4.5-8.5 8.5-2-4-4.5-6.5-8.5-8.5 4-2 6.5-4.5 8.5-8.5Z" fill="currentColor" />
  ),
  combo: (
    <>
      <circle cx="18" cy="11" r="6" fill="currentColor" />
      <rect x="8" y="21" width="20" height="4" rx="2" fill="currentColor" opacity=".55" />
    </>
  ),
  wordmark: (
    <>
      <rect x="6" y="12" width="24" height="5" rx="2.5" fill="currentColor" />
      <rect x="11" y="20" width="14" height="3" rx="1.5" fill="currentColor" opacity=".5" />
    </>
  ),
};

const PALETTES = [
  ["#2f6bf6", "#8b5cf6", "#16c48d", "#f59e0b"],
  ["#ef4444", "#ec4899", "#0ea5e9", "#1f2a44"],
  ["#0ea5e9", "#14b8a6", "#84cc16", "#f97316"],
];

const PROMPTS = [
  "잎사귀를 조금 더 둥글게, 선은 얇게 해줘",
  "각을 살려서 조금 더 날카롭게 해줘",
  "여백을 넉넉히 두고 담백하게 가줘",
  "곡선을 살려서 부드러운 인상으로",
];

/* 패드 3개 탭 — 축마다 실제로 미리보기에 반영되는 값이 다르다 */
const PAD_TABS = [
  { id: "color", label: "컬러", top: "선명하게", left: "쿨", right: "웜" },
  { id: "scale", label: "비율", top: "텍스트 크게", left: "작게", right: "크게" },
  { id: "layout", label: "배치", top: "간격 넓게", left: "가로", right: "세로" },
];

const clamp01 = (n) => Math.min(1, Math.max(0, n));
// 노브가 패드 밖으로 잘려 보이지 않게 가장자리를 살짝 남긴다
const clampPad = (n) => Math.min(0.9, Math.max(0.1, n));
const lerp = (a, b, t) => a + (b - a) * t;
const ARC_LEN = Math.PI * 48; // 다이얼 반원 길이 (반지름 48)

export default function IterateSection() {
  const [form, setForm] = useState("combo");
  const [mood, setMood] = useState("minimal");
  const [accent, setAccent] = useState("#2f6bf6");
  const [paletteIdx, setPaletteIdx] = useState(0);
  const [tab, setTab] = useState("scale");
  const [promptIdx, setPromptIdx] = useState(0);
  const [regenKey, setRegenKey] = useState(0);

  // 패드 좌표 — 탭별로 따로 기억해서 탭을 오가도 값이 안 날아간다 (x: 0~1 왼→오, y: 0~1 아래→위)
  const [pads, setPads] = useState({
    color: { x: 0.58, y: 0.62 },
    scale: { x: 0.5, y: 0.5 },
    layout: { x: 0.28, y: 0.5 },
  });

  const padRef = useRef(null);
  const dialRef = useRef(null);

  const swatches = PALETTES[paletteIdx];
  const moodIdx = Math.max(0, MOODS.findIndex((m) => m.id === mood));

  // 패드 값 → 미리보기 파라미터
  const scalePad = pads.scale;
  const layoutPad = pads.layout;
  const colorPad = pads.color;

  // 패드는 0.1~0.9 안에서만 움직이므로 0~1 로 펴서 쓴다
  const norm = (v) => clamp01((v - 0.1) / 0.8);

  const symbolScale = lerp(0.68, 1.32, norm(scalePad.x));
  const textScale = lerp(0.62, 1.42, norm(scalePad.y));
  const stacked = layoutPad.x > 0.5;
  const gap = lerp(2, 26, norm(layoutPad.y));
  // 컬러 탭을 만졌을 때만 패드 색이 accent 를 이긴다
  const [colorFromPad, setColorFromPad] = useState(false);
  const padColor = `hsl(${Math.round(lerp(210, 40, norm(colorPad.x)))} ${Math.round(
    lerp(35, 88, norm(colorPad.y))
  )}% 55%)`;
  const liveAccent = colorFromPad ? padColor : accent;

  const showSymbol = form !== "wordmark";
  const showText = form !== "symbol";

  // 호환 규칙 (위저드와 동일)
  function chooseForm(id) {
    setForm(id);
    if (!isCompatible(id, mood)) {
      const ok = MOODS.find((m) => isCompatible(id, m.id));
      if (ok) setMood(ok.id);
    }
  }
  function chooseMood(id) {
    setMood(id);
    if (!isCompatible(form, id)) setForm("combo"); // 조합형은 모든 무드와 호환
  }

  function regenerate() {
    setPromptIdx((i) => (i + 1) % PROMPTS.length);
    // 현재 형태와 호환되는 다음 무드로 넘어간다
    const next = [...Array(MOODS.length)]
      .map((_, k) => MOODS[(moodIdx + 1 + k) % MOODS.length])
      .find((m) => isCompatible(form, m.id));
    if (next) setMood(next.id);
    setRegenKey((k) => k + 1);
  }

  // 패드 드래그
  function padFromEvent(e) {
    const r = padRef.current.getBoundingClientRect();
    return {
      x: clampPad((e.clientX - r.left) / r.width),
      y: clampPad(1 - (e.clientY - r.top) / r.height), // 위로 갈수록 1
    };
  }
  function onPadDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const next = padFromEvent(e);
    setPads((p) => ({ ...p, [tab]: next }));
    if (tab === "color") setColorFromPad(true);
  }
  function onPadMove(e) {
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
    const next = padFromEvent(e);
    setPads((p) => ({ ...p, [tab]: next }));
  }

  // 분위기 다이얼: 반원 위 각도 → 무드 인덱스
  function moodFromEvent(e) {
    const r = dialRef.current.getBoundingClientRect();
    // 반원의 회전 중심은 아래쪽 가운데
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = r.top + r.height * 0.86 - e.clientY;
    let t = Math.atan2(dy, dx); // 왼쪽(π) → 오른쪽(0)
    t = clamp01(1 - t / Math.PI);
    return MOODS[Math.min(MOODS.length - 1, Math.round(t * (MOODS.length - 1)))];
  }
  function onDialDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    chooseMood(moodFromEvent(e).id);
  }
  function onDialMove(e) {
    if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
    chooseMood(moodFromEvent(e).id);
  }

  const padTab = PAD_TABS.find((t) => t.id === tab);
  const padPos = pads[tab];
  // 다이얼 노브 좌표 — 반원(중심 60,86 / 반지름 48) 위의 각도로 계산
  const dialT = moodIdx / (MOODS.length - 1);
  const dialAngle = Math.PI * (1 - dialT);
  const knob = { x: 60 + 48 * Math.cos(dialAngle), y: 86 - 48 * Math.sin(dialAngle) };

  return (
    <section className="it">
      <div className="it-head">
        <h2>
          만들고 나서도
          <br />
          계속 바꿀 수 있어요
        </h2>
        <p>
          한 번 뽑고 끝이 아닙니다. 카드를 직접 만져보세요 —
          <br />
          형태·컬러·비율이 가운데 로고에 바로 반영돼요.
        </p>
      </div>

      <div className="it-stage">
        {/* 중앙 미리보기 — 모든 컨트롤의 결과물 */}
        <div className="it-preview">
          <div
            key={regenKey}
            className={"itp" + (stacked ? " itp-v" : " itp-h")}
            style={{ "--accent": liveAccent, gap: `${gap}px` }}
          >
            {showSymbol && (
              <span
                className="itp-sym"
                style={{ "--sym": symbolScale }}
                dangerouslySetInnerHTML={{ __html: MOOD_PREVIEW[mood] }}
              />
            )}
            {showText && (
              <span className="itp-word" style={{ "--txt": textScale }}>
                NOVA
                {form === "wordmark" && <i className="itp-rule" />}
              </span>
            )}
          </div>
        </div>

        {/* AI 다듬기 */}
        <div className="it-card it-prompt">
          <div className="it-card-top">
            <strong>AI 다듬기</strong>
            <span>프롬프트</span>
          </div>
          <div className="it-textarea">{PROMPTS[promptIdx]}</div>
          <button className="it-btn" onClick={regenerate}>
            다시 생성
          </button>
        </div>

        {/* 형태 4종 */}
        <div className="it-card it-forms">
          <div className="it-card-top">
            <strong>형태</strong>
            <span className="it-chip">{FORMS.find((f) => f.id === form)?.label}</span>
          </div>
          <div className="it-thumbs">
            {FORMS.map((f) => (
              <button
                className={"it-thumb" + (form === f.id ? " on" : "")}
                key={f.id}
                title={f.label}
                aria-pressed={form === f.id}
                onClick={() => chooseForm(f.id)}
              >
                <svg viewBox="0 0 36 32">{FORM_THUMBS[f.id]}</svg>
              </button>
            ))}
          </div>
        </div>

        {/* 비율 / 배치 패드 */}
        <div className="it-card it-pad">
          <div className="it-tabs">
            {PAD_TABS.map((t) => (
              <button
                key={t.id}
                className={t.id === tab ? "on" : ""}
                onClick={() => {
                  setTab(t.id);
                  if (t.id === "color") setColorFromPad(true);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div
            className="it-padbox"
            ref={padRef}
            onPointerDown={onPadDown}
            onPointerMove={onPadMove}
          >
            <em className="pl-top">{padTab.top}</em>
            <em className="pl-left">{padTab.left}</em>
            <em className="pl-right">{padTab.right}</em>
            <span
              className="it-ring"
              style={{ left: `${padPos.x * 100}%`, top: `${(1 - padPos.y) * 100}%` }}
            >
              <i style={{ background: liveAccent }} />
            </span>
          </div>
        </div>

        {/* 컬러 */}
        <div className="it-card it-colors">
          <div className="it-card-top">
            <strong>컬러</strong>
            <button className="it-chip" onClick={() => setPaletteIdx((i) => (i + 1) % PALETTES.length)}>
              변경
            </button>
          </div>
          <div className="it-swatches">
            {swatches.map((c) => (
              <button
                className={"it-sw" + (!colorFromPad && accent === c ? " on" : "")}
                key={c}
                style={{ background: c }}
                aria-label={c}
                onClick={() => {
                  setAccent(c);
                  setColorFromPad(false);
                }}
              />
            ))}
          </div>
        </div>

        {/* 분위기 다이얼 */}
        <div className="it-card it-mood">
          <div className="it-card-top">
            <strong>분위기</strong>
            <span>{MOODS.length}종</span>
          </div>
          <div className="it-dial" ref={dialRef} onPointerDown={onDialDown} onPointerMove={onDialMove}>
            <svg viewBox="0 0 120 100">
              <path d="M14 86a48 48 0 1 1 92 0" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="18" strokeLinecap="round" />
              {/* 진행 호 — 현재 무드까지 채워진다 */}
              <path
                d="M14 86a48 48 0 1 1 92 0"
                fill="none"
                stroke={liveAccent}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDasharray={`${ARC_LEN * (moodIdx / (MOODS.length - 1))} 999`}
                opacity=".45"
              />
              <circle cx={knob.x} cy={knob.y} r="11" fill={liveAccent} />
            </svg>
            <span className="it-dial-icon">✦</span>
          </div>
          <div className="it-pill">{MOODS[moodIdx].label}</div>
        </div>

        {/* 내보내기 — 지금 상태 그대로 */}
        <div className="it-card it-export">
          <div className="it-card-top">
            <strong>내보내기</strong>
          </div>
          <div className="it-formats">
            <span>SVG</span>
            <i>·</i>
            <span>PNG</span>
          </div>
        </div>
      </div>
    </section>
  );
}
