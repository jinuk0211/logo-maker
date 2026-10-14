import LogoRender from "./LogoRender.jsx";
import "./BusinessCard.css";

/* 명함 앞면 — 명함 단계(BusinessCard)와 브랜드북 활용 예시가 같은 것을 그린다.
   spec: { card, template, theme, font }  ·  logo: 선택한 로고  ·  accent: 브랜드색 */
// 연락처 라인 아이콘 (currentColor)
const GLYPH = {
  phone: (
    <svg viewBox="0 0 24 24">
      <path
        d="M6.6 3h2.7l1.3 4.3-2 1.2a12 12 0 0 0 5 5l1.2-2 4.3 1.3v2.7a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.2 2 2 0 0 1 6.6 3z"
        fill="currentColor"
      />
    </svg>
  ),
  mail: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="5.3" width="18" height="13.4" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <path d="M4 7l8 5.6L20 7" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  ),
  pin: (
    <svg viewBox="0 0 24 24">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" fill="none" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" />
    </svg>
  ),
  home: (
    <svg viewBox="0 0 24 24">
      <path d="M4 11l8-6 8 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.2 9.8V19h11.6V9.8" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
};


export function cardAccent(logo) {
  return (
    logo.brandColor ||
    (logo.colors?.symbol && logo.colors.symbol.toLowerCase() !== "#ffffff"
      ? logo.colors.symbol
      : logo.colors?.plate) ||
    "#2f6bf6"
  );
}

export default function CardFront({ spec, logo, innerRef, style }) {
  const { card, template, theme, font, logoScale = 1, textScale = 1 } = spec;
  const accent = cardAccent(logo);
  const logoLockup = { ...logo, name: card.company };
  // 다크/브랜드 테마에선 로고를 흰색(반전)으로 → 흰 박스 없이도 잘 보임
  const onColorBg = theme !== "light";
  const frontLogo = onColorBg
    ? { ...logoLockup, colors: { ...logoLockup.colors, symbol: "#ffffff", text: "#ffffff", plate: null } }
    : logoLockup;
  const contacts = [
    ["phone", card.phone],
    ["mail", card.email],
    ["pin", card.address],
    ["home", card.website],
  ];
  return (
    <div
      ref={innerRef}
      className={`bc bc-${template} theme-${theme}`}
      style={{ "--accent": accent, "--logo-scale": logoScale, "--text-scale": textScale, fontFamily: `'${font}', sans-serif`, ...style }}
    >
              {template === "minimal" ? (
                <>
                  {/* 전면 텍스트만 — 로고는 뒷면에만 */}
                  <div className="bc-min-name">
                    <strong>{card.person || "이름"}</strong>
                    {card.title && <em>{card.title}</em>}
                  </div>
                  <div className="bc-min-list">
                    {card.phone && (
                      <div className="bc-min-row"><span>Mobile</span><b>{card.phone}</b></div>
                    )}
                    {card.email && (
                      <div className="bc-min-row"><span>Email</span><b>{card.email}</b></div>
                    )}
                    {card.website && (
                      <div className="bc-min-row"><span>Website</span><b>{card.website}</b></div>
                    )}
                    {card.company && (
                      <div className="bc-min-row"><span>Company</span><b>{card.company}</b></div>
                    )}
                  </div>
                  {card.address && <div className="bc-min-addr">{card.address}</div>}
                </>
              ) : (
                <>
                  <div className={"bc-logo-wrap" + (onColorBg ? " bc-logo-reverse" : "")}>
                    <LogoRender
                      logo={{ ...frontLogo, layout: template === "classic" ? "stacked" : "horizontal" }}
                      size="sm"
                    />
                  </div>

                  <div className="bc-info">
                    <div className="bc-person">
                      <strong>{card.person || "이름"}</strong>
                      {card.title && <em>{card.title}</em>}
                    </div>
                    <ul className="bc-contacts">
                      {contacts.map(([g, val]) =>
                        val ? (
                          <li key={g}>
                            <i className="bc-gi">{GLYPH[g]}</i>
                            <span>{val}</span>
                          </li>
                        ) : null
                      )}
                    </ul>
                  </div>
                </>
              )}
    </div>
  );
}
