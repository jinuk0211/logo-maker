import { useState } from "react";
import { login, signup } from "../lib/auth.js";
import { useLang } from "../lib/i18n.jsx";
import "./Login.css";

export default function Login({ onDone, onBack }) {
  const [mode, setMode] = useState("login"); // login | signup
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const { lang, setLang } = useLang();

  const pwOk = pw.length >= 8 && /[A-Za-z]/.test(pw) && /\d/.test(pw);
  const canSubmit = mode === "login" ? !!id && !!pw : !!id && pwOk && pw === pw2;

  async function submit(e) {
    e.preventDefault();
    setErr(""); setInfo("");
    setBusy(true);
    try {
      if (mode === "login") {
        await login(id, pw);
        onDone();
      } else {
        const session = await signup(id, pw);
        if (session) onDone();
        else { setInfo("가입 완료! 이메일의 인증 링크를 누른 뒤 로그인해 주세요."); setMode("login"); setPw(""); setPw2(""); }
      }
    } catch (e) {
      setErr(e.message || "실패했어요");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <button type="button" className="hdr-lang login-lang" data-no-i18n onClick={() => setLang(lang === "ko" ? "en" : "ko")}>
        <span className={lang === "ko" ? "on" : ""}>KO</span><i>/</i><span className={lang === "en" ? "on" : ""}>EN</span>
      </button>
      <form className="login-card" onSubmit={submit}>
        {onBack && <button type="button" className="step-back login-back" onClick={onBack}>← BACK TO HOME</button>}
        <img className="login-mark" src="/bf-mark.png" alt="" />
        <h1 className="login-title">{mode === "login" ? "로그인" : "회원가입"}</h1>
        <p className="login-sub">Brand Factory는 로그인 후 이용할 수 있어요. 만든 로고는 계정에 60일간 보관됩니다.</p>

        <label className="login-label">이메일</label>
        <input className="q-input" type="email" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} placeholder="이메일" autoFocus />

        <label className="login-label">비밀번호</label>
        <input className="q-input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={mode === "login" ? "비밀번호" : "8자 이상, 영문+숫자"} />

        {mode === "signup" && (
          <>
            <label className="login-label">비밀번호 확인</label>
            <input className="q-input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="한 번 더" />
            {pw2 && pw !== pw2 && <p className="login-err">비밀번호가 일치하지 않아요.</p>}
          </>
        )}

        {err && <p className="login-err">{err}</p>}
        {info && <p className="login-info">{info}</p>}

        <button className="btn btn-primary login-btn" type="submit" disabled={busy || !canSubmit}>
          {busy ? "확인 중…" : mode === "login" ? "로그인" : "가입하기"}
        </button>

        <button type="button" className="login-toggle" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); setInfo(""); }}>
          {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
        </button>
      </form>
    </div>
  );
}
