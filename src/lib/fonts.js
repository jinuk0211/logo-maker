// 명함용 구글 폰트 20종 (모두 한글 지원) — 스타일별 그룹
export const FONT_GROUPS = [
  {
    group: "고딕 · 산세리프",
    fonts: [
      { family: "Noto Sans KR", label: "노토 산스", weights: "400;700" },
      { family: "Nanum Gothic", label: "나눔고딕", weights: "400;700" },
      { family: "Gothic A1", label: "고딕 A1", weights: "400;700" },
      { family: "IBM Plex Sans KR", label: "IBM 플렉스", weights: "400;700" },
      { family: "Gowun Dodum", label: "고운돋움", weights: "400" },
    ],
  },
  {
    group: "명조 · 세리프",
    fonts: [
      { family: "Noto Serif KR", label: "노토 세리프", weights: "400;700" },
      { family: "Nanum Myeongjo", label: "나눔명조", weights: "400;700" },
      { family: "Gowun Batang", label: "고운바탕", weights: "400;700" },
      { family: "Song Myung", label: "송명", weights: "400" },
      { family: "Stylish", label: "스타일리시", weights: "400" },
    ],
  },
  {
    group: "디스플레이 · 볼드",
    fonts: [
      { family: "Black Han Sans", label: "검은고딕", weights: "400" },
      { family: "Do Hyeon", label: "도현", weights: "400" },
      { family: "Jua", label: "주아", weights: "400" },
      { family: "Yeon Sung", label: "연성", weights: "400" },
      { family: "Kirang Haerang", label: "기랑해랑", weights: "400" },
    ],
  },
  {
    group: "손글씨",
    fonts: [
      { family: "Nanum Pen Script", label: "나눔펜", weights: "400" },
      { family: "Nanum Brush Script", label: "나눔붓", weights: "400" },
      { family: "Gaegu", label: "개구", weights: "400;700" },
      { family: "Hi Melody", label: "하이멜로디", weights: "400" },
      { family: "Poor Story", label: "푸어스토리", weights: "400" },
    ],
  },
];

export const ALL_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);
export const DEFAULT_FONT = "Noto Sans KR";

// 구글 폰트 CSS 한 번에 로드 (families 를 하나의 link 로)
let injected = false;
export function loadCardFonts() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const families = ALL_FONTS.map(
    (f) => `family=${encodeURIComponent(f.family).replace(/%20/g, "+")}:wght@${f.weights}`
  ).join("&");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
}
