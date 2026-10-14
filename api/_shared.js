// Vercel 서버리스 공통 — provider 선택·폴백은 dev 미들웨어와 같은 server/providers.js 를 쓴다
import { createImageRunner } from "../server/providers.js";
import { verify } from "../server/auth.js";
import { consumeQuota, QUOTA_MESSAGE } from "../server/quota.js";

export const imageRunner = createImageRunner({
  mode: process.env.LOGO_PROVIDER,
  geminiKey: process.env.GEMINI_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY,
});

function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return req.body ? JSON.parse(req.body) : {}; } catch { return {}; }
}

// POST + 로그인 + 이용 횟수 확인을 거친 뒤 handle(body) 의 결과를 JSON 으로 돌려준다.
// kindOf(body) 는 이 요청이 어느 한도에서 차감되는지 정한다.
export const endpoint = (kindOf, handle) => async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  const user = await verify(req.headers.authorization);
  if (!user) return res.status(401).json({ error: "로그인이 필요합니다." });
  try {
    const body = readBody(req);
    if (!(await consumeQuota(req.headers.authorization, user, kindOf(body)))) {
      return res.status(429).json({ error: QUOTA_MESSAGE });
    }
    res.status(200).json(await handle(body));
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
};
