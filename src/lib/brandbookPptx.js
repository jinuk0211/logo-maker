// 브랜드북 모델 + 캡처한 로고 이미지들 → .pptx (16:9)
import PptxGenJS from "pptxgenjs";
import { rgbStr, cmykStr, readableOn, isLight } from "./brandbook.js";

const INK = "1A2238";
const MUTED = "6B7280";
const LINE = "E4E6EF";
const hx = (h) => String(h || "#000000").replace("#", "").toUpperCase();

// pptx 이미지 헬퍼: dataURL 의 실제 종횡비에 맞춰 박스 안에 contain 배치
function contain(box, natW, natH) {
  const r = natW && natH ? natW / natH : 1;
  let w = box.w, h = box.w / r;
  if (h > box.h) { h = box.h; w = box.h * r; }
  return { x: box.x + (box.w - w) / 2, y: box.y + (box.h - h) / 2, w, h };
}

export async function exportBrandbookPptx(bb, images) {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "W", width: 13.333, height: 7.5 });
  pptx.layout = "W";
  pptx.author = "Brand Factory";
  pptx.company = bb.name;

  const primary = bb.palette[0].hex;
  const primHx = hx(primary);
  const primInkHx = hx(readableOn(primary));

  // 공통 푸터
  const footer = (s, n) => {
    s.addText(`${bb.name} · Brand Guidelines`, {
      x: 0.5, y: 7.02, w: 8, h: 0.3, fontSize: 8, color: MUTED, fontFace: "Arial",
    });
    s.addText(`${n}`, {
      x: 12.4, y: 7.02, w: 0.5, h: 0.3, fontSize: 8, color: MUTED, align: "right", fontFace: "Arial",
    });
  };
  const eyebrow = (s, t) =>
    s.addText(t.toUpperCase(), {
      x: 0.75, y: 0.62, w: 8, h: 0.3, fontSize: 11, bold: true, color: primHx,
      charSpacing: 2, fontFace: "Arial",
    });
  const title = (s, t) =>
    s.addText(t, { x: 0.72, y: 0.95, w: 11, h: 0.8, fontSize: 30, bold: true, color: INK, fontFace: "Arial" });

  /* 1. 표지 — 밝은 배경, 좌하단 정렬 (에디토리얼) */
  {
    const s = pptx.addSlide();
    s.background = { color: "FFFFFF" };
    // 상단 accent 바
    s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: primHx } });
    if (images.logoOnLight) {
      const p = contain({ x: 0.85, y: 0.72, w: 2.4, h: 1.1 }, images.logoOnLight.w, images.logoOnLight.h);
      s.addImage({ data: images.logoOnLight.data, x: 0.85, y: 0.72, w: p.w, h: p.h });
    }
    s.addText("BRAND GUIDELINES", {
      x: 7.5, y: 0.95, w: 5, h: 0.4, align: "right", fontSize: 12, bold: true,
      color: MUTED, charSpacing: 4, fontFace: "Arial",
    });
    // 대형 ® 워터마크 (은은하게)
    s.addText("®", { x: 10.3, y: 4.2, w: 2.7, h: 2.7, align: "right", fontSize: 140, bold: true, color: primHx, fontFace: "Arial", transparency: 88 });
    s.addShape(pptx.ShapeType.roundRect, { x: 0.9, y: 4.9, w: 0.75, h: 0.07, fill: { color: primHx }, rectRadius: 0.03 });
    s.addText(bb.name, { x: 0.82, y: 5.1, w: 11, h: 1.2, fontSize: 52, bold: true, color: INK, fontFace: "Arial" });
    s.addText(bb.tagline, { x: 0.9, y: 6.3, w: 10, h: 0.5, fontSize: 16, color: MUTED, fontFace: "Arial" });
  }

  /* 2. 브랜드 개요 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "01. Brand Overview");
    title(s, "브랜드 개요");
    s.addText(bb.mission, {
      x: 0.75, y: 2.1, w: 7.1, h: 1.6, fontSize: 18, color: INK, lineSpacingMultiple: 1.3, fontFace: "Arial",
    });
    s.addText("핵심 키워드", { x: 0.75, y: 3.9, w: 5, h: 0.3, fontSize: 11, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    bb.keywords.forEach((k, i) => {
      s.addShape(pptx.ShapeType.roundRect, {
        x: 0.75 + (i % 2) * 2.7, y: 4.25 + Math.floor(i / 2) * 0.72, w: 2.5, h: 0.55,
        fill: { color: "F2F3F5" }, line: { color: LINE, width: 1 }, rectRadius: 0.1,
      });
      s.addText(k, {
        x: 0.75 + (i % 2) * 2.7, y: 4.25 + Math.floor(i / 2) * 0.72, w: 2.5, h: 0.55,
        align: "center", valign: "middle", fontSize: 14, bold: true, color: INK, fontFace: "Arial",
      });
    });
    // 우측: 메타(업종/스타일) + 톤 오브 보이스
    s.addShape(pptx.ShapeType.line, { x: 8.3, y: 2.1, w: 0, h: 3.9, line: { color: LINE, width: 1.5 } });
    s.addText("업종", { x: 8.6, y: 2.15, w: 3.9, h: 0.3, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    s.addText(bb.business || "-", { x: 8.6, y: 2.45, w: 3.9, h: 0.5, fontSize: 18, bold: true, color: INK, fontFace: "Arial" });
    s.addText("로고 스타일", { x: 8.6, y: 3.2, w: 3.9, h: 0.3, fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    s.addText(bb.styleLabel, { x: 8.6, y: 3.5, w: 3.9, h: 0.5, fontSize: 18, bold: true, color: INK, fontFace: "Arial" });
    s.addShape(pptx.ShapeType.line, { x: 8.6, y: 4.35, w: 0.5, h: 0, line: { color: primHx, width: 2.5 } });
    s.addText("TONE OF VOICE", { x: 8.6, y: 4.5, w: 3.9, h: 0.3, fontSize: 10, bold: true, color: primHx, charSpacing: 1, fontFace: "Arial" });
    s.addText(bb.tone, { x: 8.6, y: 4.82, w: 3.9, h: 1.1, fontSize: 13, color: INK, lineSpacingMultiple: 1.3, fontFace: "Arial", valign: "top" });
    footer(s, 2);
  }

  /* 3. 로고 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "02. Logo");
    title(s, "로고");
    // 기본형 (라이트)
    s.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 2.1, w: 7.15, h: 3.55, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, rectRadius: 0.12 });
    if (images.logoOnLight) {
      const p = contain({ x: 1.35, y: 2.5, w: 5.95, h: 2.4 }, images.logoOnLight.w, images.logoOnLight.h);
      s.addImage({ data: images.logoOnLight.data, ...p });
    }
    s.addText("PRIMARY", { x: 0.75, y: 5.15, w: 7.15, h: 0.3, align: "center", fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    // 심볼 (화이트 — 래스터 로고 블렌드)
    s.addShape(pptx.ShapeType.roundRect, { x: 8.2, y: 2.1, w: 4.4, h: 1.68, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, rectRadius: 0.12 });
    if (images.symbolOnLight) {
      const p = contain({ x: 8.5, y: 2.32, w: 3.8, h: 1.05 }, images.symbolOnLight.w, images.symbolOnLight.h);
      s.addImage({ data: images.symbolOnLight.data, ...p });
    }
    s.addText("SYMBOL", { x: 8.2, y: 3.42, w: 4.4, h: 0.28, align: "center", fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    // 심볼 소형
    s.addShape(pptx.ShapeType.roundRect, { x: 8.2, y: 3.97, w: 4.4, h: 1.68, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, rectRadius: 0.12 });
    if (images.symbolOnLight) {
      const p = contain({ x: 9.9, y: 4.2, w: 1.0, h: 0.9 }, images.symbolOnLight.w, images.symbolOnLight.h);
      s.addImage({ data: images.symbolOnLight.data, ...p });
    }
    s.addText("SMALL", { x: 8.2, y: 5.3, w: 4.4, h: 0.28, align: "center", fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    if (bb.rationale) {
      s.addText([{ text: "“", options: { color: primHx } }, { text: bb.rationale + "”", options: { color: MUTED, italic: true } }],
        { x: 0.78, y: 5.85, w: 11.8, h: 0.7, fontSize: 12.5, lineSpacingMultiple: 1.25, fontFace: "Arial", valign: "top" });
    }
    footer(s, 3);
  }

  /* 4. 로고 사용 규정 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "03. Logo Usage");
    title(s, "로고 사용 규정");
    // DO
    s.addText("이렇게 사용하세요", { x: 0.75, y: 2.1, w: 5.6, h: 0.4, fontSize: 15, bold: true, color: "1F9D63", fontFace: "Arial" });
    bb.dos.forEach((d, i) =>
      s.addText([{ text: "✓  ", options: { color: "1F9D63", bold: true } }, { text: d, options: { color: INK } }], {
        x: 0.75, y: 2.6 + i * 0.62, w: 5.6, h: 0.55, fontSize: 13, lineSpacingMultiple: 1.1, fontFace: "Arial", valign: "top",
      })
    );
    // DON'T
    s.addText("이것은 피하세요", { x: 7.0, y: 2.1, w: 5.6, h: 0.4, fontSize: 15, bold: true, color: "D64545", fontFace: "Arial" });
    bb.donts.forEach((d, i) =>
      s.addText([{ text: "✕  ", options: { color: "D64545", bold: true } }, { text: d, options: { color: INK } }], {
        x: 7.0, y: 2.6 + i * 0.62, w: 5.6, h: 0.55, fontSize: 13, lineSpacingMultiple: 1.1, fontFace: "Arial", valign: "top",
      })
    );
    s.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 5.9, w: 11.85, h: 0.7, fill: { color: "F2F3F5" }, rectRadius: 0.1 });
    s.addText(bb.minSize + "     ·     여백은 로고 높이의 1/2 이상 확보", {
      x: 0.95, y: 5.9, w: 11.5, h: 0.7, valign: "middle", fontSize: 13, color: INK, fontFace: "Arial",
    });
    footer(s, 4);
  }

  /* 5. 컬러 팔레트 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "04. Color Palette");
    title(s, "컬러 팔레트");
    const n = bb.palette.length;
    const gap = 0.25, x0 = 0.75, totalW = 11.85;
    const w = (totalW - gap * (n - 1)) / n;
    bb.palette.forEach((c, i) => {
      const x = x0 + i * (w + gap);
      const onCol = hx(readableOn(c.hex));
      const chipH = w; // 정사각
      s.addShape(pptx.ShapeType.roundRect, { x, y: 2.15, w, h: chipH, fill: { color: hx(c.hex) }, line: { color: LINE, width: isLight(c.hex) ? 1 : 0 }, rectRadius: 0.1 });
      s.addText(c.role.toUpperCase(), { x: x + 0.18, y: 2.32, w: w - 0.36, h: 0.32, fontSize: 10, bold: true, color: onCol, transparency: 25, charSpacing: 1, fontFace: "Arial" });
      s.addText(c.name, { x: x + 0.18, y: 2.15, w: w - 0.36, h: chipH - 0.35, fontSize: 13, bold: true, color: onCol, valign: "bottom", fontFace: "Arial" });
      s.addText(
        [
          { text: "HEX  ", options: { color: MUTED, bold: true } }, { text: c.hex + "\n", options: { color: INK } },
          { text: "RGB  ", options: { color: MUTED, bold: true } }, { text: rgbStr(c.hex) + "\n", options: { color: INK } },
          { text: "CMYK ", options: { color: MUTED, bold: true } }, { text: cmykStr(c.hex), options: { color: INK } },
        ],
        { x: x + 0.02, y: 2.3 + chipH, w, h: 1.5, fontSize: 10.5, lineSpacingMultiple: 1.35, fontFace: "Arial", valign: "top" }
      );
    });
    footer(s, 5);
  }

  /* 6. 타이포그래피 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "05. Typography");
    title(s, "타이포그래피");
    s.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 2.1, w: 11.85, h: 1.7, fill: { color: primHx }, rectRadius: 0.12 });
    s.addText(bb.font.family, { x: 1.1, y: 2.35, w: 11, h: 1.2, fontSize: 44, bold: true, color: primInkHx, fontFace: "Arial" });
    s.addText(`${bb.font.family} · 국문/영문 지원`, { x: 1.1, y: 3.35, w: 11, h: 0.35, fontSize: 13, color: primInkHx, transparency: 20, fontFace: "Arial" });
    s.addText("제목 · 헤드라인", { x: 0.75, y: 4.2, w: 5.6, h: 0.3, fontSize: 11, bold: true, color: MUTED, fontFace: "Arial" });
    s.addText("다시 그리는 브랜드", { x: 0.75, y: 4.5, w: 5.6, h: 0.8, fontSize: 30, bold: true, color: INK, fontFace: "Arial" });
    s.addText("본문 · 캡션", { x: 7.0, y: 4.2, w: 5.6, h: 0.3, fontSize: 11, bold: true, color: MUTED, fontFace: "Arial" });
    s.addText(
      "브랜드의 목소리를 일관되게 전달하기 위한 본문용 서체입니다. 가나다라마바사 ABCDEFG 0123456789",
      { x: 7.0, y: 4.55, w: 5.6, h: 1.5, fontSize: 14, color: INK, lineSpacingMultiple: 1.35, fontFace: "Arial", valign: "top" }
    );
    footer(s, 6);
  }

  /* 7. 활용 예시 */
  {
    const s = pptx.addSlide();
    eyebrow(s, "06. Applications");
    title(s, "활용 예시");
    // 명함
    s.addShape(pptx.ShapeType.roundRect, { x: 0.75, y: 2.1, w: 6.0, h: 4.2, fill: { color: "F2F3F5" }, rectRadius: 0.12 });
    if (images.cardFront) {
      const p = contain({ x: 1.2, y: 2.5, w: 5.1, h: 3.0 }, images.cardFront.w, images.cardFront.h);
      s.addImage({ data: images.cardFront.data, ...p });
    }
    s.addText("명함", { x: 0.75, y: 5.85, w: 6, h: 0.3, align: "center", fontSize: 12, color: MUTED, fontFace: "Arial" });
    // 웹사이트 헤더 목업 (라이트)
    s.addShape(pptx.ShapeType.roundRect, { x: 7.05, y: 2.1, w: 5.55, h: 4.2, fill: { color: "F5F6F8" }, rectRadius: 0.12 });
    s.addShape(pptx.ShapeType.roundRect, { x: 7.55, y: 2.75, w: 4.55, h: 2.9, fill: { color: "FFFFFF" }, line: { color: LINE, width: 1 }, rectRadius: 0.08 });
    if (images.logoOnLight) {
      const p = contain({ x: 7.85, y: 3.0, w: 1.9, h: 0.62 }, images.logoOnLight.w, images.logoOnLight.h);
      s.addImage({ data: images.logoOnLight.data, x: 7.85, y: 3.0 + (0.62 - p.h) / 2, w: p.w, h: p.h });
    }
    [0, 1, 2].forEach((i) =>
      s.addShape(pptx.ShapeType.roundRect, { x: 10.95 - i * 0.42, y: 3.24, w: 0.28, h: 0.1, fill: { color: "D7DBE4" }, rectRadius: 0.05 })
    );
    s.addShape(pptx.ShapeType.rect, { x: 7.55, y: 3.95, w: 4.55, h: 1.7, fill: { color: primHx } });
    s.addText("WEBSITE HEADER", { x: 7.05, y: 5.85, w: 5.55, h: 0.3, align: "center", fontSize: 10, bold: true, color: MUTED, charSpacing: 1, fontFace: "Arial" });
    footer(s, 7);
  }

  /* 8. 마무리 */
  {
    const s = pptx.addSlide();
    s.background = { color: INK };
    s.addText("Thank you", { x: 0, y: 2.9, w: 13.333, h: 1, align: "center", fontSize: 40, bold: true, color: "FFFFFF", fontFace: "Arial" });
    s.addText(`${bb.name} Brand Guidelines`, { x: 0, y: 3.95, w: 13.333, h: 0.5, align: "center", fontSize: 15, color: "FFFFFF", transparency: 30, fontFace: "Arial" });
    s.addText("Made with LogoFactory", { x: 0, y: 6.7, w: 13.333, h: 0.4, align: "center", fontSize: 11, color: primHx, charSpacing: 2, fontFace: "Arial" });
  }

  const safe = (bb.name || "brand").replace(/[\\/:*?"<>|\s]+/g, "-");
  await pptx.writeFile({ fileName: `${safe}-브랜드북.pptx` });
}
