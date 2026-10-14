/* 생성된 로고 이미지에서 실제 브랜드 컬러를 뽑는다.

   "컬러 선택 안함" 으로 만들면 모델이 알아서 색을 정하는데,
   화면에는 목업 기본 팔레트(초록)가 떠서 실제 로고와 어긋났다.
   이미지에서 직접 추출해 그 색을 브랜드 컬러로 쓴다. */

const hex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
// 채도 — 무채색(회색·검정·흰색)을 걸러내는 데 쓴다
const sat = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return mx === 0 ? 0 : (mx - mn) / mx;
};
const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));

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
 * 이미지에서 대표색을 뽑아 { symbol, accent, text } 형태로 돌려준다.
 * 실패하면 null — 호출부가 기존 팔레트를 유지하면 된다.
 */
export async function extractPalette(src) {
  if (!src || typeof src !== "string") return null;
  try {
    const img = await loadImage(src);
    // 128px 로 줄여서 세면 충분하고 훨씬 빠르다
    const N = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const px = ctx.getImageData(0, 0, N, N).data;

    // 24단계로 양자화해 비슷한 색을 한 통에 모은다
    const Q = 24;
    const bins = new Map();
    for (let i = 0; i < px.length; i += 4) {
      if (px[i + 3] < 200) continue; // 배경(투명) 제외
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      if (luma(r, g, b) > 244) continue; // 거의 흰색 제외
      const k = `${Math.round(r / Q)},${Math.round(g / Q)},${Math.round(b / Q)}`;
      const e = bins.get(k) || { n: 0, r: 0, g: 0, b: 0 };
      e.n++; e.r += r; e.g += g; e.b += b;
      bins.set(k, e);
    }
    if (!bins.size) return null;

    const all = [...bins.values()]
      .map((e) => ({ n: e.n, c: [e.r / e.n, e.g / e.n, e.b / e.n] }))
      .sort((a, b) => b.n - a.n);

    // 서로 충분히 다른 색만 골라 담는다 (같은 색조 변주가 3개 나오는 걸 방지)
    const picked = [];
    for (const e of all) {
      if (picked.every((p) => dist(p.c, e.c) > 40)) picked.push(e);
      if (picked.length >= 4) break;
    }

    /* 주조색 고르기 — 면적만 보면 배경에 가까운 어두운 덩어리가 뽑힌다.
       (예: NOVA 는 네이비가 제일 넓지만 브랜드색은 파랑)
       채도를 강하게, 면적을 약하게 반영해 "선명하면서도 충분히 쓰인" 색을 고른다. */
    const total = picked.reduce((s, p) => s + p.n, 0);
    const score = (p) => Math.pow(sat(...p.c), 1.6) * Math.pow(p.n / total, 0.35);
    const ranked = [...picked].sort((a, b) => score(b) - score(a));

    const symbol = ranked[0].c;
    /* 보조색은 주조색과 확실히 구분될 때만 인정한다.
       단색(흑백) 로고에서는 같은 색이 세 칸 반복되어 팔레트가 무너졌다. */
    /* 면적 하한을 두지 않으면 안티에일리어싱 가장자리 색(예: 검정 로고의 회색 테두리)이
       보조색으로 잡힌다. 전체의 8% 이상 쓰인 색만 인정한다. */
    const accentPick = ranked
      .slice(1)
      .find((p) => dist(p.c, symbol) > 40 && p.n / total >= 0.08);

    // 글자색은 가장 어두운 색 (없으면 기본 잉크)
    const darkest = [...picked].sort((a, b) => luma(...a.c) - luma(...b.c))[0];
    const textPick = luma(...darkest.c) < 140 ? darkest.c : [26, 34, 56];

    const out = { symbol: hex(...symbol) };
    if (accentPick) out.accent = hex(...accentPick.c); // ranked 원소는 {n, c} 객체
    const textHex = hex(...textPick);
    if (textHex !== out.symbol && textHex !== out.accent) out.text = textHex;

    // 유채색이 하나도 없으면 사실상 흑백 로고 — 호출부가 다르게 표시할 수 있게 알린다
    out.mono = sat(...symbol) < 0.12 && !accentPick;
    return out;
  } catch (e) {
    console.warn("팔레트 추출 실패:", e);
    return null;
  }
}
