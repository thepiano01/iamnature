/* eslint-disable */
// 샘플 데이터 — 여러 번 실행해도 중복되지 않도록 upsert 사용
// 실행: npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

const CONDITIONS = [
  ["DIABETES", "당뇨"],
  ["HYPERTENSION", "혈압"],
  ["HEART", "심장"],
  ["HYPERLIPID", "고지혈"],
  ["JOINT", "관절"],
  ["LIVER", "간"],
  ["KIDNEY", "신장"],
  ["STOMACH", "위·소화"],
  ["RESPIRATORY", "기관지"],
  ["IMMUNE", "면역"],
  ["FATIGUE", "피로"],
] as const;

type C = { code: string; ev: "folk" | "study" | "mixed"; sum: string; use?: string };
type P = {
  name: string; sci: string; cat: "HERB" | "ROOT" | "MUSHROOM" | "FRUIT"; family: string;
  desc: string; folk: string; cook: string; caution: string; season: [number, number]; conds: C[];
};

const PLANTS: P[] = [
  {
    name: "곰취", sci: "Ligularia fischeri", cat: "HERB", family: "국화과", season: [4, 6],
    desc: "높은 산 습한 골짜기에서 자라는 대표 산나물. 잎이 넓고 향이 진해 ‘산나물의 제왕’이라 불립니다.",
    folk: "예로부터 봄철 입맛을 돋우고 몸의 열을 내리는 나물로 즐겨 먹었습니다.",
    cook: "생잎은 쌈으로, 살짝 데쳐 된장무침이나 장아찌로 먹습니다. 데칠 때는 끓는 물에 30초 이내로 짧게.",
    caution: "비슷하게 생긴 독초 ‘동의나물’과 혼동하지 않도록 반드시 신뢰할 수 있는 채취자에게 구입하세요.",
    conds: [
      { code: "HYPERTENSION", ev: "folk", sum: "혈압 관리 식단에 전통적으로 쓰여 온 나물이에요.", use: "쌈·나물무침" },
      { code: "HYPERLIPID", ev: "study", sum: "식이섬유가 풍부해 기름진 식단의 균형을 잡는 데 좋다고 알려져 있어요." },
      { code: "LIVER", ev: "folk", sum: "봄철 간 건강을 챙기는 나물로 이야기되어 왔어요." },
    ],
  },
  {
    name: "두릅", sci: "Aralia elata", cat: "HERB", family: "두릅나무과", season: [4, 5],
    desc: "두릅나무의 새순. 봄에 잠깐만 나는 귀한 산채로, 쌉싸름하고 향긋한 맛이 특징입니다.",
    folk: "봄나물로 먹으며 피로 회복·혈당·혈압 조절에 좋다고 알려져 왔습니다.",
    cook: "밑동 껍질을 벗기고 소금물에 1분 데쳐 초고추장에 찍어 먹습니다. 전·튀김으로도 좋아요.",
    caution: "생으로는 먹지 마세요. 반드시 데쳐서 드세요.",
    conds: [
      { code: "DIABETES", ev: "mixed", sum: "사포닌 성분이 있어 혈당 관리 식단에 자주 오르는 산채예요.", use: "데쳐서 초장" },
      { code: "FATIGUE", ev: "folk", sum: "춘곤증 무렵 기력 회복용으로 즐겨 먹어 왔어요." },
      { code: "HYPERTENSION", ev: "folk", sum: "혈압 관리에 좋다고 전해지는 봄나물이에요." },
    ],
  },
  {
    name: "더덕", sci: "Codonopsis lanceolata", cat: "ROOT", family: "초롱꽃과", season: [9, 11],
    desc: "깊은 산 반그늘에서 자라는 덩굴식물의 뿌리. 자르면 흰 진액이 나오고 향이 강합니다.",
    folk: "구이나 무침으로 먹으며 기력 회복, 기관지에 좋다고 전해집니다.",
    cook: "껍질을 돌려 벗기고 방망이로 두드려 펴서 고추장 양념을 발라 굽습니다. 생으로 무쳐도 좋아요.",
    caution: "껍질을 벗길 때 나오는 진액이 손에 묻으면 끈적이니 장갑을 끼세요.",
    conds: [
      { code: "RESPIRATORY", ev: "folk", sum: "목이 칼칼할 때 즐겨 먹던 대표 뿌리 나물이에요.", use: "구이·무침" },
      { code: "FATIGUE", ev: "folk", sum: "‘산에서 나는 고기’라 불릴 만큼 기력 보충용으로 쓰여 왔어요." },
      { code: "IMMUNE", ev: "mixed", sum: "사포닌·이눌린을 함유해 면역 관리 식단에 자주 쓰여요." },
    ],
  },
  {
    name: "도라지", sci: "Platycodon grandiflorus", cat: "ROOT", family: "초롱꽃과", season: [9, 11],
    desc: "산과 들에서 자라는 다년초의 뿌리. 오래 묵은 산도라지일수록 향과 쓴맛이 진합니다.",
    folk: "기관지·기침·가래 완화에 좋다고 알려진 대표적인 약초 뿌리입니다.",
    cook: "껍질을 벗겨 소금에 바락바락 주물러 쓴맛을 빼고 생채·나물·정과로 만듭니다. 꿀에 재워 차로도 마셔요.",
    caution: "쓴맛이 강하면 물에 담가 우려낸 뒤 조리하세요.",
    conds: [
      { code: "RESPIRATORY", ev: "study", sum: "사포닌(플라티코딘)이 풍부해 목·기관지 관리에 오래 쓰여 왔어요.", use: "도라지청·차" },
      { code: "IMMUNE", ev: "folk", sum: "환절기 면역 관리 식재료로 즐겨 먹어요." },
    ],
  },
  {
    name: "산마늘", sci: "Allium microdolichum", cat: "HERB", family: "수선화과", season: [4, 5],
    desc: "울릉도와 강원 고산지에서 자라는 ‘명이나물’. 마늘 향이 나는 넓은 잎이 특징입니다.",
    folk: "산에서 나는 마늘이라 하여 기운을 돋우는 나물로 귀하게 여겨 왔습니다.",
    cook: "간장 장아찌가 가장 유명하고, 생잎 쌈이나 고기와 함께 구워도 좋아요.",
    caution: "독초 ‘은방울꽃’, ‘박새’와 잎이 비슷하니 꼭 마늘 향을 확인하세요.",
    conds: [
      { code: "HEART", ev: "mixed", sum: "알리신 성분이 있어 심혈관 건강 식단에 자주 쓰여요.", use: "장아찌·쌈" },
      { code: "HYPERLIPID", ev: "study", sum: "콜레스테롤 관리 식단에 좋다고 알려져 있어요." },
      { code: "FATIGUE", ev: "folk", sum: "기력 보충용 봄나물로 이야기되어 왔어요." },
    ],
  },
  {
    name: "참취", sci: "Aster scaber", cat: "HERB", family: "국화과", season: [4, 6],
    desc: "가장 흔하고 친숙한 취나물. 향이 은은하고 식감이 부드러워 누구나 좋아합니다.",
    folk: "봄철 밥상에 빠지지 않던 나물로, 묵나물로 말려 정월 대보름에도 먹었습니다.",
    cook: "데쳐서 들기름·국간장에 조물조물 무치거나, 말린 묵나물은 불려서 볶아 먹습니다.",
    caution: "말린 나물은 충분히 불리고 삶아 떫은맛을 빼고 드세요.",
    conds: [
      { code: "HYPERTENSION", ev: "folk", sum: "칼륨이 많아 저염 식단과 함께 혈압 관리용으로 좋다고 알려져 있어요." },
      { code: "STOMACH", ev: "folk", sum: "속이 편한 나물로 즐겨 먹어 왔어요." },
    ],
  },
  {
    name: "오가피", sci: "Eleutherococcus sessiliflorus", cat: "ROOT", family: "두릅나무과", season: [3, 5],
    desc: "오가피나무의 순과 껍질·뿌리. 순은 나물로, 줄기와 뿌리는 차로 씁니다.",
    folk: "관절과 기력에 좋은 약재로 오래전부터 차나 술로 담가 먹었습니다.",
    cook: "어린 순은 데쳐 나물로, 말린 줄기는 물에 넣고 은근히 달여 차로 마십니다.",
    caution: "고혈압약·당뇨약을 드시는 분은 장기간 달여 드시기 전 의사와 상의하세요.",
    conds: [
      { code: "JOINT", ev: "folk", sum: "무릎·허리가 시릴 때 달여 마시던 전통 약초예요.", use: "달인 차" },
      { code: "FATIGUE", ev: "mixed", sum: "아칸토사이드 등 성분이 있어 피로 관리 식재료로 쓰여요." },
      { code: "IMMUNE", ev: "folk", sum: "면역 관리용 차로 즐겨 마셔 왔어요." },
    ],
  },
  {
    name: "엄나무순", sci: "Kalopanax septemlobus", cat: "HERB", family: "두릅나무과", season: [4, 5],
    desc: "가시가 많은 엄나무(음나무)의 새순. 개두릅이라고도 하며 두릅보다 향이 진합니다.",
    folk: "줄기는 백숙에 넣고, 순은 봄나물로 먹으며 관절과 기력에 좋다고 전해집니다.",
    cook: "끓는 소금물에 살짝 데쳐 초장이나 된장에 무칩니다. 장아찌로도 좋아요.",
    caution: "쓴맛이 있으니 데친 뒤 찬물에 잠시 담가 두세요.",
    conds: [
      { code: "JOINT", ev: "folk", sum: "신경통·관절 관리에 쓰여 온 대표적인 나무 순이에요.", use: "데쳐서 무침" },
      { code: "DIABETES", ev: "folk", sum: "혈당 관리 식단에 오르는 쌉싸름한 산채예요." },
    ],
  },
  {
    name: "표고버섯", sci: "Lentinula edodes", cat: "MUSHROOM", family: "낙엽버섯과", season: [3, 5],
    desc: "참나무에서 자라는 버섯. 자연산 표고는 갓이 두껍고 향이 깊습니다.",
    folk: "면역력 증진, 콜레스테롤·혈압 관리에 도움된다고 알려진 버섯입니다.",
    cook: "그대로 구워 소금장에 찍거나, 말려서 육수를 냅니다. 햇볕에 말리면 비타민D가 늘어요.",
    caution: "드물게 생표고 섭취 후 피부염이 생길 수 있으니 충분히 익혀 드세요.",
    conds: [
      { code: "HYPERLIPID", ev: "study", sum: "에리타데닌 성분이 콜레스테롤 관리와 관련해 연구되어 왔어요." },
      { code: "IMMUNE", ev: "study", sum: "베타글루칸(렌티난)이 들어 있어 면역 관리 식재료로 알려져 있어요." },
      { code: "HYPERTENSION", ev: "folk", sum: "혈압 관리 식단에 자주 쓰이는 버섯이에요." },
    ],
  },
  {
    name: "영지버섯", sci: "Ganoderma lucidum", cat: "MUSHROOM", family: "불로초과", season: [7, 9],
    desc: "활엽수 그루터기에서 자라는 윤기 나는 버섯. 예로부터 ‘불로초’라 불렸습니다.",
    folk: "면역력 강화, 피로 회복, 간 기능 보호 등에 전통적으로 쓰여 온 버섯입니다.",
    cook: "얇게 썰어 물에 넣고 약불에서 1시간 이상 달여 차로 마십니다. 쓴맛이 강하면 대추를 함께 넣으세요.",
    caution: "고용량 장기 섭취 시 위장 자극·알레르기 반응이 보고된 바 있습니다. 항응고제 복용 중이면 의사와 상의하세요.",
    conds: [
      { code: "LIVER", ev: "mixed", sum: "간 건강 관리용 차로 오래 쓰여 왔어요.", use: "달인 차" },
      { code: "IMMUNE", ev: "study", sum: "다당류·트리테르펜 성분이 면역과 관련해 연구되어 왔어요." },
      { code: "FATIGUE", ev: "folk", sum: "기력 회복용 약차로 즐겨 마셔 왔어요." },
      { code: "HEART", ev: "folk", sum: "혈행 관리용으로 전통적으로 이야기되어 왔어요." },
    ],
  },
  {
    name: "칡뿌리", sci: "Pueraria lobata", cat: "ROOT", family: "콩과", season: [11, 3],
    desc: "산비탈에 뻗어 자라는 칡의 뿌리. 겨울에 캔 것이 전분이 많고 단맛이 납니다.",
    folk: "숙취 해소와 갈증 해소에 좋다고 알려져 즙이나 차로 즐겨 먹었습니다.",
    cook: "깨끗이 씻어 얇게 썰어 말린 뒤 차로 달이거나, 생으로 즙을 내 마십니다.",
    caution: "몸이 찬 편이라면 많이 드시지 마세요.",
    conds: [
      { code: "LIVER", ev: "folk", sum: "술자리 다음 날 찾던 대표 뿌리예요.", use: "칡즙·칡차" },
      { code: "HEART", ev: "mixed", sum: "이소플라본(푸에라린)이 혈행과 관련해 연구되어 왔어요." },
    ],
  },
  {
    name: "오미자", sci: "Schisandra chinensis", cat: "FRUIT", family: "오미자과", season: [8, 10],
    desc: "단·신·쓴·짠·매운 다섯 맛이 난다는 붉은 열매. 깊은 산 계곡 덩굴에서 열립니다.",
    folk: "기침을 멎게 하고 갈증을 풀어주는 열매로 청이나 차로 담가 먹어 왔습니다.",
    cook: "생오미자는 설탕과 1:1로 재워 청을 담그고, 말린 오미자는 찬물에 하룻밤 우려 마십니다.",
    caution: "뜨거운 물에 끓이면 쓴맛이 강해지니 찬물에 우리세요.",
    conds: [
      { code: "RESPIRATORY", ev: "folk", sum: "기침·목 건강용 차로 오래 쓰여 왔어요.", use: "오미자청·냉침차" },
      { code: "LIVER", ev: "study", sum: "리그난 성분(쉬잔드린)이 간 건강과 관련해 연구되어 왔어요." },
      { code: "FATIGUE", ev: "folk", sum: "여름철 기운 없을 때 즐겨 마시던 열매예요." },
    ],
  },
  {
    name: "돌나물", sci: "Sedum sarmentosum", cat: "HERB", family: "돌나물과", season: [3, 5],
    desc: "산기슭 바위틈에서 자라는 통통한 잎의 다육성 나물. 아삭하고 상큼합니다.",
    folk: "봄철 입맛 없을 때 물김치나 초무침으로 즐겨 먹었습니다.",
    cook: "데치지 않고 생으로 초고추장 무침이나 물김치로 먹어요.",
    caution: "물에 오래 담가두면 물러지니 먹기 직전에 씻으세요.",
    conds: [
      { code: "LIVER", ev: "folk", sum: "봄철 간을 쉬게 하는 나물로 이야기되어 왔어요." },
      { code: "KIDNEY", ev: "folk", sum: "몸의 부기를 빼는 나물로 전해져요." },
    ],
  },
  {
    name: "우슬", sci: "Achyranthes japonica", cat: "ROOT", family: "비름과", season: [10, 3],
    desc: "줄기 마디가 소 무릎처럼 생겨 ‘쇠무릎’이라 불리는 풀의 뿌리.",
    folk: "이름처럼 무릎과 관절에 좋은 약초로 오래 쓰여 왔습니다.",
    cook: "깨끗이 씻어 말린 뒤 물에 넣고 달여 차로 마십니다.",
    caution: "임신 중에는 드시지 마세요.",
    conds: [
      { code: "JOINT", ev: "mixed", sum: "무릎·관절 관리용으로 가장 널리 알려진 산야초예요.", use: "달인 차" },
      { code: "KIDNEY", ev: "folk", sum: "몸의 순환을 돕는 약초로 전해져요." },
    ],
  },
];

