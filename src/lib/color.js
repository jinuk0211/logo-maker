// 컬러 헬퍼 + 브랜드 컬러를 기본 팔레트에 적용

const clamp = (v) => Math.max(0, Math.min(255, v));

function hexToRgb(h) {
  h = String(h).replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((x) => clamp(Math.round(x)).toString(16).padStart(2, "0")).join("");
}
function mix(a, b, t) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export const lighten = (c, t) => mix(c, "#ffffff", t);
export const darken = (c, t) => mix(c, "#000000", t);

// 팔레트에 사용자가 고른 브랜드 컬러를 입힌다 (팔레트의 구조는 유지)
export function applyBrandColor(palette, color) {
  if (!color) return palette;
  const isWhiteSymbol = String(palette.symbol).toLowerCase() === "#ffffff";
  if (isWhiteSymbol) {
    // 심볼이 흰색이면 색은 플레이트가 갖는다: 플레이트 = 브랜드 컬러
    return { ...palette, plate: color, symbol: "#ffffff", accent: darken(color, 0.14) };
  }
  // 그 외에는 심볼 = 브랜드 컬러
  return { ...palette, symbol: color, accent: lighten(color, 0.72) };
}
