// SVG 심볼 라이브러리
// 각 심볼은 24x24 뷰박스 기준 inner-markup 문자열을 반환한다.
// variant: "line"(외곽선) | "solid"(채움) | "duo"(2톤)
// 문자열로 반환하므로 React 프리뷰(dangerouslySetInnerHTML)와
// SVG 다운로드(문자열 합성)에서 그대로 재사용된다.

const strokeAttrs = (c, w = 2.1) =>
  `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

// variant 에 따라 도형 속성을 만들어 주는 헬퍼
function skin(color, accent, variant) {
  if (variant === "solid")
    return { shape: `fill="${color}" stroke="none"`, line: strokeAttrs("#fff", 1.8) };
  if (variant === "duo")
    return { shape: `fill="${accent}" stroke="${color}" stroke-width="2"`, line: strokeAttrs(color) };
  return { shape: strokeAttrs(color), line: strokeAttrs(color) };
}

export const SYMBOLS = {
  // 건물 / 아파트
  building: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <rect x="3.5" y="8" width="9" height="12.5" rx="1.3" ${s.shape}/>
      <rect x="12.5" y="4.5" width="8" height="16" rx="1.3" ${s.shape}/>
      <path d="M5.8 11.3h2M9.7 11.3h0.6M5.8 14.4h2M9.7 14.4h0.6M15 8h1.8M18.8 8h0.4M15 11.3h1.8M18.8 11.3h0.4M15 14.4h1.8M18.8 14.4h0.4" ${s.line}/>
      <path d="M2 20.5h20" ${strokeAttrs(color)}/>`;
  },

  // 나무 / 자연
  tree: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M12 3c3.2 0 5.6 2.5 5.6 5.4 0 1-.3 1.9-.8 2.7 1.4.6 2.4 2 2.4 3.7 0 2.3-1.9 4.1-4.3 4.1H8.9c-2.4 0-4.3-1.8-4.3-4.1 0-1.7 1-3.1 2.4-3.7-.5-.8-.8-1.7-.8-2.7C6.4 5.5 8.8 3 12 3Z" ${s.shape}/>
      <path d="M12 12.5v8.5" ${strokeAttrs(color)}/>`;
  },

  // 가족
  family: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <circle cx="8" cy="7" r="2.6" ${s.shape}/>
      <circle cx="16" cy="7" r="2.6" ${s.shape}/>
      <path d="M3.5 20.5v-3.2c0-2.2 1.8-4 4-4h1c.8 0 1.5.2 2.1.6" ${s.line}/>
      <path d="M20.5 20.5v-3.2c0-2.2-1.8-4-4-4h-1c-.8 0-1.5.2-2.1.6" ${s.line}/>
      <circle cx="12" cy="13.4" r="2" ${s.shape}/>
      <path d="M9 20.5v-1.2c0-1.6 1.3-3 3-3s3 1.4 3 3v1.2" ${s.line}/>`;
  },

  // 지역 / 위치
  pin: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M12 21.5s6.8-6 6.8-11.1A6.8 6.8 0 0 0 12 3.6a6.8 6.8 0 0 0-6.8 6.8C5.2 15.5 12 21.5 12 21.5Z" ${s.shape}/>
      <circle cx="12" cy="10.2" r="2.4" ${variant === "solid" ? 'fill="#fff" stroke="none"' : s.line}/>`;
  },

  // 추상 스파크 (참고 이미지의 ✦ 느낌)
  spark: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M12 2.5c.6 4.9 2.1 6.4 7 7-4.9.6-6.4 2.1-7 7-.6-4.9-2.1-6.4-7-7 4.9-.6 6.4-2.1 7-7Z" ${s.shape}/>
      <path d="M18.5 3.5c.25 1.9.85 2.5 2.75 2.75-1.9.25-2.5.85-2.75 2.75-.25-1.9-.85-2.5-2.75-2.75 1.9-.25 2.5-.85 2.75-2.75Z" ${variant === "line" ? strokeAttrs(color) : `fill="${accent}" stroke="none"`}/>`;
  },

  // 방패 / 신뢰
  shield: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M12 2.8 5 5.5v5.4c0 4.4 3 8.1 7 9.3 4-1.2 7-4.9 7-9.3V5.5L12 2.8Z" ${s.shape}/>
      <path d="M9 11.6l2.1 2.1 4-4.2" ${strokeAttrs(variant === "solid" ? "#fff" : color)}/>`;
  },

  // 물방울 / 클린
  drop: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M12 3s6.5 6.7 6.5 11.2A6.5 6.5 0 0 1 12 20.7a6.5 6.5 0 0 1-6.5-6.5C5.5 9.7 12 3 12 3Z" ${s.shape}/>
      <path d="M9 15.2a3 3 0 0 0 2.4 2.2" ${strokeAttrs(variant === "solid" ? "#fff" : color)}/>`;
  },

  // 잎 / 부티크
  leaf: (color, accent, variant) => {
    const s = skin(color, accent, variant);
    return `
      <path d="M20 4c0 9-5.5 15-12.5 15-1.4 0-2.7-.3-3.5-.7C4 10.5 10 4.5 20 4Z" ${s.shape}/>
      <path d="M5 19C9 13.5 13 10 18 7.5" ${strokeAttrs(variant === "solid" ? "#fff" : color)}/>`;
  },
  // 확장 심볼 (24종) — 업종별 흔한 소재
  coffee: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M4.5 9h11v5.5a5.5 5.5 0 0 1-11 0V9Z" ${s.shape}/>
      <path d="M15.5 10.5h1.6a2.4 2.4 0 0 1 0 4.8h-1.6" ${strokeAttrs(c)}/>
      <path d="M8 3.5c-1 1.2.9 1.8 0 3M11.5 3.5c-1 1.2.9 1.8 0 3" ${strokeAttrs(c, 1.6)}/>
      <path d="M4 21h13" ${strokeAttrs(c)}/>`; },
  fork: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M7 3v7a2.5 2.5 0 0 0 5 0V3M9.5 3v18" ${strokeAttrs(c)}/>
      <path d="M17.5 3c-2 0-3.5 2.5-3.5 6 0 2 .8 3 2 3.3V21" ${s.shape}/>`; },
  book: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v14H6.5A2.5 2.5 0 0 0 4 19.5V5.5Z" ${s.shape}/>
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" ${strokeAttrs(c)}/>
      <path d="M9 8h7M9 11.5h5" ${s.line}/>`; },
  camera: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H8l1.5-2.5h5L16 7h3.5A1.5 1.5 0 0 1 21 8.5V18a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18V8.5Z" ${s.shape}/>
      <circle cx="12" cy="13" r="3.6" ${s.line}/>`; },
  music: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M9 18.5V6l11-2.5v12" ${strokeAttrs(c)}/>
      <circle cx="6.5" cy="18.5" r="2.5" ${s.shape}/><circle cx="17.5" cy="16" r="2.5" ${s.shape}/>`; },
  heart: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M12 20.5s-8-5-8-11a4.5 4.5 0 0 1 8-2.8 4.5 4.5 0 0 1 8 2.8c0 6-8 11-8 11Z" ${s.shape}/>`; },
  medical: (c, a, v) => { const s = skin(c, a, v); return `
      <rect x="3" y="3" width="18" height="18" rx="4" ${s.shape}/>
      <path d="M12 7.5v9M7.5 12h9" ${v === "solid" ? strokeAttrs("#fff", 2.4) : strokeAttrs(c, 2.4)}/>`; },
  car: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M3.5 13l2-5A2 2 0 0 1 7.4 6.7h9.2a2 2 0 0 1 1.9 1.3l2 5v4.5H3.5V13Z" ${s.shape}/>
      <circle cx="7.5" cy="17.5" r="2" ${s.line}/><circle cx="16.5" cy="17.5" r="2" ${s.line}/>
      <path d="M5.5 12.5h13" ${s.line}/>`; },
  bike: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="6" cy="16" r="4" ${s.line}/><circle cx="18" cy="16" r="4" ${s.line}/>
      <path d="M6 16l4-8h6l2 8M10 8h-2.5M12.5 16H10l3-6" ${strokeAttrs(c)}/>`; },
  flower: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="12" cy="12" r="2.6" ${s.line}/>
      <path d="M12 3.5a3 3 0 0 1 0 6 3 3 0 0 1 0-6ZM12 14.5a3 3 0 0 1 0 6 3 3 0 0 1 0-6ZM3.5 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0ZM14.5 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0Z" ${s.shape}/>`; },
  sun: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="12" cy="12" r="4.5" ${s.shape}/>
      <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" ${strokeAttrs(c)}/>`; },
  mountain: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M2.5 19.5 9 7.5l3.5 6 2-3 7 9H2.5Z" ${s.shape}/>
      <path d="M7.2 10.8 9 9.5l1.8 1.3" ${s.line}/>`; },
  wave: (c) => { return `
      <path d="M2.5 9c3-3.5 6-3.5 9 0s6 3.5 9 0" ${strokeAttrs(c)}/>
      <path d="M2.5 14c3-3.5 6-3.5 9 0s6 3.5 9 0" ${strokeAttrs(c)}/>
      <path d="M2.5 19c3-3.5 6-3.5 9 0s6 3.5 9 0" ${v === "solid" ? strokeAttrs(c, 3.2) : strokeAttrs(a === c ? c : a, 2.1)}/>`; },
  dumbbell: (c, a, v) => { const s = skin(c, a, v); return `
      <rect x="2.5" y="9" width="3" height="6" rx="1" ${s.shape}/><rect x="18.5" y="9" width="3" height="6" rx="1" ${s.shape}/>
      <rect x="5.5" y="7" width="3.5" height="10" rx="1.2" ${s.shape}/><rect x="15" y="7" width="3.5" height="10" rx="1.2" ${s.shape}/>
      <path d="M9 12h6" ${strokeAttrs(c, 2.6)}/>`; },
  scissors: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="6.5" cy="6.5" r="3" ${s.shape}/><circle cx="6.5" cy="17.5" r="3" ${s.shape}/>
      <path d="M8.8 8.6 20.5 17M8.8 15.4 20.5 7" ${strokeAttrs(c)}/>`; },
  paw: (c, a, v) => { const s = skin(c, a, v); return `
      <ellipse cx="6" cy="9.5" rx="2" ry="2.6" ${s.shape}/><ellipse cx="18" cy="9.5" rx="2" ry="2.6" ${s.shape}/>
      <ellipse cx="9.5" cy="5.5" rx="2" ry="2.6" ${s.shape}/><ellipse cx="14.5" cy="5.5" rx="2" ry="2.6" ${s.shape}/>
      <path d="M12 11c3.5 0 6 3 6 5.8 0 1.8-1.3 3.2-3 3.2-1.2 0-2-.6-3-.6s-1.8.6-3 .6c-1.7 0-3-1.4-3-3.2C6 14 8.5 11 12 11Z" ${s.shape}/>`; },
  gear: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M12 2.8l1.6 2.3 2.7-.7.7 2.7 2.3 1.6-1.2 2.5 1.2 2.5-2.3 1.6-.7 2.7-2.7-.7L12 21.2l-1.6-2.3-2.7.7-.7-2.7-2.3-1.6 1.2-2.5-1.2-2.5 2.3-1.6.7-2.7 2.7.7L12 2.8Z" ${s.shape}/>
      <circle cx="12" cy="12" r="3.2" ${s.line}/>`; },
  code: (c, a, v) => { const s = skin(c, a, v); return `
      <rect x="2.5" y="4" width="19" height="16" rx="3" ${s.shape}/>
      <path d="m9 9-3 3 3 3M15 9l3 3-3 3M13 8l-2 8" ${s.line}/>`; },
  rocket: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M12 2.5c3.5 2.5 5 6.5 5 11l-2.5 2.5h-5L7 13.5c0-4.5 1.5-8.5 5-11Z" ${s.shape}/>
      <circle cx="12" cy="10" r="1.8" ${s.line}/>
      <path d="M7 13.5 4 16.5h3.5M17 13.5l3 3h-3.5M10 16.5l-1 4 3-2 3 2-1-4" ${strokeAttrs(c)}/>`; },
  graduation: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" ${s.shape}/>
      <path d="M6.5 11.5v4.5c1.8 1.5 3.6 2.2 5.5 2.2s3.7-.7 5.5-2.2v-4.5M21.5 9.5v5" ${strokeAttrs(c)}/>`; },
  cart: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M3 4h2.5l2 11h11l2-7.5H7" ${s.shape}/>
      <circle cx="9" cy="19.5" r="1.6" ${s.shape}/><circle cx="17" cy="19.5" r="1.6" ${s.shape}/>`; },
  gift: (c, a, v) => { const s = skin(c, a, v); return `
      <rect x="3.5" y="9" width="17" height="11.5" rx="1.5" ${s.shape}/>
      <path d="M3 9h18M12 9v11.5" ${s.line}/>
      <path d="M12 9C9 9 6.5 7.5 7.5 5s4 0 4.5 4c.5-4 3.5-6.5 4.5-4S15 9 12 9Z" ${s.shape}/>`; },
  diamond: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M7 4h10l4.5 6L12 21 2.5 10 7 4Z" ${s.shape}/>
      <path d="M2.5 10h19M7 4l5 6 5-6M12 10l-3 11M12 10l3 11" ${s.line}/>`; },
  globe: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="12" cy="12" r="9" ${s.shape}/>
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" ${s.line}/>`; },
  plane: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M21 12 3.5 5l2 7-2 7L21 12Z" ${s.shape}/>
      <path d="M5.5 12H21" ${s.line}/>`; },
  chat: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" ${s.shape}/>
      <path d="M8.5 8.5h7M8.5 11.5h4.5" ${s.line}/>`; },
  bolt: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6l1-8Z" ${s.shape}/>`; },
  star: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" ${s.shape}/>`; },
  key: (c, a, v) => { const s = skin(c, a, v); return `
      <circle cx="8" cy="12" r="4.5" ${s.shape}/>
      <path d="M12.5 12h9M18.5 12v3M15.5 12v2.5" ${strokeAttrs(c)}/>`; },
  home: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M3.5 11 12 4l8.5 7v9a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9Z" ${s.shape}/>`; },
  cake: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M4 12.5h16v7.5H4z" ${s.shape}/>
      <path d="M4 15.5c2 1.5 4 1.5 6 0s4-1.5 6 0 3 1.2 4 0" ${s.line}/>
      <path d="M12 5.5v4M12 4.5c-.8-1-.5-2 0-2.5.5.5.8 1.5 0 2.5Z" ${strokeAttrs(c, 1.8)}/>
      <path d="M6.5 9.5h11a1.5 1.5 0 0 1 1.5 1.5v1.5H5V11a1.5 1.5 0 0 1 1.5-1.5Z" ${s.shape}/>`; },
  hanger: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M12 8.5a2 2 0 1 0-2-2" ${strokeAttrs(c)}/>
      <path d="m12 8.5 9 7.5a1 1 0 0 1-.7 1.7H3.7A1 1 0 0 1 3 16l9-7.5Z" ${s.shape}/>`; },
  tooth: (c, a, v) => { const s = skin(c, a, v); return `
      <path d="M8 3.5c1.5 0 2.5 1 4 1s2.5-1 4-1c2.5 0 4 2 4 4.5 0 4-2 6-2.5 11-.2 1.5-2 1.7-2.5.3l-1.5-5h-3l-1.5 5c-.5 1.4-2.3 1.2-2.5-.3C6 14 4 12 4 8c0-2.5 1.5-4.5 4-4.5Z" ${s.shape}/>`; },
};

// 심볼 전체 <svg> 문자열 생성
export function symbolSvg(key, { color, accent, variant, size = 100 }) {
  const inner = (SYMBOLS[key] || SYMBOLS.spark)(color, accent, variant);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">${inner}</svg>`;
}
