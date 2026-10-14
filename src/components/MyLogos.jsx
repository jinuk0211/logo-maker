import { useEffect, useState } from "react";
import { listLogos, loadImage, restoreLogo, deleteLogo, RETENTION_DAYS } from "../lib/store.js";
import "./MyLogos.css";

const fmt = (iso) => new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
const daysLeft = (iso) => Math.max(0, RETENTION_DAYS - Math.floor((Date.now() - new Date(iso)) / 86400e3));

export default function MyLogos({ onBack, onOpen }) {
  const [rows, setRows] = useState(null);
  const [thumbs, setThumbs] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    listLogos().then(async (list) => {
      setRows(list);
      // 썸네일은 순차로 — 한꺼번에 받으면 스토리지 요청 폭주
      for (const r of list) {
        try { const { symbolImage } = await loadImage(r.image_path); setThumbs((t) => ({ ...t, [r.id]: symbolImage })); } catch {}
      }
    }).catch((e) => setErr(e.message));
  }, []);

  async function open(row) {
    setBusy(row.id);
    try { onOpen(await restoreLogo(row)); } catch (e) { setErr(e.message); } finally { setBusy(null); }
  }
  async function remove(row) {
    if (!confirm(`'${row.title}' 로고를 삭제할까요?`)) return;
    setBusy(row.id);
    try { await deleteLogo(row); setRows((rs) => rs.filter((r) => r.id !== row.id)); } catch (e) { setErr(e.message); } finally { setBusy(null); }
  }

  return (
    <section className="wiz-step">
      <div className="mine">
        <button className="step-back" onClick={onBack}>← BACK</button>
        <span className="step-eyebrow">MY LOGOS</span>
        <h2 className="step-q">저장한 로고</h2>
        <p className="mine-hint">저장한 로고는 {RETENTION_DAYS}일 동안 보관돼요. 열면 편집·명함·브랜드북을 이어서 만들 수 있어요.</p>
        {err && <p className="login-err">{err}</p>}
        {rows === null && !err && <p className="mine-empty">불러오는 중…</p>}
        {rows?.length === 0 && <p className="mine-empty">아직 저장한 로고가 없어요. 로고를 만든 뒤 다듬기 화면에서 '내 계정에 저장'을 눌러보세요.</p>}
        <div className="mine-grid">
          {rows?.map((r) => (
            <article key={r.id} className={"mine-card" + (busy === r.id ? " busy" : "")}>
              <button className="mine-thumb" onClick={() => open(r)} title="열기">
                {thumbs[r.id] ? <img src={thumbs[r.id]} alt={r.title} /> : <span className="mine-thumb-ph" />}
              </button>
              <div className="mine-meta">
                <strong>{r.title}</strong>
                <span>{r.logo?.styleLabel || ""}</span>
                <span className="mine-date">{fmt(r.created_at)} · {daysLeft(r.created_at)}일 남음</span>
              </div>
              <div className="mine-actions">
                <button className="bar-btn bar-dark" onClick={() => open(r)} disabled={busy === r.id}>열기</button>
                <button className="bar-btn bar-ghost" onClick={() => remove(r)} disabled={busy === r.id}>삭제</button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
