// 형태 · 분위기 선택용 미리보기 SVG (currentColor 사용 → 선택 상태에 따라 색 변화)

// 형태: 구조(심볼/텍스트 배치)를 그대로 보여줌
export const FORM_PREVIEW = {
  symbol: `<svg viewBox="0 0 72 48" fill="none">
    <path d="M36 13l11 19H25z" fill="currentColor"/>
  </svg>`,
  combo: `<svg viewBox="0 0 72 48" fill="none">
    <path d="M36 8l9 15H27z" fill="currentColor"/>
    <rect x="22" y="29" width="28" height="6" rx="3" fill="currentColor" opacity=".42"/>
  </svg>`,
  wordmark: `<svg viewBox="0 0 72 48" fill="none">
    <rect x="14" y="18" width="13" height="13" rx="2.5" fill="currentColor"/>
    <rect x="30" y="18" width="9" height="13" rx="2.5" fill="currentColor" opacity=".7"/>
    <rect x="42" y="18" width="16" height="13" rx="2.5" fill="currentColor" opacity=".45"/>
  </svg>`,
};

// 분위기: 그 무드의 조형 느낌을 축약해서
export const MOOD_PREVIEW = {
  minimal: `<svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="24" r="13" stroke="currentColor" stroke-width="1.8"/>
  </svg>`,
  tech: `<svg viewBox="0 0 48 48" fill="none">
    <path d="M24 8l14 8v16l-14 8-14-8V16z" stroke="currentColor" stroke-width="2"/>
    <path d="M24 16v16M17 20l14 8" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,
  luxury: `<svg viewBox="0 0 48 48" fill="none">
    <path d="M24 7l13 17-13 17-13-17z" stroke="currentColor" stroke-width="1.3"/>
    <circle cx="24" cy="24" r="4.5" stroke="currentColor" stroke-width="1.3"/>
  </svg>`,
  retro: `<svg viewBox="0 0 48 48" fill="none">
    <rect x="7" y="14" width="34" height="20" rx="10" stroke="currentColor" stroke-width="2.2"/>
    <path d="M7 24h34" stroke="currentColor" stroke-width="2.2"/>
  </svg>`,
  handdrawn: `<svg viewBox="0 0 48 48" fill="none">
    <path d="M24 10c8.5 0 14.5 6 14 14.5-.5 8-7.5 13.5-15.5 12.5S9.5 30 10.5 21.5 15.5 10 24 10z"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  bold: `<svg viewBox="0 0 48 48" fill="none">
    <rect x="9" y="13" width="30" height="22" rx="5" fill="currentColor"/>
  </svg>`,
  character: `<svg viewBox="0 0 48 48" fill="none">
    <circle cx="24" cy="25" r="13" stroke="currentColor" stroke-width="2"/>
    <circle cx="19" cy="22" r="2" fill="currentColor"/>
    <circle cx="29" cy="22" r="2" fill="currentColor"/>
    <path d="M19 29c3 3 7 3 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
  dynamic: `<svg viewBox="0 0 48 48" fill="none">
    <path d="M9 33c8-17 21-21 30-16" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    <path d="M31 11l9 5-7 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};
