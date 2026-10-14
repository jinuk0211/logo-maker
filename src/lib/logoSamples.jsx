/* 랜딩에서 쓰는 샘플 로고 모음.
   art(ink, accent) 로 색을 주입받아 밝은 판/어두운 판 어디서든 쓰인다. */

export const SAMPLES = [
  {
    id: "nova",
    brand: "NOVA",
    image: "/Logo/nova.jpg",
    kind: "심볼형 · 미니멀",
    title: ["도형 하나로", "기억되는 브랜드"],
    bg: "#e9edf4",
    ink: "#16233c",
    accent: "#2f6bf6",
    art: (ink, accent) => (
      <>
        <path
          d="M60 12c14 6 22 14 28 28-14 6-22 14-28 28-6-14-14-22-28-28 14-6 22-14 28-28Z"
          fill={accent}
        />
        <circle cx="60" cy="40" r="7" fill="#fff" />
        <text x="60" y="82" textAnchor="middle" fill={ink} fontSize="19" fontWeight="800" letterSpacing="2">
          NOVA
        </text>
      </>
    ),
  },
  {
    id: "moca",
    brand: "MOCA",
    image: "/Logo/moca.jpg", // 실제 생성 결과물 — 있으면 art() 대신 이 이미지를 쓴다
    kind: "워드마크 · 레트로",
    title: ["오래 봐도", "질리지 않는 워드마크"],
    bg: "#f1ece3",
    ink: "#3a2e24",
    accent: "#a9754a",
    art: (ink, accent) => (
      <>
        <circle cx="60" cy="48" r="34" fill="none" stroke={ink} strokeWidth="3" />
        <circle cx="60" cy="48" r="28" fill="none" stroke={ink} strokeWidth="1.2" />
        <path
          d="M50 34h15v9a7.5 7.5 0 0 1-15 0v-9Zm15 1.5h3.5a3.8 3.8 0 0 1 0 7.6H65"
          fill="none"
          stroke={accent}
          strokeWidth="2.6"
        />
        <text x="60" y="65" textAnchor="middle" fill={ink} fontSize="8.5" fontWeight="700" letterSpacing="2.5">
          MOCA
        </text>
        <path d="M46 70h28" stroke={ink} strokeWidth="1.2" />
      </>
    ),
  },
  {
    id: "lumin",
    brand: "lumin",
    kind: "워드마크 · 모던",
    title: ["이름 자체가", "디자인이 되는"],
    bg: "#16233c",
    ink: "#ffffff",
    accent: "#7aa5ff",
    art: (ink, accent) => (
      <>
        <text x="60" y="56" textAnchor="middle" fill={ink} fontSize="26" fontWeight="800" letterSpacing="-1">
          lumin
        </text>
        <rect x="30" y="64" width="60" height="4" rx="2" fill={accent} />
      </>
    ),
  },
  {
    id: "peak",
    brand: "PEAK",
    image: "/Logo/peak.jpg",
    kind: "조합형 · 볼드",
    title: ["심볼과 이름을", "한 몸으로"],
    bg: "#e6efe9",
    ink: "#1d3a2b",
    accent: "#2f8f5f",
    art: (ink, accent) => (
      <>
        <path d="M34 54 52 26l12 18 8-11 14 21H34Z" fill={ink} />
        <circle cx="82" cy="24" r="7" fill={accent} />
        <text x="60" y="80" textAnchor="middle" fill={ink} fontSize="16" fontWeight="700" letterSpacing="1.5">
          PEAK
        </text>
      </>
    ),
  },
  {
    id: "orbit",
    brand: "ORBIT",
    image: "/Logo/orbit.jpg",
    kind: "심볼형 · 테크",
    title: ["기술적인 인상을", "단정한 선으로"],
    bg: "#1f4a58",
    ink: "#eaf6f8",
    accent: "#6fd0e0",
    art: (ink, accent) => (
      <>
        <ellipse cx="60" cy="40" rx="30" ry="12" fill="none" stroke={ink} strokeWidth="2.6" transform="rotate(-28 60 40)" />
        <ellipse cx="60" cy="40" rx="30" ry="12" fill="none" stroke={ink} strokeWidth="2.6" transform="rotate(28 60 40)" />
        <circle cx="60" cy="40" r="8" fill={accent} />
        <text x="60" y="82" textAnchor="middle" fill={ink} fontSize="15" fontWeight="700" letterSpacing="3">
          ORBIT
        </text>
      </>
    ),
  },
  {
    id: "fern",
    brand: "FERN",
    image: "/Logo/fern.jpg",
    kind: "조합형 · 내추럴",
    title: ["자연스러운 무드를", "부드러운 곡선으로"],
    bg: "#eceee4",
    ink: "#26361f",
    accent: "#5f9140",
    art: (ink, accent) => (
      <>
        <path d="M60 12c14 12 14 32 0 44-14-12-14-32 0-44Z" fill={accent} />
        <path d="M60 18v40" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <text x="60" y="82" textAnchor="middle" fill={ink} fontSize="17" fontWeight="700" letterSpacing="2">
          FERN
        </text>
      </>
    ),
  },
];
