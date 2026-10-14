import { useEffect, useState } from "react";
import { SAMPLES } from "../lib/logoSamples.jsx";
import { knockoutWhite } from "../lib/knockout.js";
import { isLight } from "../lib/brandbook.js";
import "./Hero.css";

/* 한 자리에서 순서대로 퐁-퐁 나타나는 샘플 로고
   실제 생성 결과물 이미지를 쓰되, 배경이 밝은 것만 고른다.
   누끼는 흰 배경 기준이라 다크 판(ORBIT 등)은 사각형이 그대로 남는다. */
const NAVY = "#16233c";
const BLUE = "#2f6bf6";
const HERO_SAMPLES = SAMPLES.filter((s) => s.image && isLight(s.bg)).slice(0, 4);
const FALLBACK = SAMPLES.slice(0, 4).map((s) => ({ id: s.id, art: s.art(NAVY, BLUE) }));
const HERO = HERO_SAMPLES.length === 4 ? HERO_SAMPLES : FALLBACK;

const BADGES = [
  { top: "간단함", mid: "질문 6개", bot: "3분이면 끝" },
  { top: "디자인 지식", mid: "몰라도 OK", bot: "고르기만 하면" },
  { top: "명함까지", mid: "제작 · 배송", bot: "원스톱" },
];

export default function Hero({ onStart }) {
  // 흰 히어로 위에 배경 사각형 없이 얹히도록 배경을 벗겨 둔다
  const [cut, setCut] = useState({});
  useEffect(() => {
    let alive = true;
    Promise.all(
      HERO.filter((s) => s.image).map(async (s) => [s.id, await knockoutWhite(s.image)])
    ).then((pairs) => alive && setCut(Object.fromEntries(pairs)));
    return () => { alive = false; };
  }, []);

  return (
    <section className="hero rise">
      <div className="hero-inner">
        <h1 className="hero-title">
          7번의 클릭으로
          <br />
          완성하는
          <br />
          <span className="hero-ul">브랜드 로고</span> &amp; 명함
        </h1>

        <p className="hero-ment">
          이름과 원하는 느낌만 고르면 끝. 어려운 설정은 없어요.
          <br className="br-lg" />
          3분이면 로고가 나오고, 그대로 명함까지 이어집니다.
        </p>

        <div className="hero-cta">
          <button className="btn btn-primary btn-hero" onClick={onStart}>
            로고 만들기 시작
            <span className="arrow">→</span>
          </button>
        </div>

        <div className="hero-badges">
          {BADGES.map((b) => (
            <div className="hexbadge" key={b.top}>
              <span className="hb-top">{b.top}</span>
              <strong className="hb-mid">{b.mid}</strong>
              <span className="hb-bot">{b.bot}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hero-art">
        <div className="pop-stage" aria-hidden="true">
          {HERO.map((s, i) => (
            <div
              className="pop-card"
              key={s.id}
              style={{ animationDelay: `${i * 3.15}s`, "--i": i }}
            >
              <div className={"pop-art" + (s.image ? " pop-art-img" : "")}>
                {s.image ? (
                  <img className="pop-img" src={cut[s.id] || s.image} alt="" />
                ) : (
                  <svg viewBox="0 0 120 96">{s.art}</svg>
                )}
              </div>
            </div>
          ))}
          <div className="pop-dots">
            {HERO.map((s, i) => (
              <span key={s.id} style={{ animationDelay: `${i * 3.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
