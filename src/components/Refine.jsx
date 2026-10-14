import { useState } from "react";
import LogoRender from "./LogoRender.jsx";
import { LAYOUTS } from "../lib/logoConfig.js";
import { editSymbol } from "../lib/api.js";
import { downloadLogoPng, safeFileName } from "../lib/download.js";
import { saveLogo } from "../lib/store.js";
import "./Refine.css";

const BGS = [
  { id: "checker", label: "투명" },
  { id: "light", label: "밝게" },
  { id: "dark", label: "어둡게" },
];
const EDIT_CHIPS = ["더 단순하게", "더 둥글게", "선을 굵게", "더 미니멀하게", "심볼을 크게"];

export default function Refine({ logo, brief, setLogo, onBack, onMakeCard }) {
  const [cloud, setCloud] = useState(logo.savedId ? "saved" : ""); // "" | saving | saved | error:…
  async function saveToAccount() {
    setCloud("saving");
    try { await saveLogo(brief, logo); setCloud("saved"); }
    catch (e) { setCloud("error:" + (e.message || "저장 실패")); }
  }
  const [bg, setBg] = useState("checker");
  const [editText, setEditText] = useState("");
  const [history, setHistory] = useState([]); // AI 수정 전 로고들 — 되돌리기용
  const [editing, setEditing] = useState(false);
  const [editErr, setEditErr] = useState("");
  const [saving, setSaving] = useState(false);

  const canEdit = !!logo.rawPng;
  const safeName = () => safeFileName(logo.name);

  async function applyEdit(text) {
    const instruction = (text ?? editText).trim();
    if (!instruction || !logo.rawPng || editing) return;
    setEditing(true);
    setEditErr("");
    try {
      const { imageUrl, rawPng, provider } = await editSymbol(
        logo.rawPng, instruction, brief, logo.provider
      );
      setHistory((h) => [...h, logo].slice(-10)); // 최근 10단계까지
      setLogo({ ...logo, symbolImage: imageUrl, rawPng, provider });
      setEditText("");
    } catch (e) {
      setEditErr(e.message || "수정 실패");
    } finally {
      setEditing(false);
    }
  }

  function undoEdit() {
    if (!history.length || editing) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setLogo(prev);
  }

  async function downloadPngLogo() {
    if (saving) return;
    setSaving(true);
    try {
      // 투명(checker)이면 배경 없이 — 캔버스로 직접 그리므로 알파가 그대로 남는다
      await downloadLogoPng(
        logo,
        `${safeName()}-logo.png`,
        bg === "dark" ? "#141a2e" : bg === "light" ? "#ffffff" : undefined
      );
    } catch (e) {
      console.error("PNG 저장 실패:", e);
      alert("PNG 저장에 실패했어요: " + (e.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="refine">
      <div className="refine-shell">
        {/* 왼쪽: 미리보기 */}
        <aside className="refine-preview">
          <div className={`refine-stage bg-${bg}`}>
            <LogoRender logo={logo} size="xl" />
            {editing && (
              <div className="edit-overlay">
                <div className="spinner" />
                <span>AI가 다듬는 중…</span>
              </div>
            )}
          </div>

          <div className="pick-field refine-bgfield">
            <span className="pick-label">
              Background
              <b>{BGS.find((b) => b.id === bg)?.label}</b>
            </span>
            <div className="pbt-row">
              {BGS.map((b) => (
                <button
                  key={b.id}
                  className={"pbt" + (bg === b.id ? " on" : "")}
                  onClick={() => setBg(b.id)}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* 오른쪽: 컨트롤 */}
        <div className="refine-main">
          <button className="step-back" onClick={onBack}>
            ← 후보 다시 고르기
          </button>

          <span className="step-eyebrow">Step 3 / Refine</span>
          <h1 className="refine-title">세부 조정으로 완성하기</h1>
          <div className="refine-meta">
            <span>{logo.styleLabel}</span>
            <span className="refine-dot">·</span>
            <span>PNG · 투명 배경</span>
          </div>

          <div className="refine-fields">
            {/* AI 로 다듬기 */}
            {canEdit && (
              <div className="pick-field">
                <span className="pick-label">
                  Retouch with AI
                  <b>이 로고를 기반으로 다시 그려요</b>
                </span>
                <div className="edit-row">
                  <input
                    className="q-input"
                    placeholder="예: 잎을 더 둥글게, 선을 얇게, 심볼을 단순하게…"
                    value={editText}
                    disabled={editing}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.nativeEvent?.isComposing && applyEdit()}
                  />
                  <button
                    className="bar-btn bar-dark edit-apply"
                    disabled={editing || !editText.trim()}
                    onClick={() => applyEdit()}
                  >
                    적용
                  </button>
                </div>
                {history.length > 0 && (
                  <button className="edit-undo" disabled={editing} onClick={undoEdit}>
                    ↶ 이전 이미지로 되돌리기 <small>({history.length})</small>
                  </button>
                )}
                <div className="edit-chips">
                  {/* 칩은 바로 적용하지 않고 입력칸에 넣기만 — 조합해서 '적용' 으로 보낸다 */}
                  {EDIT_CHIPS.map((t) => (
                    <button
                      key={t}
                      className="edit-chip"
                      disabled={editing}
                      onClick={() => setEditText((v) => { const cur = v.trim(); return cur ? (cur.includes(t) ? cur : `${cur}, ${t}`) : t; })}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {editErr && <p className="edit-err">{editErr}</p>}
              </div>
            )}

            {/* 비율 / 레이아웃 — 텍스트가 있는 형태에서만 의미 있음 */}
            {logo.includeText && (
              <>
                <div className="pick-field">
                  <span className="pick-label">
                    Icon / text ratio
                    <b>{logo.ratio}%</b>
                  </span>
                  <input
                    type="range" min="0" max="100" value={logo.ratio}
                    onChange={(e) => setLogo({ ...logo, ratio: Number(e.target.value) })}
                    className="slider"
                  />
                  <div className="slider-legend">
                    <span>텍스트 크게</span>
                    <span>아이콘 크게</span>
                  </div>
                </div>

                <div className="pick-field">
                  <span className="pick-label">
                    Layout
                    <b>{LAYOUTS.find((l) => l.id === logo.layout)?.label}</b>
                  </span>
                  <div className="cand-row">
                    {LAYOUTS.map((l) => (
                      <button
                        key={l.id}
                        className={"cand" + (logo.layout === l.id ? " on" : "")}
                        onClick={() => setLogo({ ...logo, layout: l.id })}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bar-stack">
            <button className="bar-btn bar-dark" onClick={onMakeCard}>
              이 로고로 명함 만들기 <span className="bar-ico">→</span>
            </button>
            <button className="bar-btn bar-ghost" disabled={saving} onClick={downloadPngLogo}>
              {saving ? "저장 중…" : "PNG 저장"}
            </button>
            <button className="bar-btn bar-ghost" disabled={cloud === "saving"} onClick={saveToAccount}>
              {cloud === "saving" ? "저장 중…" : cloud === "saved" ? "✓ 내 계정에 저장됨" : "내 계정에 저장"}
            </button>
            {cloud.startsWith("error:") && <p className="login-err">{cloud.slice(6)}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
