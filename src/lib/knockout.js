/* 이미지 모델은 "순백색 배경"으로 로고를 그려주기 때문에, 그대로 쓰면
   회색 패널·명함·다크 배경 위에 흰 사각형이 그대로 얹힌다.
   흰 배경만 알파로 빼서 심볼이 어떤 배경에도 떠 있게 만든다. */

// 완전히 흰 지점(HI 이상)은 투명, 확실히 잉크인 지점(LO 이하)은 불투명,
// 그 사이 안티에일리어싱 띠는 부분 알파 — 계단 현상 없이 가장자리가 부드럽게 떨어진다.
const HI = 250;
const LO = 228;

// 배경이 순백이 아닐 때(오프화이트 판) 쓰는 거리 기준
const NEAR = 8; // 이 안이면 배경으로 보고 완전 투명
const FAR = 34; // 이 밖이면 잉크 — 사이는 부분 알파

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/* 네 모서리를 찍어 단색 밝은 배경인지 알아낸다.
   AI 결과물은 순백이지만, 손으로 넣는 예시 에셋은 오프화이트 판인 경우가 많다. */
function detectBg(px, w, h) {
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [px[i], px[i + 1], px[i + 2], px[i + 3]];
  };
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  if (corners.some((c) => c[3] < 250)) return null; // 이미 투명 배경
  const avg = [0, 1, 2].map((k) => corners.reduce((s, c) => s + c[k], 0) / 4);
  const spread = Math.max(
    ...corners.map((c) => Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - avg[k]))))
  );
  if (spread > 6) return null; // 모서리가 제각각 → 단색 판이 아님
  if (luma(...avg) < 235) return null; // 어두운 배경은 건드리지 않는다
  return avg;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * 라스터 심볼의 흰 배경을 제거한 PNG data URL 을 돌려준다.
 * SVG(벡터)나 처리 불가한 입력은 원본을 그대로 돌려주므로 호출부에서 분기할 필요가 없다.
 */
export async function knockoutWhite(src) {
  if (!src || typeof src !== "string") return src;
  if (src.startsWith("data:image/svg")) return src; // 벡터는 배경 자체가 없음

  try {
    const img = await loadImage(src);
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return src;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;

    // 이미 배경이 투명하면(예: OpenAI transparent) 1M 픽셀 루프를 돌 이유가 없다
    const corners = [0, (w - 1) * 4, (h - 1) * w * 4, ((h - 1) * w + w - 1) * 4];
    if (corners.every((i) => px[i + 3] < 8)) return src;

    const bg = detectBg(px, w, h);

    for (let i = 0; i < px.length; i += 4) {
      if (bg) {
        // 감지한 배경색과의 거리로 판단 — 밝지만 배경과 다른 색(연분홍 등)은 살아남는다
        const d = Math.max(
          Math.abs(px[i] - bg[0]),
          Math.abs(px[i + 1] - bg[1]),
          Math.abs(px[i + 2] - bg[2])
        );
        if (d <= NEAR) px[i + 3] = 0;
        else if (d < FAR) px[i + 3] = Math.round(px[i + 3] * ((d - NEAR) / (FAR - NEAR)));
      } else {
        const l = luma(px[i], px[i + 1], px[i + 2]);
        if (l >= HI) px[i + 3] = 0;
        else if (l > LO) px[i + 3] = Math.round(px[i + 3] * ((HI - l) / (HI - LO)));
      }
    }
    /* 눈에 안 보이는 알파 잔여(1~10)를 0 으로 눌러버린다.
       JPEG 노이즈 탓에 배경 전체에 미세 알파가 흩어지는데,
       drop-shadow 같은 알파 기반 효과가 그걸 따라 사각형 그림자를 그린다. */
    for (let i = 3; i < px.length; i += 4) if (px[i] < 12) px[i] = 0;

    ctx.putImageData(data, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return src; // CORS 등으로 캔버스가 오염되면 원본 유지
  }
}
