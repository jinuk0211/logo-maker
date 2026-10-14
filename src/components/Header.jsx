const NAV = [
  { id: "home", label: "홈" },
  { id: "how", label: "사용법" },
  { id: "price", label: "요금" },
];

import { logout } from "../lib/auth.js";
import { useLang } from "../lib/i18n.jsx";

export default function Header({ onHome, onMine, onPrice, onLogin, authed, step }) {
  const { lang, setLang } = useLang();
  return (
    <header className="hdr">
      <div className="hdr-wrap">
        <button className="brand" onClick={onHome}>
          <img className="brand-mark" src="/bf-mark.png" alt="" />
          Brand Factory
        </button>

        <nav className="navpill">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={"navpill-item" + (n.id === "home" && step === "intro" ? " on" : "")}
              onClick={n.id === "home" ? onHome : n.id === "price" ? onPrice : undefined}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* 우측 액션 묶음 — space-between 이 세 버튼을 흩뿌리지 않도록 한 그룹으로 */}
        <div className="hdr-actions">
          <button className="hdr-lang" data-no-i18n onClick={() => setLang(lang === "ko" ? "en" : "ko")} title={lang === "ko" ? "Switch to English" : "한국어로 보기"}>
            <span className={lang === "ko" ? "on" : ""}>KO</span><i>/</i><span className={lang === "en" ? "on" : ""}>EN</span>
          </button>
          {authed ? (
            <>
              <button className="hdr-link" onClick={onMine} title="저장한 로고">내 로고</button>
              <button className="hdr-link" onClick={logout} title="로그아웃">로그아웃</button>
            </>
          ) : (
            <button className="hdr-link" onClick={onLogin}>로그인</button>
          )}
        </div>
      </div>
    </header>
  );
}
