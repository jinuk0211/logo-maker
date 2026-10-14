import {
  buildImagePrompt,
  buildRationalePrompt,
  buildEditPrompt,
  cleanRationale,
  styleRefFor,
} from "./prompts.js";

// Gemini 이미지 모델(통칭 "나노 바나나")로 로고를 그리고, 설명은 텍스트 모델로 따로 받는다.
// 실측(2026-08): 2.5-flash 11.2s / 3.1-flash 38.9s / 3-pro 응답 실패.
// 속도·안정성 기준으로 2.5-flash 유지. 바꾸려면 .env 의 GEMINI_IMAGE_MODEL.
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
const ENDPOINT = (model, key) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

async function failDetail(res) {
  try {
    return JSON.stringify(await res.json());
  } catch {
    return res.statusText;
  }
}

// Gemini 호출 (parts 를 그대로 전달) — 이미지가 올 때까지 최대 3회
async function callImage(parts, apiKey) {
  const url = ENDPOINT(IMAGE_MODEL, apiKey);
  let inline = null;
  for (let attempt = 0; attempt < 3 && !inline?.data; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts }] }),
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}: ${await failDetail(res)}`);
    const j = await res.json();
    const img = (j?.candidates?.[0]?.content?.parts || []).find(
      (p) => p.inlineData || p.inline_data
    );
    inline = img?.inlineData || img?.inline_data;
  }
  return inline;
}

async function generateRationale(brief, apiKey) {
  try {
    const res = await fetch(ENDPOINT(TEXT_MODEL, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildRationalePrompt(brief) }] }] }),
    });
    if (!res.ok) return "";
    const j = await res.json();
    const t = (j?.candidates?.[0]?.content?.parts || [])
      .filter((p) => p.text)
      .map((p) => p.text)
      .join(" ");
    return cleanRationale(t);
  } catch {
    return "";
  }
}

// 항상 컬러 PNG — 흰 배경은 프론트의 knockoutWhite 가 벗겨낸다
const finish = (b64) => ({ imageUrl: `data:image/png;base64,${b64}`, rawPng: b64 });

// 신규 생성
export async function generateSymbolNano(brief, variant, apiKey) {
  if (!apiKey) throw new Error("GEMINI_API_KEY 미설정 — .env 에 추가 필요");
  // 조합별 참고 이미지가 있으면 프롬프트 앞에 첨부 (색은 프롬프트에서 무시하도록 지시됨)
  const ref = styleRefFor(brief);
  const parts = [];
  if (ref?.image) parts.push({ inlineData: { mimeType: ref.mimeType, data: ref.image } });
  parts.push({ text: buildImagePrompt(brief, variant) });
  const [inline, rationale] = await Promise.all([
    callImage(parts, apiKey),
    generateRationale(brief, apiKey),
  ]);
  if (!inline?.data) throw new Error("Gemini 가 이미지를 반환하지 않음 (재시도 초과)");
  return { ...finish(inline.data), rationale };
}

// 편집 (원본 PNG + 명령)
export async function editSymbolNano(rawPngBase64, instruction, apiKey) {
  if (!apiKey) throw new Error("GEMINI_API_KEY 미설정 — .env 에 추가 필요");
  if (!rawPngBase64) throw new Error("편집할 원본 이미지가 없음");
  const inline = await callImage(
    [
      { inlineData: { mimeType: "image/png", data: rawPngBase64 } },
      { text: buildEditPrompt(instruction) },
    ],
    apiKey
  );
  if (!inline?.data) throw new Error("Gemini 가 수정 이미지를 반환하지 않음 (재시도 초과)");
  return finish(inline.data);
}
