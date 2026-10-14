// 계정별 무료 이용 횟수 — Supabase 의 consume_quota() 가 원자적으로 세고 막는다 (supabase/usage_quota.sql).
// 배포(Vercel 함수)에서만 건다. 로컬 dev 는 자기 키로 돌리므로 제한하지 않는다.
import { clientFor } from "./auth.js";

const CANDIDATES_PER_GENERATION = 2; // 생성 한 번에 후보 2장 = /api/generate 2회

const count = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
};

// kind 별 허용 호출 수. 환경변수로 조정 (기본 1회씩)
const limits = () => ({
  generate: count(process.env.FREE_LOGO_GENERATIONS, 1) * CANDIDATES_PER_GENERATION,
  edit: count(process.env.FREE_LOGO_EDITS, 1),
  brandbook: count(process.env.FREE_BRANDBOOKS, 1),
});

const exemptEmails = () =>
  String(process.env.QUOTA_EXEMPT_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export const QUOTA_MESSAGE = "무료 이용 횟수를 모두 사용했어요.";

// 한 번 쓰고 true, 한도를 넘었으면 false
export async function consumeQuota(authHeader, user, kind) {
  if (exemptEmails().includes(String(user?.email || "").toLowerCase())) return true;

  const { error, data } = await clientFor(authHeader).rpc("consume_quota", {
    p_kind: kind,
    p_limit: limits()[kind],
  });
  if (error) {
    // SQL 을 아직 안 돌린 프로젝트에서는 서비스가 멈추지 않도록 제한 없이 통과시킨다
    if (error.code === "PGRST202" || error.code === "42883") {
      console.warn("[logogen] consume_quota 함수가 없어 횟수 제한 없이 진행 — supabase/usage_quota.sql 을 실행하세요");
      return true;
    }
    throw new Error("이용 횟수를 확인하지 못했습니다: " + error.message);
  }
  return data === true;
}
