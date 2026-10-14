// 로고 형태(form) × 분위기(mood) · 컬러 · 레이아웃 정의
export const FORMS = [
  { id: "symbol", label: "심볼형", desc: "텍스트 없이 도형만", hint: "a single symbol / icon mark only", text: false },
  { id: "combo", label: "조합형", desc: "심볼 + 브랜드명", hint: "a symbol mark with the brand name locked up together", text: true },
  { id: "wordmark", label: "워드마크", desc: "브랜드명 글자를 디자인", hint: "a stylized wordmark — the brand name typography itself, no separate icon", text: true },
];

export const MOODS = [
  { id: "minimal", label: "미니멀", hint: "minimal, clean, timeless, refined, lots of negative space" },
  { id: "tech", label: "테크", hint: "futuristic geometric tech, sharp modern edges" },
  { id: "luxury", label: "럭셔리", hint: "elegant luxury, premium, sophisticated" },
  { id: "retro", label: "레트로", hint: "retro vintage, nostalgic, classic feel" },
  { id: "handdrawn", label: "핸드드로운", hint: "hand drawn organic sketch, warm and casual" },
  { id: "bold", label: "볼드", hint: "bold brutalist, heavy thick strokes, strong high contrast" },
  {
    id: "character",
    label: "캐릭터",
    // "cute / expressive" 는 카와이 스티커를 부른다 — 마스코트를 '마크'로 환원하도록 지시
    hint: "a mascot reduced to a brand mark: the creature constructed from a few simple geometric shapes with one consistent line weight, a bold silhouette that still reads at 24px, facial detail pared down to the bare minimum — a logo mark, never a cartoon illustration or sticker",
  },
  { id: "dynamic", label: "다이내믹", hint: "dynamic sense of motion and flow, energetic" },
];

// 호환 매트릭스 — 형태별 사용 불가(×) 분위기
export const INCOMPATIBLE = {
  wordmark: ["character"],
};

export const DEFAULT_PALETTE = { symbol: "#10c98c", accent: "#a7f3d0", text: "#1a2238", plate: null };

// 브랜드 컬러 프리셋 (null = 색을 고르지 않음 — 무드 팔레트나 모델 판단에 맡긴다)
export const PRESET_COLORS = [
  { id: null, label: "선택안함", color: null },
  { id: "blue", label: "블루", color: "#2f6bf6" },
  { id: "green", label: "그린", color: "#16c48d" },
  { id: "navy", label: "네이비", color: "#1f2a44" },
  { id: "red", label: "레드", color: "#ef4444" },
  { id: "orange", label: "오렌지", color: "#f59e0b" },
  { id: "purple", label: "퍼플", color: "#8b5cf6" },
  { id: "pink", label: "핑크", color: "#ec4899" },
  { id: "teal", label: "틸", color: "#0ea5e9" },
];

export const LAYOUTS = [
  { id: "horizontal", label: "가로" },
  { id: "stacked", label: "세로" },
  { id: "badge", label: "뱃지" },
];

export const formById = (id) => FORMS.find((f) => f.id === id) || FORMS[1];
export const moodById = (id) => MOODS.find((m) => m.id === id) || MOODS[0];
export const isCompatible = (formId, moodId) => !(INCOMPATIBLE[formId] || []).includes(moodId);
