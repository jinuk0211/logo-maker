import { formById, moodById, DEFAULT_PALETTE } from "./logoConfig.js";
import { applyBrandColor } from "./color.js";

// AI 생성이 실패했을 때 쓰는 목업 폴백 전용 — 조합형만 웹폰트 글자를 얹는다
export const formIncludesWebText = (formId) => formId === "combo";

// 목업 폴백용 심볼 선택 — 입력 텍스트(원하는 아이콘/사업/이름)에서 키워드 매칭
const SYMBOL_KEYWORDS = [
  // 구체적인 소재를 먼저 — 넓은 범주(건물·자연)는 뒤에
  [["헬스", "피트니스", "운동", "체육관", "요가", "필라테스", "gym", "fitness", "workout", "training", "crossfit", "yoga", "pilates", "sport"], "dumbbell"],
  [["치과", "dental", "dentist", "tooth"], "tooth"],
  [["커피", "카페", "coffee", "cafe", "café", "espresso", "latte", "tea", "차"], "coffee"],
  [["음식", "식당", "레스토랑", "요리", "맛집", "food", "restaurant", "kitchen", "dining", "chef", "bistro", "grill"], "fork"],
  [["케이크", "빵", "베이커리", "디저트", "cake", "bakery", "bread", "dessert", "pastry", "sweet"], "cake"],
  [["책", "독서", "서점", "논술", "출판", "도서", "book", "library", "reading", "publish", "study"], "book"],
  [["학교", "학원", "교육", "강의", "튜터", "school", "academy", "education", "learn", "tutor", "course", "class"], "graduation"],
  [["사진", "카메라", "포토", "photo", "camera", "photograph", "film", "video"], "camera"],
  [["음악", "뮤직", "밴드", "레코드", "music", "band", "record", "sound", "audio", "piano", "guitar"], "music"],
  [["병원", "의원", "클리닉", "약국", "헬스케어", "간호", "hospital", "clinic", "medical", "pharmacy", "health", "doctor", "nurse"], "medical"],
  [["사랑", "웨딩", "결혼", "커플", "데이팅", "love", "wedding", "couple", "dating", "heart", "romance"], "heart"],
  [["자동차", "차량", "정비", "카센터", "택시", "car", "auto", "motor", "garage", "taxi", "drive", "vehicle"], "car"],
  [["자전거", "사이클", "바이크", "bike", "bicycle", "cycling", "cycle"], "bike"],
  [["꽃", "플라워", "화원", "정원", "flower", "floral", "florist", "bloom", "garden"], "flower"],
  [["태양", "햇살", "아침", "선샤인", "sun", "sunny", "solar", "morning", "sunrise", "sunshine"], "sun"],
  [["산", "등산", "캠핑", "아웃도어", "mountain", "hiking", "camp", "outdoor", "peak", "summit", "trek"], "mountain"],
  [["바다", "파도", "해변", "수영", "서핑", "sea", "ocean", "wave", "beach", "surf", "swim", "marine"], "wave"],
  [["미용", "헤어", "살롱", "이발", "네일", "hair", "salon", "barber", "nail", "beauty", "spa", "cosmetic"], "scissors"],
  [["반려", "강아지", "고양이", "펫", "동물", "pet", "dog", "cat", "puppy", "animal", "vet", "paw"], "paw"],
  [["기계", "공장", "제조", "설비", "엔지니어", "machine", "factory", "manufactur", "engineer", "industrial", "gear"], "gear"],
  [["소프트웨어", "개발", "코딩", "앱", "it", "테크", "software", "developer", "coding", "code", "app", "tech", "saas", "digital", "web"], "code"],
  [["스타트업", "런칭", "로켓", "성장", "startup", "launch", "rocket", "growth", "venture"], "rocket"],
  [["쇼핑", "마켓", "스토어", "상점", "리테일", "shop", "store", "market", "retail", "commerce", "mall", "cart"], "cart"],
  [["선물", "기프트", "이벤트", "gift", "present", "party", "celebrat"], "gift"],
  [["보석", "주얼리", "다이아", "명품", "프리미엄", "jewel", "jewelry", "diamond", "luxury", "premium", "gem"], "diamond"],
  [["글로벌", "세계", "국제", "무역", "global", "world", "international", "trade", "export", "import"], "globe"],
  [["항공", "비행", "여행사", "투어", "flight", "airline", "travel", "tour", "trip", "plane", "journey"], "plane"],
  [["채팅", "메신저", "상담", "커뮤니케이션", "chat", "message", "talk", "consult", "support", "communication"], "chat"],
  [["전기", "에너지", "배터리", "충전", "파워", "electric", "energy", "battery", "power", "charge", "bolt"], "bolt"],
  [["별", "스타", "최고", "베스트", "star", "best", "top", "favorite"], "star"],
  [["열쇠", "키", "잠금", "보안", "key", "lock", "access", "security"], "key"],
  [["패션", "의류", "옷", "브랜드샵", "fashion", "clothing", "apparel", "wear", "boutique", "outfit"], "hanger"],
  [["신뢰", "방패", "보험", "법률", "변호사", "shield", "secure", "trust", "insurance", "law", "legal"], "shield"],
  [["물", "청소", "세탁", "케어", "음료", "water", "clean", "laundry", "care", "drink", "drop"], "drop"],
  [["가족", "사람", "팀", "커뮤니티", "인재", "family", "people", "team", "community", "hr", "recruit"], "family"],
  [["위치", "지역", "장소", "지도", "map", "location", "local", "place", "pin"], "pin"],
  [["잎", "친환경", "에코", "그린", "유기농", "leaf", "eco", "green", "organic", "vegan", "natural"], "leaf"],
  [["나무", "숲", "자연", "식물", "tree", "forest", "nature", "plant", "wood"], "tree"],
  [["집", "홈", "주택", "인테리어", "home", "house", "interior", "living", "residence"], "home"],
  [["건물", "아파트", "부동산", "빌딩", "건축", "사무실", "building", "apartment", "estate", "realty", "architect", "office", "property"], "building"],
];

