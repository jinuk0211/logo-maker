import { symbolSvg } from "./symbols.js";

/* 로고 PNG 내보내기 — 화면을 스크린샷하지 않고 캔버스에 직접 그린다.

   html-to-image 는 DOM 을 SVG foreignObject 로 감싸 브라우저에 재렌더시키는 방식이라
   폰트 CORS·object-fit·이미지 디코딩 타이밍 등 실패 지점이 많고, 실패해도 조용히
   빈 자리로 나온다(심볼만 사라지는 증상). 로고는 구성 요소가 확정적이라 직접 그리는 게 안전하다.

   레이아웃 수치는 LogoRender.jsx / LogoRender.css 와 1:1로 맞춘다. */

const GAP = { stacked: 12, badge: 20, horizontal: 18, icon: 18 };
const FONT_STACK = '"Poppins", "Noto Sans KR", sans-serif';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("심볼 이미지를 불러오지 못했습니다"));
    img.src = src;
  });
}

const svgToDataUrl = (svg) =>
  "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));

// object-fit: contain 과 동일하게 박스 안에 맞춘다
function containRect(img, boxW, boxH) {
  const r = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  return { w: img.naturalWidth * r, h: img.naturalHeight * r };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * 로고를 그린 PNG data URL 을 돌려준다.
 * @param background 없으면 투명 배경
 */
export async function renderLogoPng(logo, { scale = 8, background, padding = 0.14 } = {}) {
  const c = logo.colors || {};
  const ratio = logo.ratio ?? 50;
  const symbolPx = Math.round(84 * (0.62 + (ratio / 100) * 1.05));
  const fontPx = Math.round(34 * (1.32 - (ratio / 100) * 0.72));

  const showText = logo.includeText && logo.layout !== "icon";
  const stacked = logo.layout === "stacked";
  const gap = GAP[logo.layout] ?? 18;

  // 심볼 준비: AI 이미지가 있으면 그것, 없으면 목업 인라인 SVG
  const hasPlate = !logo.symbolImage && !!c.plate;
  const platePad = hasPlate ? Math.round(symbolPx * 0.26) : 0;
  const symbolBox = symbolPx + platePad * 2;

  const mockupSvg = () =>
    svgToDataUrl(
      symbolSvg(logo.symbolKey, {
        color: c.symbol,
        accent: c.accent,
        variant: logo.variant,
        size: symbolPx,
      })
    );

  // AI 이미지가 깨져 있어도 내보내기 전체가 죽지 않게 목업 심볼로 떨어진다
  let symbolImg;
  try {
    symbolImg = await loadImage(logo.symbolImage || mockupSvg());
  } catch {
    symbolImg = await loadImage(mockupSvg());
  }

  // 텍스트 크기 측정 (폰트가 준비된 뒤에)
  if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
  const measure = document.createElement("canvas").getContext("2d");
  const font = `${logo.weight || 700} ${fontPx}px ${FONT_STACK}`;
  measure.font = font;
  if (logo.letterSpacing) measure.letterSpacing = `${logo.letterSpacing}px`;
  const textW = showText ? measure.measureText(logo.name || "").width : 0;

  // 전체 크기
  const contentW = stacked
    ? Math.max(symbolBox, textW)
    : symbolBox + (showText ? gap + textW : 0);
  const contentH = stacked
    ? symbolBox + (showText ? gap + fontPx : 0)
    : Math.max(symbolBox, showText ? fontPx : 0);

  const pad = Math.round(Math.max(contentW, contentH) * padding);
  const W = Math.round(contentW + pad * 2);
  const H = Math.round(contentH + pad * 2);

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);

  if (background) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);
  }

  // 배치
  const symbolX = stacked ? pad + (contentW - symbolBox) / 2 : pad;
  const symbolY = stacked ? pad : pad + (contentH - symbolBox) / 2;

  if (hasPlate) {
    ctx.fillStyle = c.plate;
    roundRect(ctx, symbolX, symbolY, symbolBox, symbolBox, symbolPx * 0.28);
    ctx.fill();
  }

  const fit = containRect(symbolImg, symbolPx, symbolPx);
  ctx.drawImage(
    symbolImg,
    symbolX + platePad + (symbolPx - fit.w) / 2,
    symbolY + platePad + (symbolPx - fit.h) / 2,
    fit.w,
    fit.h
  );

  if (showText) {
    ctx.font = font;
    if (logo.letterSpacing) ctx.letterSpacing = `${logo.letterSpacing}px`;
    ctx.fillStyle = c.text || "#16223c";
    ctx.textBaseline = "middle";
    if (stacked) {
      ctx.textAlign = "center";
      ctx.fillText(logo.name || "", pad + contentW / 2, symbolY + symbolBox + gap + fontPx / 2);
    } else {
      ctx.textAlign = "left";
      ctx.fillText(logo.name || "", symbolX + symbolBox + gap, pad + contentH / 2);
    }
  }

  return canvas.toDataURL("image/png");
}
