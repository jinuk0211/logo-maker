import "./Pricing.css";

/* 요금 — 딱 두 가지. 회당(10회권)과 월정액. */
const PLANS = [
  {
    id: "pack",
    name: "10회권",
    price: "50,000",
    unit: "원 / 10회",
    per: "회당 5,000원",
    desc: "필요할 때만. 로고 10번 생성에 명함·브랜드북까지.",
    items: ["로고 생성 10회 (후보 2장씩)", "AI 수정 · 다듬기 무제한", "명함 · 브랜드북 제작", "PNG · SVG · PPTX 내보내기", "60일 저장 · 다시 열기"],
    cta: "10회권 시작",
  },
  {
    id: "monthly",
    name: "월정액",
    price: "249,000",
    unit: "원 / 월",
    per: "생성 횟수 제한 없음",
    desc: "여러 브랜드를 계속 만드는 팀 · 에이전시용.",
    items: ["로고 생성 무제한", "AI 수정 · 다듬기 무제한", "명함 · 브랜드북 제작", "PNG · SVG · PPTX 내보내기", "60일 저장 · 다시 열기", "우선 생성 큐"],
    cta: "월정액 시작",
    featured: true,
  },
];

export default function Pricing({ onStart }) {
  return (
    <section className="pricing" id="price">
      <div className="pricing-head">
        <span className="pricing-eyebrow">PRICING</span>
        <h2>필요한 만큼만, 둘 중 하나</h2>
        <p>복잡한 등급 없이 회당과 월정액. 언제든 바꿀 수 있어요.</p>
      </div>
      <div className="pricing-grid">
        {PLANS.map((p) => (
          <article key={p.id} className={"plan" + (p.featured ? " featured" : "")}>
            {p.featured && <span className="plan-badge">추천</span>}
            <h3>{p.name}</h3>
            <p className="plan-desc">{p.desc}</p>
            <div className="plan-price">
              <strong>{p.price}</strong>
              <span>{p.unit}</span>
            </div>
            <span className="plan-per">{p.per}</span>
            <ul>
              {p.items.map((t) => <li key={t}>{t}</li>)}
            </ul>
            <button className={"plan-cta" + (p.featured ? " dark" : "")} onClick={onStart}>{p.cta} →</button>
          </article>
        ))}
      </div>
      <p className="pricing-note">부가세 별도 · 결제는 준비 중이며, 지금은 로그인만 하면 바로 만들어볼 수 있어요.</p>
    </section>
  );
}
