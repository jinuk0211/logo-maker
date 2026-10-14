import { useEffect, useState } from "react";
import Header from "./components/Header.jsx";
import Hero from "./components/Hero.jsx";
import TypeShowcase from "./components/TypeShowcase.jsx";
import IterateSection from "./components/IterateSection.jsx";
import MakeWall from "./components/MakeWall.jsx";
import Pricing from "./components/Pricing.jsx";
import Wizard from "./components/Wizard.jsx";
import Results from "./components/Results.jsx";
import Refine from "./components/Refine.jsx";
import BusinessCard from "./components/BusinessCard.jsx";
import BrandBook from "./components/BrandBook.jsx";
import Login from "./components/Login.jsx";
import MyLogos from "./components/MyLogos.jsx";
import { initAuth, currentUser } from "./lib/auth.js";
import { useLang } from "./lib/i18n.jsx";
import { makeCandidates, makeLogo } from "./lib/generate.js";
import { generateSymbol } from "./lib/api.js";
import { saveLogo } from "./lib/store.js";
import "./App.css";

// 개발용 딥링크: ?step=form|result|refine|card|book 으로 데모 브리프와 함께 특정 화면 바로 열기
const DEMO_BRIEF = {
  name: "그린하우스",
  business: "실내 식물 카페",
  iconWant: "나뭇잎",
  form: "combo",
  mood: "minimal",
  color: null,
};
const qp = new URLSearchParams(window.location.search);
const initStep = qp.get("step");

