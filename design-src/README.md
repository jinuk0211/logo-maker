# design-src

배포에 포함되지 않는 원본·문서 보관소.

`public/` 은 빌드 시 `dist/` 로 통째로 복사돼 웹에 공개되므로,
앱이 참조하지 않는 파일은 여기에 둔다.

- `logo-originals/` — 랜딩 샘플 로고 원본 PNG (각 750~880KB).
  실제 사용본은 720px JPEG 로 줄여 `public/Logo/*.jpg` 에 있다.
- `BF_로고.png` — 브랜드 로고 풀 락업 원본. 헤더용으로 심볼만 잘라낸 것이
  `public/bf-mark.png`.
- `MOOD_DESIGN_RULES_*.md` — 무드별 조형 규칙 가이드.
  구현본은 `src/lib/moodDesignRules.js`.
