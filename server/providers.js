// 이미지 provider 선택과 폴백 — dev 미들웨어(vite.config.js)와 Vercel 함수(api/)가 함께 쓴다.
import { generateSymbolNano, editSymbolNano } from "./nanoHandler.js";
import { generateSymbolOpenAI, editSymbolOpenAI } from "./openaiHandler.js";

// mode(LOGO_PROVIDER): gemini | openai | mix(후보마다 번갈아)
export function createImageRunner({ mode, geminiKey, openaiKey }) {
  const handlers = {
    gemini: { gen: generateSymbolNano, edit: editSymbolNano, key: geminiKey },
    openai: { gen: generateSymbolOpenAI, edit: editSymbolOpenAI, key: openaiKey },
  };
  const providerMode = String(mode || "gemini").toLowerCase();
  // 키가 있는 provider 만. mix 에서는 이 순서대로 후보 0 = OpenAI, 후보 1 = Gemini
  const available = ["openai", "gemini"].filter((p) => handlers[p].key);

  function pick(body) {
    // 편집은 로고를 만든 모델로 이어가도록 프론트가 provider 를 지정한다
    if (body.provider && handlers[body.provider]?.key) return body.provider;
    if (providerMode === "mix" && available.length) {
      return available[(body.variant || 0) % available.length];
    }
    return handlers[providerMode]?.key ? providerMode : available[0] || "gemini";
  }

  // 생성/편집 실행 — 실패하면 키가 있는 다른 provider 로 한 번 더 (키 만료·과부하 대비)
  async function run(body) {
    const first = pick(body);
    const order = [first, ...available.filter((p) => p !== first)];
    let lastErr;
    for (const provider of order) {
      const h = handlers[provider];
      try {
        const result = body.instruction
          ? await h.edit(body.editImage, body.instruction, h.key)
          : await h.gen(body.brief, body.variant || 0, h.key);
        if (provider !== first) {
          console.warn(`[logogen] ${first} 실패 → ${provider} 로 대체:`, String(lastErr?.message || lastErr).slice(0, 120));
        }
        return { ...result, provider };
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr;
  }

  return { run, available, providerMode };
}
