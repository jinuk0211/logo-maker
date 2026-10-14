// 프론트 → /api/* (dev: Vite 미들웨어, 배포: Vercel 함수) → Gemini · OpenAI · Claude
import { knockoutWhite } from "./knockout.js";
import { extractPalette } from "./palette.js";
import { authHeaders, onUnauthorized } from "./auth.js";

// 신규 생성 — variant 로 mix 순서 결정, 응답에 실제 사용된 provider 포함
export async function generateSymbol(brief, variant = 0) {
  const json = await post({ brief, variant });
  // 화면용은 누끼를 딴 것, 재편집용 rawPng 는 모델이 준 원본 그대로 유지
  const imageUrl = await knockoutWhite(json.imageUrl);
  return {
    imageUrl,
    // 실제 생성된 로고에서 뽑은 색 — 목업 기본 팔레트 대신 이걸 쓴다
    palette: await extractPalette(imageUrl),
    rationale: json.rationale || "",
    rawPng: json.rawPng || null,
    provider: json.provider || null,
  };
}

// 편집 — 만든 모델(provider)로 이어가기
export async function editSymbol(editImage, instruction, brief, provider) {
  const json = await post({ editImage, instruction, brief, provider });
  return {
    imageUrl: await knockoutWhite(json.imageUrl),
    rawPng: json.rawPng || null,
    provider: json.provider || provider,
  };
}

async function post(payload) {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) onUnauthorized();
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  if (!json.imageUrl) throw new Error("이미지 URL 없음");
  return json;
}

// 브랜드북 콘텐츠 — Claude 가 생성. 키가 없거나 실패하면 호출부가 템플릿으로 폴백한다.
export async function generateBrandbookDoc(brief, logo, extra = null) {
  const res = await fetch("/api/brandbook", {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders() },
    body: JSON.stringify({ brief, logo, extra: extra || undefined }),
  });
  if (res.status === 401) onUnauthorized();
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}
