import { toPng } from "html-to-image";
import { renderLogoPng } from "./exportLogo.js";

/* 로고 내보내기 — Results · Refine 공용.
   PNG 는 화면에 그려진 락업을 그대로 캡처하고, SVG 는 AI 가 벡터로 준 심볼만 꺼낸다. */

export function triggerDownload(href, filename) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export const safeFileName = (name) => (name || "logo").replace(/\s+/g, "-");

// 캡처 전에 폰트와 이미지가 실제로 준비됐는지 확인한다.
// img.complete 만으로는 디코딩이 끝난 게 아니라, 이 대기가 없으면 심볼이 빈 채로 찍힌다.
async function whenPaintable(node) {
  if (document.fonts?.ready) await document.fonts.ready.catch(() => {});
  const imgs = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? img.decode?.().catch(() => {})
        : new Promise((done) => {
            img.onload = done;
            img.onerror = done;
          })
    )
  );
}

export async function downloadNodeAsPng(node, filename, backgroundColor, extra = {}) {
  if (!node) return;
  await whenPaintable(node);

  // html-to-image 는 첫 호출에서 이미지가 비어 나오는 경우가 있다(bubkoo/html-to-image#361).
  // 한 번 예열해 클론·이미지 캐시를 채운 뒤 두 번째 결과를 쓴다.
  const opts = { pixelRatio: 3, backgroundColor, ...extra };
  await toPng(node, opts).catch(() => {});
  triggerDownload(await toPng(node, opts), filename);
}

// 로고 PNG 저장 — DOM 캡처 대신 캔버스로 직접 그려서 심볼이 빠지는 일이 없다.
export async function downloadLogoPng(logo, filename, background) {
  triggerDownload(await renderLogoPng(logo, { background }), filename);
}
