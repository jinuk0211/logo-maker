import {
  buildImagePrompt,
  buildRationalePrompt,
  buildEditPrompt,
  cleanRationale,
  styleRefFor,
} from "./prompts.js";

// 실측(2026-08): gpt-image-2/high 162.5s · /medium 45.3s · /low 16.4s · gpt-image-1/medium 18.0s.
// 30초 예산 안에서 품질이 가장 나은 조합으로 gpt-image-1/medium 선택.
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini";
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium"; // low | medium | high
const GEN_URL = "https://api.openai.com/v1/images/generations";
const EDIT_URL = "https://api.openai.com/v1/images/edits";
const CHAT_URL = "https://api.openai.com/v1/chat/completions";

async function failDetail(res) {
  try {
    return JSON.stringify(await res.json());
  } catch {
    return res.statusText;
  }
}

// 이미지 생성 → base64 PNG
async function generateImage(prompt, apiKey) {
  const res = await fetch(GEN_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: "1024x1024",
      quality: QUALITY,
      n: 1,
      output_format: "png",
      background: "transparent", // 심볼만 남겨서 어떤 배경에도 얹을 수 있게
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await failDetail(res)}`);
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI 응답에 이미지가 없음");
  return b64;
}

// 이미지 편집(image-to-image) → base64 PNG
async function editImage(rawPngBase64, prompt, apiKey) {
  const form = new FormData();
  form.append("model", IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("size", "1024x1024");
  form.append("quality", QUALITY);
  form.append("background", "transparent");
  form.append(
    "image",
    new Blob([Buffer.from(rawPngBase64, "base64")], { type: "image/png" }),
    "logo.png"
  );

  const res = await fetch(EDIT_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await failDetail(res)}`);
  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI 응답에 수정 이미지가 없음");
  return b64;
}

// 설명 (실패해도 무시)
async function generateRationale(brief, apiKey) {
  try {
    const res = await fetch(CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TEXT_MODEL,
        messages: [{ role: "user", content: buildRationalePrompt(brief) }],
      }),
    });
    if (!res.ok) return "";
    const json = await res.json();
    return cleanRationale(json?.choices?.[0]?.message?.content || "");
  } catch {
    return "";
  }
}

// 항상 컬러 PNG (투명 배경)
const finish = (b64) => ({ imageUrl: `data:image/png;base64,${b64}`, rawPng: b64 });

// 신규 생성
export async function generateSymbolOpenAI(brief, variant, apiKey) {
  if (!apiKey) throw new Error("OPENAI_API_KEY 미설정 — .env 에 추가 필요");
  // generations 엔드포인트는 참고 이미지를 못 받으므로, 참고 이미지가 있으면 edits 로 보낸다
  const ref = styleRefFor(brief);
  const prompt = buildImagePrompt(brief, variant);
  const [b64, rationale] = await Promise.all([
    ref?.image ? editImage(ref.image, prompt, apiKey) : generateImage(prompt, apiKey),
    generateRationale(brief, apiKey),
  ]);
  return { ...finish(b64), rationale };
}

// 편집
export async function editSymbolOpenAI(rawPngBase64, instruction, apiKey) {
  if (!apiKey) throw new Error("OPENAI_API_KEY 미설정 — .env 에 추가 필요");
  if (!rawPngBase64) throw new Error("편집할 원본 이미지가 없음");
  return finish(await editImage(rawPngBase64, buildEditPrompt(instruction), apiKey));
}
