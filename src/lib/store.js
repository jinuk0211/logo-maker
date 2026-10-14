// 계정별 로고 저장/불러오기 — Supabase 테이블 saved_logos + Storage 버킷 logos
import { supabase, currentUser } from "./auth.js";
import { knockoutWhite } from "./knockout.js";

export const RETENTION_DAYS = 60;
const BUCKET = "logos";

const need = () => {
  if (!supabase) throw new Error("Supabase 설정이 필요합니다.");
  const u = currentUser();
  if (!u) throw new Error("로그인이 필요합니다.");
  return u;
};
const b64ToBlob = (b64) => new Blob([Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))], { type: "image/png" });
const blobToB64 = (blob) => new Promise((ok, no) => {
  const r = new FileReader();
  r.onload = () => ok(String(r.result).split(",")[1]);
  r.onerror = no;
  r.readAsDataURL(blob);
});

// 저장 — 이미지는 Storage, 나머지는 jsonb. 반환: 행 id
export async function saveLogo(brief, logo) {
  const u = need();
  const { symbolImage, rawPng, ...meta } = logo; // 이미지는 테이블에 넣지 않는다
  const title = brief.nameEn?.trim() || brief.name?.trim() || "로고";

  // id 를 미리 만들어 이미지부터 올리고, 경로까지 한 번에 insert 한다.
  // (insert 후 update 하면 RLS 에 update 정책이 없을 때 조용히 막혀 이미지 없는 행만 남는다)
  const id = crypto.randomUUID();
  const b64 = rawPng || (symbolImage?.startsWith("data:") ? symbolImage.split(",")[1] : null);
  let image_path = null;
  if (b64) {
    const path = `${u.id}/${id}.png`;
    const up = await supabase.storage.from(BUCKET).upload(path, b64ToBlob(b64), { contentType: "image/png", upsert: true });
    if (up.error) throw new Error("이미지 업로드 실패: " + up.error.message);
    image_path = path;
  }
  const { error } = await supabase
    .from("saved_logos")
    .insert({ id, user_id: u.id, title, brief, logo: meta, image_path });
  if (error) {
    if (image_path) await supabase.storage.from(BUCKET).remove([image_path]).catch(() => {});
    throw new Error(error.message);
  }
  return id;
}

// 목록 — 최근 60일, 최신순 (썸네일은 별도로 loadImage)
export async function listLogos() {
  need();
  const since = new Date(Date.now() - RETENTION_DAYS * 86400e3).toISOString();
  const { data, error } = await supabase
    .from("saved_logos")
    .select("id,title,brief,logo,image_path,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

// 이미지 내려받기 → { rawPng(base64), symbolImage(누끼 data URL) }
export async function loadImage(imagePath) {
  if (!imagePath) return { rawPng: null, symbolImage: null };
  const { data, error } = await supabase.storage.from(BUCKET).download(imagePath);
  if (error) throw new Error("이미지 불러오기 실패: " + error.message);
  const rawPng = await blobToB64(data);
  const symbolImage = await knockoutWhite(`data:image/png;base64,${rawPng}`);
  return { rawPng, symbolImage };
}

// 행 하나를 App 의 { brief, logo } 로 복원
export async function restoreLogo(row) {
  const img = await loadImage(row.image_path);
  return { brief: row.brief, logo: { ...row.logo, ...img, id: row.logo.id || row.id } };
}

export async function deleteLogo(row) {
  need();
  if (row.image_path) await supabase.storage.from(BUCKET).remove([row.image_path]);
  const { error } = await supabase.from("saved_logos").delete().eq("id", row.id);
  if (error) throw new Error(error.message);
}