async function main() {
  for (const [code, name] of CONDITIONS) {
    await prisma.condition.upsert({ where: { code }, update: { name }, create: { code, name } });
  }
  const condId = Object.fromEntries((await prisma.condition.findMany()).map((c) => [c.code, c.id]));

  const plantId: Record<string, number> = {};
  for (const p of PLANTS) {
    const data = {
      scientificName: p.sci, category: p.cat, family: p.family, generalDescription: p.desc,
      folkUsageSummary: p.folk, healthyCookingTips: p.cook, cautionsDetail: p.caution, status: "REVIEWED",
    };
    const plant = await prisma.plant.upsert({ where: { commonName: p.name }, update: data, create: { commonName: p.name, ...data } });
    plantId[p.name] = plant.id;
    for (const c of p.conds) {
      const d = { evidenceLevel: c.ev, efficacySummary: c.sum, usageNote: c.use ?? null, confidenceScore: c.ev === "study" ? 3 : c.ev === "mixed" ? 2 : 1 };
      await prisma.plantCondition.upsert({
        where: { plantId_conditionId: { plantId: plant.id, conditionId: condId[c.code] } },
        update: d,
        create: { plantId: plant.id, conditionId: condId[c.code], ...d },
      });
    }
    if (!(await prisma.seasonality.findFirst({ where: { plantId: plant.id } }))) {
      await prisma.seasonality.create({ data: { plantId: plant.id, startMonth: p.season[0], endMonth: p.season[1] } });
    }
  }

  const hash = await bcrypt.hash("password123", 10);
  const sellers = [
    { email: "seller1@nature.kr", name: "김산해", farm: "태백 산마루 채취단", region: "강원 태백" },
    { email: "seller2@nature.kr", name: "박운곡", farm: "지리산 운곡 약초방", region: "경남 함양" },
    { email: "seller3@nature.kr", name: "이솔뫼", farm: "울릉 솔뫼 산채", region: "경북 울릉" },
  ];
  const sellerIds: number[] = [];
  for (const s of sellers) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, role: "SELLER", passwordHash: hash, sellerProfile: { create: { farmName: s.farm, verified: true } } },
    });
    sellerIds.push(u.id);
  }
  // 관리자 계정
  // - SEED_ADMIN_PASSWORD 환경변수가 있으면: 그 값으로 만들거나 비밀번호를 바꿈 (배포할 때마다 적용)
  // - 없으면: 처음 한 번만 무작위 비밀번호로 만들고 로그에 출력
  let adminPw: string | null = null;
  let adminReset = false;
  const envPw = process.env.SEED_ADMIN_PASSWORD?.trim();
  const existingAdmin = await prisma.user.findUnique({ where: { email: "admin@nature.kr" } });
  if (envPw) {
    await prisma.user.upsert({
      where: { email: "admin@nature.kr" },
      update: { role: "ADMIN", suspended: false, passwordHash: await bcrypt.hash(envPw, 10) },
      create: { email: "admin@nature.kr", name: "운영자", role: "ADMIN", passwordHash: await bcrypt.hash(envPw, 10) },
    });
    adminReset = true;
  } else if (!existingAdmin) {
    adminPw = randomBytes(6).toString("base64url");
    await prisma.user.create({ data: { email: "admin@nature.kr", name: "운영자", role: "ADMIN", passwordHash: await bcrypt.hash(adminPw, 10) } });
  }

  // ADMIN_EMAILS 환경변수(쉼표 구분)에 적힌 회원은 관리자로 지정
  for (const email of (process.env.ADMIN_EMAILS || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    const r = await prisma.user.updateMany({ where: { email }, data: { role: "ADMIN" } });
    console.log(r.count ? `👑 ${email} → 관리자 지정` : `⚠️ ${email} 회원이 없습니다 (먼저 사이트에서 가입하세요)`);
  }
  await prisma.user.upsert({
    where: { email: "buyer@nature.kr" },
    update: {},
    create: { email: "buyer@nature.kr", name: "홍길동", role: "BUYER", passwordHash: hash, healthDiabetes: true, healthJoint: true, healthHypertension: true },
  });

  const day = (n: number) => new Date(Date.now() - n * 86400000);
  const PRODUCTS: [number, string, string, number, number, string, string, number][] = [
    // [seller idx, plant, title, price, qty, unit, form, days ago]
    [0, "곰취", "태백 함백산 해발 800m 자연산 곰취", 28000, 20, "kg", "생것", 1],
    [0, "참취", "강원 고랭지 햇참취 (손으로 한 잎씩)", 18000, 15, "kg", "생것", 2],
    [0, "엄나무순", "태백 깊은 골 엄나무순(개두릅)", 32000, 6, "kg", "생것", 3],
    [0, "칡뿌리", "겨울에 캔 태백 칡뿌리 슬라이스", 15000, 30, "봉", "건조", 12],
    [1, "더덕", "지리산 10년 이상 묵은 자연산 더덕", 65000, 8, "kg", "생것", 2],
    [1, "도라지", "지리산 산도라지 (5년근 이상)", 42000, 10, "kg", "생것", 4],
    [1, "영지버섯", "함양 참나무 그루터기 자연산 영지", 48000, 5, "봉", "건조", 20],
    [1, "오가피", "지리산 오가피 줄기 (차용 손질)", 22000, 25, "봉", "건조", 9],
    [1, "우슬", "함양 쇠무릎(우슬) 뿌리", 26000, 12, "봉", "건조", 15],
    [1, "오미자", "지리산 계곡 자연산 오미자 (말린 것)", 35000, 3, "봉", "건조", 30],
    [2, "산마늘", "울릉도 성인봉 자연산 명이나물", 38000, 14, "kg", "생것", 1],
    [2, "산마늘", "울릉 명이 간장 장아찌", 24000, 20, "개", "절임·장아찌", 10],
    [2, "표고버섯", "울릉 참나무 자연산 표고 (생)", 30000, 9, "kg", "생것", 2],
    [2, "돌나물", "울릉 바위틈 돌나물", 12000, 18, "kg", "생것", 1],
    [0, "두릅", "태백 참두릅 첫물", 45000, 2, "kg", "생것", 0],
  ];
  for (const [si, plant, title, price, qty, unit, form, ago] of PRODUCTS) {
    const exists = await prisma.product.findFirst({ where: { title, sellerId: sellerIds[si] } });
    if (exists) continue;
    await prisma.product.create({
      data: {
        title, price, quantity: qty, unit, formState: form, region: sellers[si].region, harvestDate: day(ago),
        plantId: plantId[plant], plantName: plant, sellerId: sellerIds[si],
        description: `${sellers[si].farm}에서 직접 채취했습니다.\n${PLANTS.find((p) => p.name === plant)?.desc ?? ""}`,
      },
    });
  }
  console.log("✅ seed 완료 — 구매자 buyer@nature.kr / 채취자 seller1@nature.kr (비밀번호 password123)");
  if (adminReset) {
    console.log("🔑 관리자 admin@nature.kr 비밀번호를 SEED_ADMIN_PASSWORD 값으로 설정했습니다.");
  } else if (adminPw) {
    console.log("");
    console.log("🔑 관리자 계정이 새로 만들어졌습니다. 이 비밀번호는 다시 표시되지 않으니 꼭 적어두세요!");
    console.log(`   아이디: admin@nature.kr   비밀번호: ${adminPw}`);
    console.log("");
  } else {
    console.log("   관리자 admin@nature.kr 은 기존 비밀번호 그대로입니다.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
