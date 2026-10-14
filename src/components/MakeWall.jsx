import { useEffect, useRef, useState } from "react";
import "./MakeWall.css";

/* 랜딩 마지막 섹션 — 공방 영상 위, 벽에 'Make your Logo' 를 박아둔다.
   화면에 들어오면 영상이 한 번 재생되고, 끝나면 마지막 프레임에서 멈춘다.
   같은 타이밍에 Make 가 왼쪽부터 스스슥 그어지듯 나타난다. */
export default function MakeWall() {
  const ref = useRef(null);
  const videoRef = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        // 모션 감소 설정이면 재생하지 않고 poster(첫 프레임)만 둔다
        if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
          videoRef.current?.play().catch(() => {});
        }
        io.disconnect(); // 한 번만 — 다시 스크롤해도 재생되지 않는다
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className={"mk" + (shown ? " on" : "")} ref={ref}>
      {/* loop 없음 → 8초 뒤 마지막 프레임에서 정지.
          화면에 들어올 때 재생하므로 preload 는 메타데이터만 받는다 */}
      <video
        ref={videoRef}
        className="mk-bg"
        src="/video_39218c06.mp4"
        poster="/Brand_Factory.png"
        preload="metadata"
        muted
        playsInline
        aria-label="로고를 제작하는 공방"
      />
      <h2 className="mk-wall">
        <span className="mk-script">Make</span>
        <span className="mk-sans">your Logo</span>
      </h2>
    </section>
  );
}
