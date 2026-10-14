import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { formById, moodById } from "../src/lib/logoConfig.js";
import { designRuleFor } from "../src/lib/moodDesignRules.js";
import { ALL_FONTS } from "../src/lib/fonts.js";

/* 브랜드북 콘텐츠 생성 — Claude 가 구조화 JSON 을 만들고 렌더링은 프론트가 한다.

   이미지로 뽑지 않는 이유:
   1) 한글 브랜드명을 이미지 모델이 정확히 못 그린다
   2) PPT(.pptx) 로 내보내려면 어차피 구조화 데이터가 필요하다
   3) 레이아웃이 코드에 있어야 브랜드마다 품질이 일정하다 */

const MODEL = process.env.BRANDBOOK_MODEL || "claude-opus-5";

const Palette = z.object({
  role: z.string().describe("Primary / Secondary / Ink / Neutral 중 하나"),
  name: z.string().describe("컬러 이름 — 브랜드 맥락에 맞는 고유한 이름 (예: 딥 포레스트)"),
  hex: z.string().describe("#RRGGBB 6자리 대문자"),
  usage: z.string().describe("이 색을 어디에 쓰는지 한 문장"),
});

const TypeRole = z.object({
  role: z.string().describe("Display / Heading / Body / Caption"),
  size: z.string().describe("예: 48px / 3rem"),
  weight: z.string(),
  lineHeight: z.string(),
  letterSpacing: z.string(),
});

const BrandbookSchema = z.object({
  tagline: z.string().describe("브랜드 한 줄 정의. 마케팅 과장 없이 20자 내외"),
  essence: z.string().describe("브랜드 본질 한 문장"),
  mission: z.string().describe("브랜드가 지금 하는 일. 2문장 이내"),
  vision: z.string().describe("브랜드가 향하는 지점. 1문장"),
  values: z.array(z.object({
    name: z.string().describe("핵심 가치 이름 2~5자"),
    desc: z.string().describe("그 가치가 실무에서 뜻하는 바 한 문장"),
  })).describe("핵심 가치 3개"),
  personality: z.array(z.string()).describe("브랜드 성격 형용사 3~4개"),
  keywords: z.array(z.string()).describe("브랜드 키워드 4~6개"),
  tone: z.string().describe("톤 앤 보이스 한 문장"),
  palette: z.array(Palette).describe("로고에서 추출한 색을 우선. 3~5개"),
  typography: z.object({
    primary: z.enum(ALL_FONTS.map((f) => f.family)).describe(
      "본문·제목용 서체. 반드시 주어진 목록에서만 고를 것 — 목록 밖 폰트는 렌더링되지 않는다"
    ),
    primaryReason: z.string().describe("왜 이 폰트인지 한 문장"),
    secondary: z.string().describe("보조 서체 (영문/숫자용)"),
    hierarchy: z.array(TypeRole).describe("Display/Heading/Body/Caption 4단계"),
  }),
  visualLanguage: z.object({
    shape: z.string().describe("로고에서 파생한 형태 언어 — 곡선/직선, 대칭/비대칭 등"),
    line: z.string().describe("선 두께·모서리·곡률 규칙"),
    motif: z.string().describe("로고 형태에서 파생 가능한 보조 그래픽 모티프"),
  }),
  iconStyle: z.string().describe("아이콘 스타일 규칙 — 선 두께·모서리·그리드"),
  layout: z.string().describe("그리드·여백·정렬 등 레이아웃 규칙 한두 문장"),
  photography: z.string().describe("사진 연출 방향 — 조명·구도·색·배경"),
  dos: z.array(z.string()).describe("로고 올바른 사용 3~4개"),
  donts: z.array(z.string()).describe("로고 금지 사항 4~5개"),
  rulesWhy: z.string().describe("이 로고에서 여백·비율·대비 규칙이 왜 필요한지, 이 로고의 형태 특성을 근거로 2문장"),
  logoMeaning: z.array(z.object({
    part: z.string().describe("로고의 특정 부분 이름 2~8자 (예: 잎의 곡선, 열린 하단)"),
    meaning: z.string().describe("그 부분이 무엇을 뜻하는지 한 문장. 억지로 의미를 붙이지 말 것"),
  })).describe("로고를 뜯어서 설명하는 항목 4개"),
  minSize: z.string().describe("Clear Space·최소 크기를 로고 기준 상대 단위(X)로"),
  voice: z.object({
    tone: z.string(),
    writingStyle: z.string().describe("문장 길이·어휘·말투"),
    examples: z.array(z.string()).describe("브랜드 말투 예시 문구 3개"),
  }),
});

