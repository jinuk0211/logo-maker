import { useState } from "react";
import LogoRender from "./LogoRender.jsx";
import { FORMS, MOODS, PRESET_COLORS, isCompatible } from "../lib/logoConfig.js";
import { FORM_PREVIEW, MOOD_PREVIEW } from "../lib/previews.js";
import { samplesForForm, samplesForMood } from "../lib/samples.js";
import { knockoutWhite } from "../lib/knockout.js";
import { makeLogo } from "../lib/generate.js";
import { applyBrandColor } from "../lib/color.js";
import { useLang } from "../lib/i18n.jsx";
import "./Wizard.css";

const STEP_META = [
  {
    eyebrow: "이름",
    q: "서비스 이름이 어떻게 되나요?",
    hint: "로고에는 영문 이름이 들어갑니다. 이미지 AI 가 한글 글자를 정확히 그리지 못해서예요. 한글 이름은 명함·브랜드북에 쓰입니다.",
  },
  { eyebrow: "사업", q: "어떤 사업 / 서비스인가요?", hint: "예: 실내 식물 카페, 세무회계 사무소, 부동산 중개" },
  { eyebrow: "소재", q: "로고에 넣고 싶은 소재가 있나요?", hint: "예: 커피잔, 나뭇잎, 집 모양… 없으면 비워두세요." },
  { eyebrow: "형태", q: "로고 형태를 골라주세요", hint: "심볼·글자·조합 중 어떤 구성으로 만들지 선택하세요." },
  { eyebrow: "분위기", q: "어떤 분위기가 좋으세요?", hint: "전체적인 무드를 골라주세요. 형태와 안 맞는 건 흐리게 표시돼요." },
  { eyebrow: "컬러", q: "브랜드 컬러를 골라주세요", hint: "프리셋 또는 직접 색을 선택할 수 있어요." },
];
const LAST = STEP_META.length - 1;

// 위저드 왼쪽 미리보기 전용 기본 팔레트 — 색을 고르기 전엔 검정 계열, 고르면 그 색이 심볼에 입혀진다
const PREVIEW_PALETTE = { symbol: "#111827", accent: "#9ca3af", text: "#111827", plate: null };

/* 형태·분위기 스텝 공용 — 해당 선택지에 예시가 있을 때만 나타난다.
   누르면 왼쪽 미리보기에 얹히고, 다시 누르면 해제된다. */
