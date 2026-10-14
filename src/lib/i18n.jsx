/* 언어 설정 + DOM 번역 레이어.
   · 기본 언어: 브라우저(navigator.language) 가 ko 면 한국어, 아니면 영어. 헤더 토글로 바꾸면 localStorage 에 기억.
   · 컴포넌트를 하나하나 고치지 않고, 렌더된 DOM 의 한글 텍스트/placeholder/title 을 사전(i18n.en.js)으로 바꾼다.
     React 가 텍스트를 다시 쓰면 MutationObserver 가 다시 번역한다. ko 로 돌아가면 원문을 복원. */
import { createContext, useContext, useEffect, useState } from "react";
import { tr } from "./i18n.tr.js";
export { tr };

const KEY = "bf_lang";
const detect = () => {
  // ?lang=en 로 강제 (공유 링크·테스트용) → 저장 값 → 브라우저 언어
  try { const q = new URLSearchParams(window.location.search).get("lang"); if (q === "ko" || q === "en") return q; } catch {}
  try { const v = localStorage.getItem(KEY); if (v === "ko" || v === "en") return v; } catch {}
  const nav = (navigator.language || "ko").toLowerCase();
  return nav.startsWith("ko") ? "ko" : "en";
};

const LangCtx = createContext({ lang: "ko", setLang: () => {} });
export const useLang = () => useContext(LangCtx);

const ATTRS = ["placeholder", "title", "aria-label", "alt"];
const orig = new WeakMap(); // 노드/속성 → 원문 (ko 복원용)

function translateNode(node, toEn) {
  if (node.nodeType === Node.TEXT_NODE) {
    const cur = node.nodeValue;
    if (toEn) {
      if (!/[가-힣]/.test(cur)) return;
      const out = tr(cur);
      if (out !== cur) { if (!orig.has(node)) orig.set(node, cur); node.nodeValue = out; }
    } else if (orig.has(node)) { node.nodeValue = orig.get(node); orig.delete(node); }
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.closest?.("[data-no-i18n]")) return;
  for (const a of ATTRS) {
    const cur = node.getAttribute(a);
    if (cur == null) continue;
    const k = `${a}`; const store = orig.get(node) || {};
    if (toEn) {
      if (!/[가-힣]/.test(cur)) continue;
      const out = tr(cur);
      if (out !== cur) { if (!(k in store)) { store[k] = cur; orig.set(node, store); } node.setAttribute(a, out); }
    } else if (k in store) { node.setAttribute(a, store[k]); delete store[k]; }
  }
}

function translateTree(root, toEn) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  let n = walker.currentNode;
  while (n) { translateNode(n, toEn); n = walker.nextNode(); }
}

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(detect);
  const setLang = (l) => { try { localStorage.setItem(KEY, l); } catch {} setLangState(l); };

  useEffect(() => {
    document.documentElement.lang = lang;
    const root = document.body;
    const toEn = lang === "en";
    translateTree(root, toEn);
    if (!toEn) return;
    // React 가 텍스트를 갱신하면(한글로) 다시 번역
    let busy = false;
    const mo = new MutationObserver((muts) => {
      if (busy) return;
      busy = true;
      try {
        for (const m of muts) {
          if (m.type === "characterData") translateNode(m.target, true);
          else if (m.type === "attributes") translateNode(m.target, true);
          else m.addedNodes.forEach((n) => (n.nodeType === Node.TEXT_NODE ? translateNode(n, true) : translateTree(n, true)));
        }
      } finally { busy = false; }
    });
    mo.observe(root, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    return () => mo.disconnect();
  }, [lang]);

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
