import { useLayoutEffect, useRef, useState } from "react";
import { symbolSvg } from "../lib/symbols.js";
import "./LogoRender.css";

const SIZE_SCALE = { sm: 0.62, md: 1, lg: 1.5, xl: 2.35 };

// 로고 config → 실제 화면 락업(lockup)
export default function LogoRender({ logo, size = "md" }) {
  const k = SIZE_SCALE[size] || 1;
  // 긴 브랜드명이 컨테이너 밖으로 밀려나지 않게 — 넘치면 글자 크기를 줄인다 (레이아웃은 안 밀림)
  const rootRef = useRef(null);
  const textRef = useRef(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const root = rootRef.current, text = textRef.current;
    if (!root || !text) return;
    const parent = root.parentElement;
    if (!parent) return;
    const measure = () => {
      const avail = parent.clientWidth;
      if (!avail) return;
      // fit=1 기준의 자연 폭을 구한다 (현재 축소 상태를 되돌려 계산)
      const cur = Number(text.dataset.fit || 1);
      const naturalText = text.scrollWidth / cur;
      const others = root.scrollWidth - text.scrollWidth; // 심볼 + 간격
      const need = root.classList.contains("lr-stacked") ? naturalText : others + naturalText;
      setFit(Math.max(0.3, Math.min(1, avail / need)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(parent);
    return () => ro.disconnect();
  }, [logo.name, logo.layout, size, logo.weight, logo.letterSpacing]);
  const c = logo.colors;

  // ratio: 0(텍스트 큼) ↔ 100(아이콘 큼)
  const symbolScale = 0.62 + (logo.ratio / 100) * 1.05;
  const fontScale = 1.32 - (logo.ratio / 100) * 0.72;

  const symbolPx = Math.round(84 * k * symbolScale);
  const fontPx = Math.round(34 * k * fontScale);

  const hasPlate = !!c.plate;
  const platePad = Math.round(symbolPx * 0.26);

  /* AI 가 준 이미지가 있으면 그 자체가 완성된 로고다 (조합형·워드마크는 브랜드명까지 포함).
     여기에 HTML 글자를 또 얹으면 폰트·톤이 따로 놀아서, 이미지만 그대로 보여준다. */
  if (logo.symbolImage) {
    const px = Math.round(symbolPx * 1.6); // 글자까지 든 락업이라 심볼 단독보다 크게
    return (
      <div className="lr lr-asis">
        <img className="lr-full" src={logo.symbolImage} alt={logo.name} draggable="false"
          style={{ width: px, height: px }} />
      </div>
    );
  }

  // 목업 폴백 — AI 생성이 실패했을 때만 인라인 SVG + 웹폰트 글자로 조립
  const symbolNode = (
    <div
      className={"lr-symbol" + (hasPlate ? " lr-plated" : "")}
      style={
        hasPlate
          ? { background: c.plate, padding: platePad, borderRadius: symbolPx * 0.28 }
          : undefined
      }
      dangerouslySetInnerHTML={{
        __html: symbolSvg(logo.symbolKey, {
          color: c.symbol,
          accent: c.accent,
          variant: logo.variant,
          size: symbolPx,
        }),
      }}
    />
  );

  const textNode = logo.includeText && logo.layout !== "icon" && (
    <span
      ref={textRef}
      data-fit={fit}
      className="lr-text"
      style={{
        color: c.text,
        fontSize: Math.round(fontPx * fit),
        fontWeight: logo.weight,
        letterSpacing: `${logo.letterSpacing}px`,
      }}
    >
      {logo.name}
    </span>
  );

  return (
    <div ref={rootRef} className={`lr lr-${logo.layout}`} data-plate={hasPlate ? "y" : "n"}>
      {symbolNode}
      {textNode}
    </div>
  );
}