const SYSTEM = `당신은 10년 이상 경력의 브랜드 아이덴티티 디자이너입니다.
클라이언트에게 전달할 Brand Identity Guidelines 의 내용을 작성합니다.

원칙:
- 이미 확정된 로고를 분석해서 거기서 파생되는 디자인 시스템을 만듭니다. 로고를 새로 제안하지 않습니다.
- 로고에 실제로 쓰인 컬러를 우선 사용합니다. 어울리지 않는 새 컬러를 임의로 추가하지 않습니다.
- "세련되고 현대적인 브랜드입니다" 같은 추상적 수식어를 쓰지 않습니다.
  형태·비율·선·여백처럼 실제로 적용 가능한 규칙으로 씁니다.
- 마케팅 카피가 아니라 디자이너의 설계 문서 톤으로 간결하게 씁니다.
- 규칙은 "무엇을" 뿐 아니라 "왜"까지 씁니다. 근거는 이 로고의 형태 특성에서 찾습니다.
- 협업자가 5분 안에 핵심을 파악할 수 있도록, 한 항목은 한 가지만 말합니다.
- 모든 문장은 한국어로 씁니다. 단, 폰트 이름과 HEX 값은 원문 그대로 둡니다.
- 서체는 이 서비스가 실제로 불러오는 목록 안에서만 고릅니다. 목록에 없는 이름을 쓰면
  화면에 그 폰트로 그려지지 않아 가이드와 실물이 어긋납니다.`;

// 사용자가 준 참고 자료(사업계획서 등)·요청사항 — 구도는 그대로, 문구·무드·가치에 반영
function extraBlock(extra) {
  const notes = String(extra?.notes || "").trim().slice(0, 4000);
  const materials = String(extra?.materials || "").trim().slice(0, 20000);
  if (!notes && !materials) return "";
  let out = "\n\n─────\n";
  if (materials) {
    out += `아래는 사용자가 준 참고 자료(사업계획서·소개글 등)다. 브랜드북의 미션·비전·가치·톤·키워드·설명 문구에
이 자료의 실제 내용(서비스, 고객, 강점, 지역, 철학)을 구체적으로 반영해라. 자료에 없는 사실은 지어내지 마라.

[참고 자료]
${materials}\n`;
  }
  if (notes) {
    out += `\n[사용자 요청사항 — 최우선으로 반영]\n${notes}\n`;
  }
  return out;
}

export async function generateBrandbook(brief, logo, apiKey, extra = {}) {
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY 미설정 — .env 에 추가 필요");

  const form = formById(logo.form || brief.form);
  const mood = moodById(logo.mood || brief.mood);
  const rule = designRuleFor(mood.id);
  const colors = [logo.colors?.symbol, logo.colors?.accent, logo.colors?.text]
    .filter(Boolean)
    .join(", ");

  const client = new Anthropic({ apiKey });
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: brief.lang === "en"
      ? SYSTEM + "\n\nIMPORTANT: The user's interface language is English. Write every field (names, taglines, mission, values, tone, keywords, rules, explanations) in natural English. Keep the brand name as given."
      : SYSTEM,
    messages: [
      {
        role: "user",
        content: `아래 확정된 로고를 기준으로 브랜드북 내용을 작성해줘.

브랜드명(한글): ${brief.name || logo.name}
브랜드명(영문): ${brief.nameEn || "-"}
사업/업종: ${brief.business || "-"}
로고에 담은 핵심 소재: ${brief.iconWant || "-"}
로고 형태: ${form.label} (${form.hint})
브랜드 무드: ${mood.label}
무드의 조형 언어: ${rule?.form || "-"}
로고에 실제로 쓰인 컬러: ${colors || "-"}
로고 디자인 의도: ${logo.rationale || "-"}

컬러 팔레트는 위 "로고에 실제로 쓰인 컬러" 를 Primary/Secondary 로 먼저 배치하고,
필요한 중립색만 보충해줘.

사용 가능한 서체(이 안에서만 고를 것):
${ALL_FONTS.map((f) => `- ${f.family} (${f.label})`).join("\n")}${extraBlock(extra)}`,
      },
    ],
    output_config: { format: zodOutputFormat(BrandbookSchema) },
  });

  if (!res.parsed_output) throw new Error("브랜드북 생성 결과를 해석하지 못했습니다");
  return res.parsed_output;
}
