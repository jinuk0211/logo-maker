import { formById, moodById, PRESET_COLORS } from "../src/lib/logoConfig.js";
import { designRuleFor } from "../src/lib/moodDesignRules.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* 형태 × 무드 조합별 참고 이미지 스타일
   조합이 맞으면 텍스트 지시 + 참고 이미지(base64)를 함께 모델에 보낸다.
   참고 이미지는 글자 형태(조형)만 따라가고, 색은 절대 가져오지 않는다 — 색은 colorRule 이 결정. */
const STYLE_REFS = {
  "wordmark:dynamic": {
    file: "public/refer/hand_refer.png",
    style:
      "Match the visual language of the reference image: extremely thick rounded organic letterforms, soft melted curves, oversized chunky proportions, and a playful hand-drawn blob typography aesthetic.",
  },
};

// 브리프에 해당하는 참고 스타일 (없으면 null). image 는 base64 PNG.
export function styleRefFor(brief) {
  const ref = STYLE_REFS[`${brief.form}:${brief.mood}`];
  if (!ref) return null;
  let image = null;
  try {
    image = fs.readFileSync(path.resolve(__dirname, "..", ref.file)).toString("base64");
  } catch {
    image = null; // 파일이 없어도 텍스트 지시만으로 진행
  }
  return { style: ref.style, image, mimeType: "image/png" };
}

// 설명 텍스트 정리 — HTML 태그(<br> 등) 제거, 공백 정규화
export function cleanRationale(text) {
  return (text || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* 배색 지시 — 셋 중 하나만 내려간다.
   1) 사용자가 색을 골랐으면 그 색만 (무드 팔레트는 빼서 충돌을 막는다)
   2) 안 골랐고 무드에 권장 팔레트가 있으면 그걸로
   3) 둘 다 없으면 업종·분위기에 맞게 모델이 직접 정하도록 */
function colorRule(brief, rule) {
  if (brief.color) {
    const preset = PRESET_COLORS.find((c) => c.color && c.color === brief.color);
    const label = preset ? `${preset.label} 계열(${brief.color})` : brief.color;
    return `주조색은 ${label}. 이 색을 중심으로 2가지 이내의 플랫한 배색.`;
  }
  if (rule?.palette) return `배색: ${rule.palette}. 2가지 이내로 절제해서 사용.`;
  return "업종과 분위기에 어울리는 색을 직접 정해 2가지 이내로 사용. 흔한 기본 파랑에 기대지 말 것.";
}

/* 공통 브랜드 마크 품질 규칙 (MOOD_DESIGN_RULES 가이드 6절)
   ROLE / CRAFT 는 모든 형태에, LOCKUP 은 글자가 들어가는 형태에만 붙인다.
   심볼형·조합형 프롬프트에는 "글자·텍스트 없이" 가 들어가는데, 같은 프롬프트에
   자간·워드마크 지시가 섞이면 모델이 글자를 그려 넣기 때문이다. */
const ROLE = "당신은 10년 이상의 경력을 가진 시니어 브랜드 아이덴티티 디자이너입니다.";

const CRAFT = `
단순히 소재를 그림으로 묘사하지 말고, 브랜드의 핵심 개념과 소재를 하나의 기억하기 쉬운 조형 언어로 추상화하세요.
심볼의 비율, 선의 두께, 곡률, 네거티브 스페이스를 정교하게 조정하세요.
로고는 웹사이트·앱 아이콘·패키지·인쇄물·간판·소셜 프로필에서 쓸 수 있어야 하며, 작은 크기에서도 실루엣이 명확해야 합니다.
스티커, 클립아트, 이모지, 캐릭터, 일반적인 스톡 아이콘, 픽토그램, 일러스트처럼 보이지 않게 하세요.
불필요한 장식, 과도한 디테일, 과도한 3D, 과도한 그림자·글로우·광택 효과는 사용하지 마세요.
브랜드 로고로서의 독창성과 단순성을 동시에 유지하세요.
`.trim();

// 글자가 들어가는 형태(워드마크)에만 — 심볼형·조합형에 붙으면 글자를 그려 넣는다
const LOCKUP =
  "심볼과 워드마크 사이의 거리, 글자의 자간과 시각적 무게를 정교하게 조정하세요.";

