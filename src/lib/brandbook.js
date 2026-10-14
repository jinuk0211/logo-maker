// 브랜드북 콘텐츠 도출 — brief/logo 로부터 각 페이지에 들어갈 텍스트·컬러·규정을 만든다.
import { tr } from "./i18n.tr.js";
import { moodById, formById } from "./logoConfig.js";
import { ALL_FONTS } from "./fonts.js";

/* 분위기별 추천 폰트 (FONT_GROUPS 안에 있는 패밀리) */
const MOOD_FONT = {
  minimal: { family: "Gothic A1", reason: "여백이 살아나는 정갈한 고딕" },
  tech: { family: "IBM Plex Sans KR", reason: "정밀하고 현대적인 테크 고딕" },
  luxury: { family: "Noto Serif KR", reason: "품격이 느껴지는 명조 세리프" },
  retro: { family: "Gowun Batang", reason: "따뜻한 클래식 세리프" },
  handdrawn: { family: "Gaegu", reason: "손글씨의 편안한 정감" },
  bold: { family: "Black Han Sans", reason: "강렬한 임팩트의 디스플레이" },
  character: { family: "Jua", reason: "동글동글 친근한 캐릭터 감성" },
  dynamic: { family: "Do Hyeon", reason: "속도감 있는 굵은 고딕" },
};
export function recommendFont(logo = {}, brief = {}) {
  const mood = logo.mood || brief.mood || "minimal";
  const r = MOOD_FONT[mood] || MOOD_FONT.minimal;
  const label = (ALL_FONTS.find((f) => f.family === r.family) || {}).label || r.family;
  return { family: r.family, label, reason: r.reason };
}

/* 색 변환 */
export function hexToRgb(h) {
  h = String(h || "#000000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
export function rgbStr(hex) {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}
// 근사 CMYK (0-100) — 인쇄 참고용
export function cmykStr(hex) {
  let [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return "0, 0, 0, 100";
  const c = (1 - r - k) / (1 - k);
  const m = (1 - g - k) / (1 - k);
  const y = (1 - b - k) / (1 - k);
  return [c, m, y, k].map((v) => Math.round(v * 100)).join(", ");
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const isLight = (hex) => luminance(hex) > 0.6;
export const readableOn = (hex) => (isLight(hex) ? "#1a2238" : "#ffffff");
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return "#" + [0, 1, 2].map((i) =>
    Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, "0")
  ).join("");
}
export const lighten = (c, t) => mix(c, "#ffffff", t);
export const darken = (c, t) => mix(c, "#000000", t);

/* 분위기별 한글 키워드 & 톤 문장 */
const MOOD_KEYWORDS = {
  minimal: ["간결한", "정제된", "신뢰감 있는", "여백의 미"],
  tech: ["미래지향적", "정밀한", "혁신적인", "스마트한"],
  luxury: ["고급스러운", "우아한", "품격 있는", "섬세한"],
  retro: ["클래식한", "따뜻한", "향수를 부르는", "정감 있는"],
  handdrawn: ["편안한", "손맛 있는", "친근한", "자연스러운"],
  bold: ["강렬한", "자신감 있는", "선명한", "임팩트 있는"],
  character: ["귀여운", "친근한", "생동감 있는", "다정한"],
  dynamic: ["역동적인", "활기찬", "속도감 있는", "에너지 넘치는"],
};
const MOOD_TONE = {
  minimal: "군더더기 없이, 핵심만 담백하게 전달합니다.",
  tech: "앞서가는 기술력과 신뢰를 동시에 전합니다.",
  luxury: "절제된 표현 속에서 프리미엄한 가치를 드러냅니다.",
  retro: "익숙하고 따뜻한 정서로 오래 기억되도록 합니다.",
  handdrawn: "사람의 손길이 느껴지는 편안한 인상을 줍니다.",
  bold: "주저 없이, 강하고 분명하게 브랜드를 각인시킵니다.",
  character: "밝고 다정한 태도로 친근하게 다가갑니다.",
  dynamic: "멈추지 않는 에너지와 움직임을 표현합니다.",
};

/* 팔레트 구성 (메인 + 파생 + 뉴트럴) */
export function buildPalette(logo) {
  const base =
    logo.brandColor ||
    (logo.colors?.symbol && logo.colors.symbol.toLowerCase() !== "#ffffff"
      ? logo.colors.symbol
      : logo.colors?.plate) ||
    "#2f6bf6";
  const ink = logo.colors?.text || "#1a2238";
  return [
    { role: "Primary", name: "메인 컬러", hex: base.toUpperCase() },
    { role: "Dark", name: "딥 톤", hex: darken(base, 0.32).toUpperCase() },
    { role: "Light", name: "라이트 톤", hex: lighten(base, 0.78).toUpperCase() },
    { role: "Ink", name: "텍스트", hex: ink.toUpperCase() },
    { role: "Neutral", name: "뉴트럴", hex: "#F2F3F5" },
  ];
}

/* 폰트 역할 문장 */
export function fontRoles(fontFamily) {
  return {
    family: fontFamily,
    heading: "제목 · 헤드라인",
    body: "본문 · 캡션",
  };
}

// AI 설명 정리 — 마크다운·HTML 제거, 공백 정리, 과도하게 길면 문장 단위로 컷
export function cleanRationale(s, max = 115) {
  if (!s) return "";
  let t = String(s)
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const lastDot = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("다"), cut.lastIndexOf("요"));
  return (lastDot > max * 0.5 ? cut.slice(0, lastDot + 1) : cut.trim() + "…").trim();
}

/* 전체 브랜드북 모델 */
// 영어 모드: 템플릿 초안의 모든 문자열을 사전으로 변환 (AI 응답이 오기 전까지 보이는 초안)
function deepTr(v) {
  if (typeof v === "string") return trLoose(v);
  if (Array.isArray(v)) return v.map(deepTr);
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, deepTr(x)]));
  return v;
}
// 전체 문장 → 패턴 → 띄어쓰기 토큰 단위 (예: "귀여운 강아지 카페" → "Cute 강아지 카페", 사용자 입력은 그대로)
function trLoose(s) {
  const t = tr(s);
  if (t !== s || !/[가-힣]/.test(s)) return t;
  return s.split(" ").map((w) => tr(w)).join(" ");
}

