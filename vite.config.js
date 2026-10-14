import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { createImageRunner } from "./server/providers.js";
import { generateBrandbook } from "./server/brandbookHandler.js";
import { verify } from "./server/auth.js";

// .env 파일을 직접 파싱 (셸 환경변수보다 .env 파일을 우선하기 위해)
function readDotEnv(dir) {
  try {
    const txt = fs.readFileSync(path.join(dir, ".env"), "utf8");
    const out = {};
    for (const line of txt.split("\n")) {
      if (line.trimStart().startsWith("#")) continue;
      const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(payload));
}

const elapsed = (t0) => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

// POST 전용 JSON 엔드포인트 — 본문 파싱과 에러 응답을 한 곳에서 처리
const postJson = (handle) => async (req, res) => {
  if (req.method !== "POST") return sendJson(res, 405, { error: "POST only" });
  try {
    sendJson(res, 200, await handle(await readJson(req)));
  } catch (e) {
    sendJson(res, 500, { error: String(e?.message || e) });
  }
};

// dev 서버용 /api — 배포에서는 api/*.js (Vercel 함수)가 같은 일을 한다. 키는 서버에서만 쓴다.
function apiPlugin({ imageRunner, anthropicKey }) {
  return {
    name: "logo-api-proxy",
    configureServer(server) {
      // /api/* 는 로그인 토큰 필수
      server.middlewares.use("/api", async (req, res, next) => {
        if (await verify(req.headers.authorization)) return next();
        sendJson(res, 401, { error: "로그인이 필요합니다." });
      });

      server.middlewares.use(
        "/api/brandbook",
        postJson(async (body) => {
          const t0 = Date.now();
          const doc = await generateBrandbook(body.brief || {}, body.logo || {}, anthropicKey, body.extra || {});
          console.log(`[logogen] brandbook · claude · ${elapsed(t0)}`);
          return doc;
        })
      );

      server.middlewares.use(
        "/api/generate",
        postJson(async (body) => {
          const t0 = Date.now();
          const result = await imageRunner.run(body);
          // 어느 모델이 얼마나 걸리는지 눈으로 보이게 — 느릴 때 원인 특정용
          const kb = Math.round((result.imageUrl?.length || 0) / 1024);
          console.log(`[logogen] ${body.instruction ? "edit" : "gen"} · ${result.provider} · ${elapsed(t0)} · ${kb}KB`);
          return result;
        })
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fileEnv = readDotEnv(process.cwd());
  const pick = (key) => fileEnv[key] || env[key];

  // server/auth.js 는 process.env 에서 읽는다
  for (const k of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"]) if (fileEnv[k]) process.env[k] = fileEnv[k];

  const geminiKey = pick("GEMINI_API_KEY");
  const openaiKey = pick("OPENAI_API_KEY");
  const anthropicKey = pick("ANTHROPIC_API_KEY");
  const imageRunner = createImageRunner({ mode: pick("LOGO_PROVIDER"), geminiKey, openaiKey });

  // 키가 빠지면 mix 가 조용히 한쪽으로 몰리므로, 어느 모델이 실제로 붙었는지 띄운다
  const LABEL = { openai: "GPT", gemini: "제미나이" };
  const ready = imageRunner.available.map((p) => LABEL[p]);
  console.log(
    `[logogen] 이미지 provider: ${imageRunner.providerMode} · 사용가능: ${ready.join(", ") || "없음"}` +
      (imageRunner.providerMode === "mix" ? ` · 후보0=${ready[0] || "-"} / 후보1=${ready[1] || ready[0] || "-"}` : "") +
      ` · 브랜드북: ${anthropicKey ? "Claude" : "미설정(템플릿 폴백)"}`
  );

  return {
    plugins: [react(), apiPlugin({ imageRunner, anthropicKey })],
  };
});