// 6단계 브리프 값(형태 × 분위기 조합)을 모아 이미지 묘사 프롬프트로 조립
// 순서는 가이드 9절: 역할 → 브랜드 → 형태 → 소재 → 조형 언어 → 품질 → 타이포 → 컬러 → 레이아웃
export function buildImagePrompt(brief, variant) {
  const form = formById(brief.form);
  const mood = moodById(brief.mood);
  const rule = designRuleFor(brief.mood); // 무드별 조형 규칙 (없는 무드는 null)
  // 로고에 새겨지는 이름은 영문. 이미지 모델이 한글 글자를 정확히 그리지 못해
  // 로마자로 바꿔버리거나 뭉개기 때문에, 위저드에서 받은 영문 이름을 쓴다.
  const name = brief.nameEn?.trim() || brief.name?.trim() || "Brand";
  const business = brief.business?.trim();
  const iconWant = brief.iconWant?.trim();
  const biz = business ? `${business} 브랜드 ` : "";
  const styleRef = styleRefFor(brief);

  // 형태별 주제
  let subject;
  if (form.id === "wordmark") {
    subject = `${biz}'${name}'의 글자 자체를 디자인한 워드마크 로고. 타이포그래피 중심.`;
    // 워드마크라고 소재를 버리지 않는다 — 글자 옆에 아이콘을 세우는 게 아니라 글자 안으로 녹인다.
    if (iconWant) {
      subject += ` '${iconWant}'의 형태를 반드시 글자 안에 통합할 것: 한 글자의 획이나 속공간(카운터)을 그 형태로 치환하거나, 글자를 잇는 선·음영으로 드러나게. 글자 옆에 별도 아이콘을 세워두는 구성은 금지. '${iconWant}'가 보이지 않는 결과는 실패.`;
    }
  } else if (form.id === "combo") {
    subject = iconWant
      ? `${biz}'${name}'의 조합형 로고. 심볼은 반드시 '${iconWant}'를 소재로 하고, 브랜드명 '${name}'과 하나의 락업으로 함께 배치할 것.`
      : `${biz}'${name}'의 조합형 로고. 심볼과 브랜드명 '${name}'을 하나의 락업으로 함께 배치할 것.`;
  } else {
    subject = iconWant
      ? `${biz}'${name}'의 로고 심볼 아이콘. 소재는 반드시 '${iconWant}'.`
      : `${biz}'${name}'의 로고 심볼 아이콘.`; // symbol
  }

  // 텍스트 처리 (형태에 따라)
  const textRule = form.text
    ? `브랜드명 '${name}' 글자는 정확한 철자로 또렷하게 표현.`
    : "심볼만 — 글자·텍스트 없이.";

  const parts = [
    ROLE,
    subject,
    // 워드마크는 위 subject 안에서 소재를 글자에 통합하도록 이미 지시했으므로 여기선 중복 방지
    // 소재는 필수 — 추상화하다가 소재를 빼먹거나 다른 것으로 바꾸는 일이 잦아서 못 박는다
    iconWant && form.id !== "wordmark"
      ? `핵심 소재 '${iconWant}'는 필수. 사실적으로 묘사하지 말고 조형적으로 단순화하되, 결과물을 보면 한눈에 '${iconWant}'로 읽혀야 함. 소재를 생략하거나 다른 소재로 대체하지 말 것.`
      : "",
    `브랜드 분위기: ${mood.hint}.`,
    rule ? `조형 언어: ${rule.form}.` : "",
    CRAFT,
    // 타이포그래피 지시는 글자가 들어가는 형태에만
    form.text ? LOCKUP : "",
    // 참고 스타일이 있으면 무드 기본 타이포(산세리프 등)와 충돌하므로 참고 스타일이 우선
    form.text && rule && !styleRef ? `타이포그래피: ${rule.type}.` : "",
    // 참고 이미지 스타일 (형태 × 무드 조합이 맞을 때만). 색은 참고 이미지에서 가져오지 않는다.
    styleRef ? `${styleRef.style} 참고 이미지는 글자의 형태·두께·곡률만 참고할 것. 참고 이미지의 배경색과 글자색은 절대 따라 하지 말고, 아래 배색 지시와 흰 배경을 따를 것. 참고 이미지의 단어를 그대로 쓰지 말고 브랜드명 '${name}'으로 그릴 것.` : "",
  ];

  parts.push(`${colorRule(brief, rule)} 과도한 그라데이션·입체감은 사용하지 말 것.`);
  parts.push(`순백색 배경, 중앙 정렬, 넉넉한 여백. ${textRule}`);
  if (form.text) {
    parts.push(`글자는 라틴 알파벳으로만 표기하고 '${name}' 철자를 정확히 지킬 것. 한글·한자·가나는 사용하지 말 것.`);
  }
  if (variant) parts.push("앞선 것과 다른 컨셉으로.");
  return parts.filter(Boolean).join(" ");
}

// 디자인 설명(이유) 프롬프트
export function buildRationalePrompt(brief) {
  const form = formById(brief.form);
  const mood = moodById(brief.mood);
  const preset = PRESET_COLORS.find((c) => c.color && c.color === brief.color);
  const bits = [
    brief.business?.trim() && `사업: ${brief.business.trim()}`,
    brief.iconWant?.trim() && `핵심 소재: ${brief.iconWant.trim()}`,
    preset && `컬러: ${preset.label}`,
    `형태: ${form.label}`,
    `분위기: ${mood.label}`,
  ]
    .filter(Boolean)
    .join(", ");
  if (brief.lang === "en") {
    return `In one or two friendly sentences, explain why this brand logo concept was chosen. Plain text only — no preamble, markdown or HTML. Write in English. (${bits})`;
  }
  return `아래 브랜드 로고의 디자인 컨셉을 왜 이렇게 잡았는지 한두 문장으로 친근하게 설명해줘. 서론·마크다운·HTML 태그 없이 설명 문장만 순수 텍스트로. (${bits})`;
}

// 편집(image-to-image) 프롬프트
export function buildEditPrompt(instruction) {
  return `${ROLE} 이 로고 이미지를 다음 요청대로 수정해주세요: "${instruction}". 전체 컨셉은 유지하되 요청한 부분만 반영. 결과는 컬러로, 순백색 배경.`;
}
