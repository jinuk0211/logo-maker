# Brand Factory

이름과 원하는 느낌만 고르면 AI 가 로고를 만들고, 그 로고로 명함과 브랜드북까지 이어서 만드는 웹앱.

- **로고** — 형태(심볼 · 조합형 · 워드마크) × 분위기 8종을 골라 후보 2장을 받고, 말로 수정 요청
- **명함** — 고른 로고로 앞·뒷면 템플릿을 조합해 PNG 로 저장
- **브랜드북** — 로고를 분석해 컬러 · 타이포 · 사용 규정을 채운 슬라이드를 PDF / PPTX 로 내보내기
- 한국어 / 영어 UI, 계정별 로고 보관(60일)

## 실행

Node 20.19 이상이 필요합니다.

```bash
npm install
cp .env.example .env    # 키 입력
npm run dev             # http://localhost:5173
npm run build           # dist/ 로 프로덕션 빌드
npm run lint
```

### 환경변수

| 이름 | 용도 |
| --- | --- |
| `LOGO_PROVIDER` | 로고 이미지 모델. `gemini` · `openai` · `mix`(후보마다 번갈아) |
| `GEMINI_API_KEY` | Gemini 이미지 생성 |
| `OPENAI_API_KEY` | OpenAI 이미지 생성 |
| `ANTHROPIC_API_KEY` | 브랜드북 내용 생성. 없으면 템플릿 문구로 채워진다 |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | 로그인과 로고 저장 |

이미지 키는 둘 중 하나만 있어도 됩니다. 한쪽이 실패하면 키가 있는 다른 쪽으로 한 번 더 시도합니다.
모델과 품질을 바꾸는 선택 변수는 [.env.example](.env.example) 에 있습니다.

### Supabase

1. 프로젝트를 만들고 URL 과 anon key 를 `.env` 에 넣는다.
2. SQL Editor 에서 [supabase/saved_logos.sql](supabase/saved_logos.sql) 을 실행한다.
   `saved_logos` 테이블과 비공개 Storage 버킷 `logos` 가 만들어지고, 둘 다 본인 행만 접근하도록 RLS 가 걸린다.
3. (선택) 가입 확인 메일 템플릿은 [supabase/email_confirm_signup.html](supabase/email_confirm_signup.html).

4. 이용 횟수 제한을 쓰려면 [supabase/usage_quota.sql](supabase/usage_quota.sql) 도 실행한다.

되돌릴 때는 [supabase/saved_logos_undo.sql](supabase/saved_logos_undo.sql).

### 이용 횟수 제한

배포 환경에서는 계정마다 로고 생성 · AI 수정 · 브랜드북 생성을 각각 1회로 제한합니다.
횟수는 `FREE_LOGO_GENERATIONS`, `FREE_LOGO_EDITS`, `FREE_BRANDBOOKS` 로 바꾸고,
`QUOTA_EXEMPT_EMAILS` 에 적은 계정은 제한을 받지 않습니다. 로컬 dev 서버에는 적용되지 않습니다.
`usage_quota.sql` 을 실행하지 않은 프로젝트에서는 제한 없이 동작합니다.

## 구조

```
브라우저 ──/api/generate──▶ Gemini / OpenAI   로고 이미지 + 한 줄 설명
        └─/api/brandbook─▶ Claude            브랜드북 내용 (구조화 JSON)
```

API 키는 서버에서만 씁니다. `/api/*` 는 개발 중에는 Vite 미들웨어([vite.config.js](vite.config.js))가,
배포에서는 Vercel 함수([api/](api/))가 처리하며, 둘 다 [server/](server/) 의 같은 코드를 호출합니다.
모든 `/api/*` 요청은 Supabase 로그인 토큰을 검증합니다.

```
api/                  Vercel 서버리스 함수 (generate, brandbook)
server/
  providers.js        이미지 provider 선택과 폴백
  nanoHandler.js      Gemini 호출
  openaiHandler.js    OpenAI 호출
  brandbookHandler.js Claude 호출 + 응답 스키마
  prompts.js          로고 생성·수정 프롬프트
  auth.js             토큰 검증
  quota.js            계정별 이용 횟수 제한
src/
  App.jsx             화면 전환 (intro → form → result → refine → card → book)
  components/         화면별 컴포넌트
  lib/
    api.js            /api 호출
    auth.js, store.js Supabase 세션, 로고 저장·불러오기
    logoConfig.js     형태 · 분위기 · 컬러 정의
    moodDesignRules.js 분위기별 조형 규칙 (프롬프트에 들어간다)
    knockout.js       흰 배경 제거
    palette.js        로고 이미지에서 브랜드 컬러 추출
    exportLogo.js     로고 PNG 내보내기
    brandbook.js      브랜드북 템플릿 초안
    brandbookPptx.js  브랜드북 PPTX 내보내기
    i18n.jsx          한/영 전환
    generate.js       생성 실패 시 쓰는 목업 로고
supabase/             테이블 · 정책 SQL, 메일 템플릿
design-src/           배포에 포함되지 않는 원본 이미지와 디자인 문서
```

### 설계 메모

- 모델은 흰 배경 위에 로고를 그려 주고, 프론트가 배경을 벗겨([knockout.js](src/lib/knockout.js)) 어떤 바탕에도 얹을 수 있게 한다.
- 이미지 모델이 한글 글자를 정확히 그리지 못해 로고에는 영문 이름을 넣는다. 한글 이름은 명함과 브랜드북에 쓴다.
- 브랜드북은 이미지로 뽑지 않고 구조화 데이터로 받아 코드가 레이아웃을 그린다. 그래야 문구를 고칠 수 있고 PPTX 로도 내보낼 수 있다.
- 개발용 딥링크: `?step=form|result|refine|card|book` 으로 데모 브리프와 함께 해당 화면을 바로 연다. `?lang=en` 은 언어 강제.

## 배포

Vercel 에 연결하고 위 환경변수를 프로젝트 설정에 넣으면 됩니다. 함수 설정은 [vercel.json](vercel.json).

## 라이선스

[MIT](LICENSE)
