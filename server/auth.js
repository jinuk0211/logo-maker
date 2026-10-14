// Supabase 인증 — 프론트가 보낸 access token 을 Supabase 에 물어 검증한다.
import { createClient } from "@supabase/supabase-js";

const URL = () => process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = () => process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const OPTIONS = { auth: { persistSession: false, autoRefreshToken: false } };

const tokenOf = (authHeader) => String(authHeader || "").replace(/^Bearer\s+/i, "").trim();

let client = null;
function sb() {
  if (!URL() || !ANON()) return null;
  return (client ||= createClient(URL(), ANON(), OPTIONS));
}

// Authorization: Bearer <access_token> → 유효한 사용자면 user, 아니면 null
export async function verify(authHeader) {
  const token = tokenOf(authHeader);
  const c = sb();
  if (!token || !c) return null;
  const { data, error } = await c.auth.getUser(token);
  return error || !data?.user ? null : data.user;
}

// 요청한 사용자 권한으로 DB 를 부르는 클라이언트 — RLS 와 auth.uid() 가 그 사용자 기준으로 동작한다
export function clientFor(authHeader) {
  return createClient(URL(), ANON(), {
    ...OPTIONS,
    global: { headers: { Authorization: `Bearer ${tokenOf(authHeader)}` } },
  });
}