export default function App() {
  const [authed, setAuthed] = useState(null); // null = 세션 확인 중
  const { lang } = useLang();
  useEffect(() => {
    initAuth((s) => setAuthed(!!s)).then((s) => setAuthed(!!s));
  }, []);
  const [step, setStep] = useState(initStep || "intro"); // intro | form | result | refine | card | book | mine | login
  const [brief, setBrief] = useState(initStep && initStep !== "form" ? DEMO_BRIEF : null);
  const [candidates, setCandidates] = useState(
    initStep === "result"
      ? makeCandidates(DEMO_BRIEF, 2).map((c) =>
          qp.get("demoimg") ? { ...c, symbolImage: qp.get("demoimg") } : c
        )
      : []
  );
  const [generating, setGenerating] = useState(false);
  const [cardSpec, setCardSpec] = useState(null); // 명함 단계에서 고른 템플릿·테마·정보
  const [selected, setSelected] = useState(
    ["refine", "card", "book"].includes(initStep) ? makeLogo(DEMO_BRIEF, 909090) : null
  );

  // 후보 셸(레이아웃/컬러/텍스트)을 먼저 깔고, AI 가 그린 심볼을 도착순으로 채운다.
  // 생성에 실패한 후보는 목업 인라인 심볼로 남는다.
  function generateInto(targetBrief) {
    const shells = makeCandidates(targetBrief, 2).map((c) => ({
      ...c,
      symbolImage: null,
      loading: true,
    }));
    setCandidates(shells);
    setGenerating(false);

    shells.forEach((shell, i) => {
      generateSymbol(targetBrief, i)
        .then(({ imageUrl, palette, rationale, rawPng, provider }) => {
          const done = {
            ...shell,
            symbolImage: imageUrl,
            // 이미지에서 뽑은 실제 색으로 교체 (추출 실패 시 기존 유지)
            colors: palette ? { ...shell.colors, ...palette } : shell.colors,
            brandColor: palette?.symbol || shell.brandColor,
            // 목업 기본색과 구분 — 이 값이 있을 때만 COLOR 를 노출한다
            paletteFromLogo: !!palette,
            rationale, rawPng, provider, loading: false,
          };
          setCandidates((prev) => prev.map((c) => (c.id === shell.id ? done : c)));
          // 생성된 로고는 내 계정에 자동 저장 (60일 보관) — 실패해도 화면에는 영향 없음
          if (currentUser()) {
            saveLogo(targetBrief, done)
              .then((savedId) => setCandidates((prev) => prev.map((c) => (c.id === shell.id ? { ...c, savedId } : c))))
              .catch((e) => console.warn("자동 저장 실패:", e.message));
          }
        })
        .catch((err) => {
          // 조용히 목업으로 떨어지면 모델이 죽은 걸 눈치챌 수 없어 에러를 후보에 남긴다
          console.error("로고 생성 실패 → 목업 심볼로 대체:", err);
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === shell.id ? { ...c, loading: false, error: err.message || "생성 실패" } : c
            )
          );
        });
    });
  }

  function runGenerate(nextBrief0) {
    const nextBrief = { ...nextBrief0, lang }; // AI 설명문·브랜드북 언어
    setBrief(nextBrief);
    setStep("result");
    setGenerating(true);
    setCandidates([]);
    generateInto(nextBrief);
  }

  function regenerate() {
    setGenerating(true);
    setCandidates([]);
    generateInto(brief);
  }

  function pick(logo) {
    setSelected({ ...logo });
    setStep("refine");
  }

  // 로그인 전에는 아무 화면도 열지 않는다
  if (authed === null) return null; // 세션 복원 중 — 깜빡임 방지
  // 홈(intro)은 누구나 볼 수 있고, 만들기·내 로고 등 나머지 화면은 로그인부터.
  // 로그인 후엔 원래 가려던 화면으로 그대로 이어진다 (step 이 이미 바뀌어 있으므로).
  if (!authed && step !== "intro") {
    return (
      <Login
        onDone={() => { setAuthed(true); if (step === "login") setStep("intro"); }} // 헤더 '로그인'으로 왔으면 홈으로
        onBack={() => setStep("intro")}
      />
    );
  }

  return (
    <div className="app app-home">
      <Header
        onHome={() => setStep("intro")}
        onMine={() => setStep("mine")}
        onLogin={() => setStep("login")}
        authed={authed}
        onPrice={() => {
          setStep("intro");
          // intro 가 렌더된 뒤 요금 섹션으로
          requestAnimationFrame(() => document.getElementById("price")?.scrollIntoView({ behavior: "smooth" }));
        }}
        step={step}
      />

      <main className="stage">
        {step === "intro" && (
          <>
            <Hero onStart={() => setStep("form")} />
            <TypeShowcase onStart={() => setStep("form")} />
            <IterateSection />
            <Pricing onStart={() => setStep("form")} />
            <MakeWall />
          </>
        )}

        {step === "mine" && (
          <MyLogos
            onBack={() => setStep("intro")}
            onOpen={({ brief: b, logo }) => {
              setBrief(b);
              setSelected(logo);
              setStep("refine");
            }}
          />
        )}

        {step === "form" && (
          <Wizard initial={brief} onBack={() => setStep("intro")} onSubmit={runGenerate} />
        )}

        {step === "result" && (
          <Results
            brief={brief}
            candidates={candidates}
            generating={generating}
            onPick={pick}
            onRegenerate={regenerate}
            onEdit={() => setStep("form")}
            onMakeCard={(logo) => {
              setSelected({ ...logo });
              setStep("card");
            }}
          />
        )}

        {step === "refine" && selected && (
          <Refine
            logo={selected}
            brief={brief}
            setLogo={setSelected}
            onBack={() => setStep("result")}
            onMakeCard={() => setStep("card")}
          />
        )}

        {step === "card" && selected && (
          <BusinessCard
            logo={selected}
            brief={brief}
            initialSpec={cardSpec}
            onChange={setCardSpec}
            onBack={() => setStep("refine")}
            onMakeBook={() => setStep("book")}
          />
        )}

        {step === "book" && selected && (
          <BrandBook logo={selected} brief={brief} cardSpec={cardSpec} onBack={() => setStep("card")} />
        )}
      </main>
    </div>
  );
}
