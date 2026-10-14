import bulls from "../assets/character/bulls.png";
import supercar from "../assets/character/supercar logo.png";
import greenfactory from "../assets/character/greenfactory.png";

/* 예시 로고 레지스트리.
   고르면 위저드 왼쪽 미리보기에 브랜드명과 함께 얹혀서 "이런 느낌"을 바로 보여준다.
   형태(FORM)와 분위기(MOOD) 두 축 모두 지원 — 해당 스텝에서 자동으로 노출된다. */

export const FORM_SAMPLES = {
  wordmark: [{ id: "greenfactory", label: "그린팩토리", src: greenfactory }],
};

export const MOOD_SAMPLES = {
  character: [{ id: "bulls", label: "불스", src: bulls }],
  luxury: [{ id: "supercar", label: "슈퍼카", src: supercar }],
};

export const samplesForForm = (formId) => FORM_SAMPLES[formId] || [];
export const samplesForMood = (moodId) => MOOD_SAMPLES[moodId] || [];