export function buildBrandbook(brief, logo, opts = {}) {
  const doc = buildBrandbookKo(brief, logo, opts);
  return brief.lang === "en" ? deepTr(doc) : doc;
}

function buildBrandbookKo(brief, logo, opts = {}) {
  const mood = moodById(logo.mood || brief.mood);
  const form = formById(logo.form || brief.form);
  const name = brief.name || logo.name || "브랜드";
  const keywords = MOOD_KEYWORDS[mood.id] || MOOD_KEYWORDS.minimal;

  return {
    name,
    business: brief.business || "",
    styleLabel: logo.styleLabel || `${form.label} · ${mood.label}`,
    tagline: opts.tagline || `${keywords[0]} ${brief.business || "브랜드"}`,
    mission:
      opts.mission ||
      `${name}는 ${keywords[0]} 태도로 ${brief.business || "고객"}에게 분명한 가치를 전합니다.`,
    keywords,
    tone: MOOD_TONE[mood.id] || MOOD_TONE.minimal,
    rationale: cleanRationale(logo.rationale),
    palette: buildPalette(logo),
    font: fontRoles(opts.font),
    dos: [
      "충분한 여백(로고 높이의 절반)을 확보하세요.",
      "지정된 브랜드 컬러 또는 흑·백 버전만 사용하세요.",
      "배경과 대비가 뚜렷한 곳에 배치하세요.",
    ],
    donts: [
      "가로세로 비율을 임의로 늘리거나 찌그러뜨리지 마세요.",
      "지정되지 않은 색으로 바꾸지 마세요.",
      "회전하거나 그림자·테두리 효과를 임의로 넣지 마세요.",
      "복잡한 배경 위에 그대로 얹지 마세요.",
    ],
    minSize: "최소 크기 화면 24px · 인쇄 10mm 이상 · 여백은 로고 높이의 1/2 이상",
  };
}
