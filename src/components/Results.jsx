import { useEffect, useState } from "react";
import LogoRender from "./LogoRender.jsx";
import { symbolSvg } from "../lib/symbols.js";
import { downloadLogoPng, safeFileName } from "../lib/download.js";
import "./Results.css";

// 화면 연출용 수치 — 모델이 준 점수가 아니라 시드로 정해지는 값이다 (84~97%)
const aiScore = (logo) => 84 + (logo.seed % 14);
const PROVIDER_LABEL = { openai: "GPT", gemini: "제미나이" };

export default function Results({
  brief,
  candidates,
  generating,
  onPick,
  onRegenerate,
  onEdit,
  onMakeCard,
}) {
  const [focus, setFocus] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => setFocus(0), [candidates]);

  const logo = candidates[focus];
  const busy = generating || !logo || logo.loading;

  async function savePng() {
    if (!logo || saving) return;
    setSaving(true);
    try {
      await downloadLogoPng(logo, `${safeFileName(logo.name)}-logo.png`, "#ffffff");
    } catch (e) {
      console.error("PNG 저장 실패:", e);
      alert("PNG 저장에 실패했어요: " + (e.message || e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="dash">
      <div className="dash-shell">
        {/* 왼쪽: 선택된 로고 */}
        <aside className="dash-preview">
          <div className="dash-stage">
            {busy ? (
              <div className="gen-wait">
                <div className="spinner" />
                <strong>로고를 생성하고 있어요</strong>
                <em>AI 가 두 가지 시안을 그리는 중입니다 · 20초쯤 걸려요</em>
              </div>
            ) : (
              <LogoRender logo={logo} size="xl" />
            )}
          </div>

          {/* 후보 썸네일 */}
          <div className="thumbs">
            {candidates.map((cand, i) => (
              <button
                key={cand.id}
                className={"thumb" + (i === focus ? " on" : "")}
                onClick={() => setFocus(i)}
                aria-label={`후보 ${i + 1}`}
              >
                {cand.loading ? (
                  <span className="thumb-spin" />
                ) : cand.symbolImage ? (
                  <img className="thumb-img" src={cand.symbolImage} alt="" />
                ) : (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: symbolSvg(cand.symbolKey, {
                        color: cand.colors.plate ? cand.colors.plate : cand.colors.symbol,
                        accent: cand.colors.accent,
                        variant: cand.variant,
                        size: 30,
                      }),
                    }}
                  />
                )}
              </button>
            ))}
            <button className="thumb thumb-add" onClick={onRegenerate} title="후보 더 생성">
              ＋
            </button>
          </div>
        </aside>

        {/* 오른쪽: 정보 컬럼 */}
        <div className="dash-main">
          <button className="step-back" onClick={onEdit}>
            ← 브리프 수정
          </button>

          <span className="step-eyebrow">Step 2 / Results</span>

          <h1 className="dash-title">{brief?.name || "브랜드"}</h1>

          <div className="dash-meta">
            <span className="dash-score">
              AI 추천도 <b>{logo ? aiScore(logo) : "—"}%</b>
            </span>
            <span className="dash-dot">·</span>
            <span>{logo?.styleLabel}</span>
            {logo?.provider && PROVIDER_LABEL[logo.provider] && (
              <>
                <span className="dash-dot">·</span>
                <span>{PROVIDER_LABEL[logo.provider]}</span>
              </>
            )}
          </div>

          <div className="dash-fields">
            <div className="pick-field">
              <span className="pick-label">
                Select candidate
                <b>후보 {focus + 1} / {candidates.length || 1}</b>
              </span>
              <div className="cand-row">
                {candidates.map((cand, i) => (
                  <button
                    key={cand.id}
                    className={"cand" + (i === focus ? " on" : "")}
                    onClick={() => setFocus(i)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button className="cand cand-add" onClick={onRegenerate}>
                  ＋
                </button>
              </div>
            </div>

            {/* 목업 기본 팔레트(초록)를 브랜드 컬러인 양 보여주지 않는다 —
                실제 로고 이미지에서 색을 뽑아낸 뒤에만 노출 */}
            {logo?.paletteFromLogo && (
              <div className="pick-field">
                <span className="pick-label">
                  Color
                  <b>{logo.colors.mono ? "단색 로고" : "로고에서 추출"}</b>
                </span>
                <div className="color-row">
                  {/* 같은 값이 여러 칸에 들어가면 팔레트가 아니라 반복이 된다 — 중복 제거 */}
                  {[...new Set(
                    [logo.colors.symbol, logo.colors.accent, logo.colors.text, logo.colors.plate]
                      .filter(Boolean)
                      .map((c) => String(c).toUpperCase())
                  )].map((c) => (
                    <span key={c} className="color-dot" style={{ background: c }} title={c} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {logo?.error ? (
            <p className="dash-err">
              이 시안은 생성에 실패해서 임시 심볼로 대체했어요 — {logo.error}
            </p>
          ) : (
            logo?.rationale && <p className="dash-why">{logo.rationale}</p>
          )}

          <div className="bar-stack">
            <button className="bar-btn bar-dark" disabled={busy} onClick={() => onPick(logo)}>
              이 로고로 조율하기 <span className="bar-ico">→</span>
            </button>

            {/* 다운로드 — 조율 단계까지 안 가도 여기서 바로 받을 수 있게 */}
            <div className="bar-row">
              <button className="bar-btn bar-ghost" disabled={busy || saving} onClick={savePng}>
                {saving ? "저장 중…" : "PNG 저장"}
              </button>
              <button className="bar-btn bar-ghost" disabled={busy} onClick={() => onMakeCard(logo)}>
                명함 만들기
              </button>
            </div>

            <button className="bar-btn bar-ghost" onClick={onRegenerate}>
              다시 생성
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
