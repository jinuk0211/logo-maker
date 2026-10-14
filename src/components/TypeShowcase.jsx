import { useRef } from "react";
import { SAMPLES } from "../lib/logoSamples.jsx";
import "./TypeShowcase.css";

export default function TypeShowcase({ onStart }) {
  const rowRef = useRef(null);

  const scrollBy = (dir) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.7, behavior: "smooth" });
  };

  return (
    <section className="ts">
      <div className="ts-top">
        <div>
          <span className="ts-eyebrow">LOGO TYPES</span>
          <h2 className="ts-h2">타입별로 뽑아드려요</h2>
          <p className="ts-sub">
            같은 이름이라도 형태와 분위기를 바꾸면 이렇게 달라집니다. 마음에 드는 방향만 고르세요.
          </p>
        </div>
        <div className="ts-nav">
          <button className="ts-arrow" onClick={() => scrollBy(-1)} aria-label="이전">
            ←
          </button>
          <button className="ts-arrow" onClick={() => scrollBy(1)} aria-label="다음">
            →
          </button>
        </div>
      </div>

      <div className="ts-row" ref={rowRef}>
        {SAMPLES.map((s) => (
          <article className="ts-item" key={s.id}>
            <header className="ts-item-head">
              <h3 className="ts-item-title">
                {s.title[0]}
                <br />
                {s.title[1]}
              </h3>
              <p className="ts-item-meta">
                {s.brand}
                <br />
                <span>{s.kind}</span>
              </p>
            </header>
            {s.image ? (
              /* 이미지는 배경까지 포함된 완성본이라 패널을 꽉 채운다 */
              <div className="ts-panel ts-panel-img">
                <img src={s.image} alt={`${s.brand} ${s.kind} 예시`} loading="lazy" />
              </div>
            ) : (
              <div className="ts-panel" style={{ background: s.bg }}>
                <svg viewBox="0 0 120 96" aria-label={`${s.brand} ${s.kind} 예시`}>
                  {s.art(s.ink, s.accent)}
                </svg>
              </div>
            )}
          </article>
        ))}
        <article className="ts-item ts-item-cta">
          <header className="ts-item-head">
            <h3 className="ts-item-title">
              내 브랜드는
              <br />
              어떤 모습일까요?
            </h3>
            <p className="ts-item-meta">
              지금 바로
              <br />
              <span>3분이면 확인</span>
            </p>
          </header>
          <button className="ts-panel ts-cta-panel" onClick={onStart}>
            <span className="ts-cta-plus">+</span>
            <span className="ts-cta-text">로고 만들기 시작</span>
          </button>
        </article>
      </div>
    </section>
  );
}