export function pickSymbol(brief) {
  const hay = `${brief.iconWant || ""} ${brief.business || ""} ${brief.name || ""}`.toLowerCase();
  for (const [words, key] of SYMBOL_KEYWORDS) {
    if (words.some((w) => hay.includes(w.toLowerCase()))) return key;
  }
  return "spark";
}

// 시드 기반 결정적 난수 (mulberry32) — 같은 시드면 같은 결과
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _seq = 1;
export const nextSeed = () => (_seq = (_seq * 1103515245 + 12345) & 0x7fffffff);

// brief: { name, business, iconWant, form, mood, color }
// 로고 스펙 하나를 생성한다. seed 를 바꾸면 다른 후보가 나온다.
export function makeLogo(brief, seed) {
  const rand = rng(seed);
  const form = formById(brief.form);
  const mood = moodById(brief.mood);
  const includeText = formIncludesWebText(form.id); // 조합형만 웹폰트 텍스트 얹음

  return {
    id: `${seed}`,
    seed,
    name: brief.nameEn?.trim() || brief.name || "브랜드", // 로고 락업은 이미지와 같은 영문 이름
    business: brief.business || "",
    iconWant: brief.iconWant || "",
    form: form.id,
    mood: mood.id,
    includeText,
    symbolKey: pickSymbol(brief),
    variant: "solid",
    colors: applyBrandColor({ ...DEFAULT_PALETTE }, brief.color),
    brandColor: brief.color || null,
    styleLabel: `${form.label} · ${mood.label}`,
    layout: includeText ? "stacked" : "icon",
    ratio: 55,
    letterSpacing: rand() > 0.5 ? -1 : 0.5,
    weight: rand() > 0.4 ? 700 : 800,
  };
}

// 후보 n장 생성
export function makeCandidates(brief, n = 2) {
  return Array.from({ length: n }, () => makeLogo(brief, nextSeed()));
}