function SampleField({ list, sample, onPick }) {
  if (!list.length) return null;
  return (
    <div className="pick-field">
      <span className="pick-label">
        Example
        <b>{sample ? "미리보기에 적용됨 · 다시 눌러 해제" : "눌러서 미리보기"}</b>
      </span>
      <div className="sample-row">
        {list.map((s) => (
          <button
            key={s.id}
            className={"sample" + (sample?.id === s.id ? " on" : "")}
            onClick={() => onPick(s)}
            aria-pressed={sample?.id === s.id}
            title={s.label}
          >
            <img src={s.src} alt={s.label} />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Wizard({ initial, onBack, onSubmit }) {
  const { lang } = useLang();
  const en = lang === "en"; // 영어 모드: 한글 이름을 따로 받지 않는다 (브랜드명 하나 = 로고·명함 모두)
  const _init = Number(new URLSearchParams(window.location.search).get("wstep")) || 0;
  const [step, setStep] = useState(Math.min(Math.max(_init, 0), LAST));
  const [name, setName] = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [business, setBusiness] = useState(initial?.business ?? "");
  const [iconWant, setIconWant] = useState(initial?.iconWant ?? "");
  const [form, setForm] = useState(initial?.form ?? "combo");
  const [mood, setMood] = useState(initial?.mood ?? "minimal");
  const [color, setColor] = useState(initial?.color ?? null);
  // 무드 예시 로고 — 고른 것을 왼쪽 미리보기에 얹는다
  const [sample, setSample] = useState(null); // { id, src } — src 는 누끼 딴 것

  const brief = {
    name: en ? (nameEn.trim() || "Brand") : (name.trim() || "브랜드"),
    nameEn: nameEn.trim(), // 로고 이미지·락업에 실제로 들어가는 이름
    business: business.trim(),
    iconWant: iconWant.trim(),
    form,
    mood,
    color,
  };

  const preview = makeLogo(brief, 424242); // 시드 고정 — 입력이 같으면 같은 목업
  // 예시를 골랐으면 목업 심볼 대신 그 이미지로 락업을 그린다 (브랜드명은 그대로 유지)
  const previewLogo = {
    ...preview,
    colors: applyBrandColor({ ...PREVIEW_PALETTE }, color),
    ...(sample ? { symbolImage: sample.src } : {}),
  };

  // 회색 패널 위에 떠 보이도록 흰 배경을 빼서 물린다
  async function chooseSample(s) {
    if (sample?.id === s.id) return setSample(null); // 다시 누르면 해제
    setSample({ id: s.id, src: await knockoutWhite(s.src) });
  }

  const canNext = step === 0 ? (en ? nameEn.trim().length > 0 : name.trim().length > 0 && nameEn.trim().length > 0) : true;

  // 형태 바꿀 때 분위기가 호환 안 되면 첫 호환 분위기로 이동
  function chooseForm(fid) {
    setForm(fid);
    setSample(null); // 형태가 바뀌면 예시는 초기화
    if (!isCompatible(fid, mood)) {
      const firstOk = MOODS.find((m) => isCompatible(fid, m.id));
      if (firstOk) setMood(firstOk.id);
    }
  }

  // Enter 로 다음 단계 — 한글 IME 조합 중 Enter 는 keydown 이 두 번 오므로(229) 무시.
  // 안 그러면 사업 단계에서 Enter 한 번에 소재 단계를 건너뛰고 조합 중 글자가 다음 칸에 들어간다.
  function onEnter(e) {
    if (e.key !== "Enter") return;
    if (e.nativeEvent?.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    next();
  }

  function next() {
    if (!canNext) return;
    if (step === LAST) onSubmit(brief);
    else setStep((s) => s + 1);
  }
  function back() {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  }

  const meta = STEP_META[step];

  return (
    <section className="wiz-step">
      <div className="step-shell">
        {/* 왼쪽: 로고 미리보기 */}
        <aside className="step-preview">
          <div className="preview-stage">
            <LogoRender logo={previewLogo} size="xl" />
          </div>
          {/* 이 미리보기는 목업이다 — 실제 생성물로 오해하지 않도록 분명히 밝힌다 */}
          <p className="preview-note">
            {sample
              ? "선택한 예시 로고입니다. 실제 생성 결과와는 다릅니다."
              : "예시 이미지입니다. 실제 로고는 마지막 단계에서 AI 가 새로 그립니다."}
          </p>
        </aside>

        {/* 오른쪽: 입력 컬럼 */}
        <div className="step-main">
          <button className="step-back" onClick={back}>
            ← {step === 0 ? "BACK TO HOME" : "BACK"}
          </button>

          <div className="stepper">
            {STEP_META.map((_, i) => (
              <span key={i} className={"seg-bar" + (i <= step ? " done" : "")} />
            ))}
          </div>
          <span className="step-eyebrow">
            STEP {step + 1} / {STEP_META.length} · {meta.eyebrow}
          </span>

          <h2 className="step-q">{meta.q}</h2>

          <div className="step-control" key={step}>
            {step === 0 && (
              <div className="step-stack">
                {!en && (
                  <div className="pick-field">
                    <span className="pick-label">
                      Korean name
                      <b>명함 · 브랜드북에 사용</b>
                    </span>
                    <input className="q-input step-name" placeholder="예: 그린하우스" value={name} autoFocus maxLength={20}
                      onChange={(e) => setName(e.target.value)} onKeyDown={onEnter} />
                  </div>
                )}
                <div className="pick-field">
                  <span className="pick-label">
                    {en ? "Brand name" : "English name"}
                    <b>{en ? "Shown in the logo, cards and brand book" : "로고에 들어갈 이름"}</b>
                  </span>
                  <input className="q-input step-name" placeholder={en ? "e.g. GREENHOUSE" : "예: GREENHOUSE"} value={nameEn} maxLength={24} autoFocus={en}
                    onChange={(e) => setNameEn(e.target.value)} onKeyDown={onEnter} />
                </div>
              </div>
            )}
            {step === 1 && (
              <input className="q-input step-name" placeholder="예: 실내 식물 카페, 세무회계 사무소…" value={business} autoFocus maxLength={40}
                onChange={(e) => setBusiness(e.target.value)} onKeyDown={onEnter} />
            )}
            {step === 2 && (
              <input className="q-input step-name" placeholder="예: 커피잔, 나뭇잎, 집 모양… (없으면 비워두기)" value={iconWant} autoFocus maxLength={40}
                onChange={(e) => setIconWant(e.target.value)} onKeyDown={onEnter} />
            )}

            {step === 3 && (
              <div className="step-stack">
                <div className="pick-field">
                  <span className="pick-label">
                    Select form
                    <b>{FORMS.find((f) => f.id === form)?.label}</b>
                  </span>
                  <div className="pick-grid pick-form">
                    {FORMS.map((f) => (
                      <button key={f.id} className={"pick" + (form === f.id ? " on" : "")} onClick={() => chooseForm(f.id)}>
                        <span className="pick-art" dangerouslySetInnerHTML={{ __html: FORM_PREVIEW[f.id] }} />
                        <strong>{f.label}</strong>
                        <em>{f.desc}</em>
                      </button>
                    ))}
                  </div>
                </div>
                <SampleField list={samplesForForm(form)} sample={sample} onPick={chooseSample} />
              </div>
            )}

            {step === 4 && (
              <div className="step-stack">
                <div className="pick-field">
                  <span className="pick-label">
                    Select mood
                    <b>{MOODS.find((m) => m.id === mood)?.label}</b>
                  </span>
                  <div className="pick-grid pick-mood">
                    {MOODS.map((m) => {
                      const ok = isCompatible(form, m.id);
                      return (
                        <button
                          key={m.id}
                          className={"pick" + (mood === m.id ? " on" : "") + (ok ? "" : " pick-off")}
                          disabled={!ok}
                          title={ok ? "" : "이 형태와는 안 맞아요"}
                          onClick={() => {
                            if (!ok) return;
                            setMood(m.id);
                            setSample(null); // 무드가 바뀌면 예시는 초기화
                          }}
                        >
                          <span className="pick-art" dangerouslySetInnerHTML={{ __html: MOOD_PREVIEW[m.id] }} />
                          <strong>{m.label}</strong>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <SampleField list={samplesForMood(mood)} sample={sample} onPick={chooseSample} />
              </div>
            )}

            {step === 5 && (
              <div className="pick-field">
                <span className="pick-label">
                  Select color
                  <b>{PRESET_COLORS.find((c) => c.color === color)?.label ?? (color ? color.toUpperCase() : "선택안함")}</b>
                </span>
                <div className="color-row">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.label}
                      className={"color-dot" + (c.color ? "" : " color-none") + (color === c.color ? " on" : "")}
                      onClick={() => setColor(c.color)}
                      title={c.label}
                      style={c.color ? { background: c.color } : undefined}
                    >
                      {!c.color && <span className="color-none-x">{c.label}</span>}
                    </button>
                  ))}
                  <label className="color-custom" title="직접 선택">
                    <input type="color" value={color || "#2f6bf6"} onChange={(e) => setColor(e.target.value)} />
                    <span>＋</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          <p className="step-hint">{meta.hint}</p>

          {/* 하단 풀폭 액션 바 */}
          <div className="bar-stack">
            {step === LAST ? (
              <button className="bar-btn bar-dark" onClick={() => onSubmit(brief)}>
                로고 생성하기 <span className="bar-ico">→</span>
              </button>
            ) : (
              <button className="bar-btn bar-dark" disabled={!canNext} onClick={next}>
                다음 <span className="bar-ico">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
