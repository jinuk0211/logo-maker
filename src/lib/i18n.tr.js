import { EN, PATTERNS } from "./i18n.en.js";

// 문자열 하나 번역 (없으면 그대로)
export function tr(s) {
  if (!s || !/[가-힣]/.test(s)) return s;
  const key = s.trim();
  const hit = EN[key];
  if (hit) return s.replace(key, hit);
  for (const [re, rep] of PATTERNS) {
    if (re.test(key)) return s.replace(key, key.replace(re, rep));
  }
  // "심볼형 · 미니멀" 처럼 가운뎃점으로 이어진 조합은 조각별로
  if (key.includes(" · ")) {
    const parts = key.split(" · ").map((p) => EN[p.trim()] || p);
    if (parts.some((p, idx) => p !== key.split(" · ")[idx])) return s.replace(key, parts.join(" · "));
  }
  return s;
}

