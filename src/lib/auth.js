// 프론트 인증 — Supabase 세션. 서버 API 호출엔 access token 을 Bearer 로 붙인다.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = url && anon ? createClient(url, anon) : null;

let session = null;
// 앱 시작 시 한 번 — 저장된 세션 복원. 이후엔 onAuthStateChange 로 동기화.
export async function initAuth(onChange) {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  session = data.session;
  supabase.auth.onAuthStateChange((_e, s) => { session = s; onChange?.(s); });
  return session;
}

export const currentUser = () => session?.user || null;
export const authHeaders = () => (session?.access_token ? { authorization: `Bearer ${session.access_token}` } : {});

export async function login(email, password) {
  if (!supabase) throw new Error("Supabase 설정이 필요합니다 (.env 의 VITE_SUPABASE_*)");
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error(koError(error.message));
  session = data.session;
  return data.session;
}

// 회원가입 — 이메일 인증이 켜져 있으면 session 이 null (메일 확인 후 로그인)
export async function signup(email, password) {
  if (!supabase) throw new Error("Supabase 설정이 필요합니다 (.env 의 VITE_SUPABASE_*)");
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
  if (error) throw new Error(koError(error.message));
  if (data.session) session = data.session;
  return data.session;
}

export async function logout() {
  await supabase?.auth.signOut();
  session = null;
  window.location.reload();
}

// 서버가 401 → 세션 만료로 보고 로그아웃
export function onUnauthorized() { logout(); }

function koError(msg) {
  const s = (msg || "").toLowerCase();
  if (/invalid login credentials/.test(s)) return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (/email not confirmed/.test(s)) return "이메일 인증이 아직 안 됐어요. 메일함을 확인해 주세요.";
  if (/rate limit|too many/.test(s)) return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (/already registered|user_already_exists/.test(s)) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (/password.*at least|weak.?password/.test(s)) return "비밀번호는 8자 이상, 영문·숫자를 포함해 주세요.";
  if (/email.*invalid|invalid.*email/.test(s)) return "이메일 주소가 유효하지 않아요.";
  return msg;
}
