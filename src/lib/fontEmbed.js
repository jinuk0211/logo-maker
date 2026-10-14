/* html-to-image 용 폰트 임베드 CSS — 필요한 것만, 한 번만.

   기본 동작은 캡처할 때마다 문서의 모든 @font-face(구글 한글 폰트 20종 × 유니코드 서브셋 100+개)를
   전부 받아 base64 로 박는다. 수천 건 요청 + 수십 MB 문자열 → 느리고 탭이 죽는다.
   여기서는 1) 노드가 실제로 쓰는 font-family 만, 2) 그중 브라우저가 실제로 로드한 서브셋만 골라
   3) 파일·결과를 캐시해서 fontEmbedCSS 옵션으로 넘긴다. */

const cssTextCache = new Map(); // 스타일시트 URL → CSS 텍스트
const fileCache = new Map();    // 폰트 파일 URL → data URL
const resultCache = new Map();  // 패밀리 키 → 임베드 CSS

const norm = (s) => String(s || "").replace(/["']/g, "").trim().toLowerCase();
const normRange = (s) => String(s || "").replace(/\s+/g, "").toLowerCase();

// 노드 서브트리가 쓰는 첫 번째 font-family 들
function usedFamilies(node) {
  const set = new Set();
  const add = (el) => {
    const fam = getComputedStyle(el).fontFamily.split(",")[0];
    if (fam) set.add(norm(fam));
  };
  add(node);
  node.querySelectorAll("*").forEach(add);
  return set;
}

// 문서의 외부 스타일시트(구글 폰트 등) CSS 텍스트 — 한 번만 받는다
async function externalCssTexts() {
  const hrefs = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => l.href)
    .filter((h) => /^https?:/.test(h));
  return Promise.all(
    hrefs.map(async (h) => {
      if (!cssTextCache.has(h)) {
        cssTextCache.set(h, fetch(h).then((r) => (r.ok ? r.text() : "")).catch(() => ""));
      }
      return cssTextCache.get(h);
    })
  );
}

// 같은 출처 시트의 @font-face 도 포함
function inlineFontFaceRules() {
  const out = [];
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; } // cross-origin 은 위에서 텍스트로 처리
    for (const r of rules) if (r.type === CSSRule.FONT_FACE_RULE) out.push(r.cssText);
  }
  return out;
}

function parseFontFaces(cssText) {
  const blocks = cssText.match(/@font-face\s*\{[^}]*\}/g) || [];
  return blocks.map((block) => ({
    block,
    family: norm((block.match(/font-family\s*:\s*([^;]+)/) || [])[1]),
    range: normRange((block.match(/unicode-range\s*:\s*([^;]+)/) || [])[1]),
    urls: Array.from(block.matchAll(/url\((["']?)([^)"']+)\1\)/g)).map((m) => m[2]),
  }));
}

async function toDataUrl(url) {
  if (!fileCache.has(url)) {
    fileCache.set(
      url,
      fetch(url)
        .then((r) => r.blob())
        .then((blob) => new Promise((ok, no) => {
          const fr = new FileReader();
          fr.onload = () => ok(fr.result);
          fr.onerror = no;
          fr.readAsDataURL(blob);
        }))
        .catch(() => null)
    );
  }
  return fileCache.get(url);
}

/** 노드에 필요한 @font-face 만 data URL 로 인라인한 CSS */
export async function fontEmbedCSSFor(node) {
  const families = usedFamilies(node);
  const key = Array.from(families).sort().join("|");
  if (resultCache.has(key)) return resultCache.get(key);

  const job = (async () => {
    const texts = await externalCssTexts();
    const faces = [...texts.flatMap(parseFontFaces), ...parseFontFaces(inlineFontFaceRules().join("\n"))]
      .filter((f) => families.has(f.family));

    // 브라우저가 실제로 로드한 (family, unicode-range) 만 남긴다 — 한글 폰트는 서브셋이 100개 넘는다
    const loaded = new Set();
    try {
      for (const ff of document.fonts) {
        if (ff.status === "loaded") loaded.add(`${norm(ff.family)}|${normRange(ff.unicodeRange)}`);
      }
    } catch { /* document.fonts 미지원이면 전부 포함 */ }
    const picked = loaded.size
      ? faces.filter((f) => loaded.has(`${f.family}|${f.range}`) || !f.range)
      : faces;
    // 로드 정보가 하나도 안 잡힌 패밀리는 전부 포함 (폰트가 빠지는 것보단 낫다)
    const covered = new Set(picked.map((f) => f.family));
    const final = [...picked, ...faces.filter((f) => !covered.has(f.family))];

    const css = await Promise.all(
      final.map(async (f) => {
        let block = f.block;
        for (const u of f.urls) {
          const abs = new URL(u, location.href).href;
          const data = await toDataUrl(abs);
          if (data) block = block.split(u).join(data);
        }
        return block;
      })
    );
    return css.join("\n");
  })();
  resultCache.set(key, job);
  return job;
}
