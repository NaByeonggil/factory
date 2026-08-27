import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL이 설정되지 않았습니다.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const INGREDIENTS = [
  {
    slug: "melatonin",
    category: "HOT_TREND" as const,
    isFeatured: true,
    sortOrder: 1,
    ko: { name: "멜라토닌", summary: "수면의 질 개선에 도움을 줄 수 있는 원료", dailyDose: "0.5~5mg" },
    en: { name: "Melatonin", summary: "Supports sleep quality", dailyDose: "0.5–5mg" },
    zh: { name: "褪黑素", summary: "有助于改善睡眠质量", dailyDose: "0.5~5mg" },
  },
  {
    slug: "nmn",
    category: "SUPERFOOD" as const,
    isFeatured: true,
    sortOrder: 2,
    ko: { name: "NMN", summary: "NAD+ 전구체로 주목받는 항노화 소재", dailyDose: "125~500mg" },
    en: { name: "NMN", summary: "NAD+ precursor for healthy aging", dailyDose: "125–500mg" },
    zh: { name: "NMN", summary: "备受关注的 NAD+ 前体抗衰原料", dailyDose: "125~500mg" },
  },
  {
    slug: "berberine",
    category: "HOT_TREND" as const,
    isFeatured: true,
    sortOrder: 3,
    ko: { name: "베르베린", summary: "혈당·대사 관리 카테고리의 핵심 소재", dailyDose: "500~1,000mg" },
    en: { name: "Berberine", summary: "Key material for metabolic support", dailyDose: "500–1,000mg" },
    zh: { name: "小檗碱", summary: "血糖与代谢管理的核心原料", dailyDose: "500~1,000mg" },
  },
  {
    slug: "fisetin",
    category: "SUPERFOOD" as const,
    isFeatured: true,
    sortOrder: 4,
    ko: { name: "피세틴", summary: "플라보노이드 계열 항산화 소재", dailyDose: "100~500mg" },
    en: { name: "Fisetin", summary: "Flavonoid antioxidant", dailyDose: "100–500mg" },
    zh: { name: "非瑟酮", summary: "黄酮类抗氧化原料", dailyDose: "100~500mg" },
  },
  {
    slug: "ib-complex",
    category: "INDIVIDUAL_APPROVED" as const,
    isFeatured: true,
    sortOrder: 5,
    ko: {
      name: "IB Complex",
      summary: "장 건강 개별인정형 복합 원료",
      functionality: "장 건강에 도움을 줄 수 있음",
      dailyDose: "1,000mg",
    },
    en: { name: "IB Complex", summary: "Individually approved gut-health complex", dailyDose: "1,000mg" },
    zh: { name: "IB Complex", summary: "个别认证型肠道健康复合原料", dailyDose: "1,000mg" },
  },
  {
    slug: "hl-joint-100",
    category: "PATENT" as const,
    isFeatured: true,
    sortOrder: 6,
    ko: {
      name: "HL-Joint100",
      summary: "관절 건강 특허 보유 원료",
      functionality: "관절 및 연골 건강에 도움을 줄 수 있음",
      dailyDose: "300mg",
    },
    en: { name: "HL-Joint100", summary: "Patented joint-health ingredient", dailyDose: "300mg" },
    zh: { name: "HL-Joint100", summary: "拥有专利的关节健康原料", dailyDose: "300mg" },
  },
  {
    slug: "vitamin-d3",
    category: "BASIC" as const,
    isFeatured: false,
    sortOrder: 10,
    ko: { name: "비타민 D3", summary: "고시형 기본 원료", dailyDose: "1,000~4,000IU" },
    en: { name: "Vitamin D3", summary: "Standard listed ingredient", dailyDose: "1,000–4,000IU" },
    zh: { name: "维生素 D3", summary: "基础告示型原料", dailyDose: "1,000~4,000IU" },
  },
];

const CERTIFICATIONS = [
  { code: "GMP", name: "우수건강기능식품제조기준", sortOrder: 1 },
  { code: "HACCP", name: "식품안전관리인증", sortOrder: 2 },
  { code: "ISO 9001", name: "품질경영시스템", sortOrder: 3 },
  { code: "ISO 22000", name: "식품안전경영시스템", sortOrder: 4 },
  { code: "ISO 14001", name: "환경경영시스템", sortOrder: 5 },
  { code: "ISO 45001", name: "안전보건경영시스템", sortOrder: 6 },
  { code: "CCM", name: "소비자중심경영", sortOrder: 7 },
];

const PRODUCTS = [
  {
    slug: "joint-care-tablet",
    serviceType: "ODM" as const,
    formulation: "TABLET",
    isFeatured: true,
    sortOrder: 1,
    ingredientSlugs: ["hl-joint-100"],
    ko: { title: "관절 케어 정제", description: "HL-Joint100을 적용한 중장년 타깃 관절 건강 정제입니다.\n60정 병포장으로 2개월분을 구성했습니다." },
    en: { title: "Joint Care Tablet", description: "A joint health tablet for middle-aged consumers built on HL-Joint100, bottled as a 60-tablet two-month supply." },
    zh: { title: "关节护理片剂", description: "以 HL-Joint100 为核心、面向中老年的关节健康片剂，60片瓶装为两个月用量。" },
  },
  {
    slug: "sleep-jelly-stick",
    serviceType: "OEM" as const,
    formulation: "JELLY",
    isFeatured: true,
    sortOrder: 2,
    ingredientSlugs: ["melatonin"],
    ko: { title: "수면 젤리 스틱", description: "멜라토닌 기반 취침 전 섭취용 젤리 스틱입니다.\n물 없이 섭취 가능해 재구매율이 높습니다." },
    en: { title: "Sleep Jelly Stick", description: "A melatonin-based bedtime jelly stick. No water needed, which drives strong repeat purchase." },
    zh: { title: "助眠果冻条", description: "以褪黑素为核心的睡前果冻条，无需饮水即可服用，复购率高。" },
  },
  {
    slug: "nmn-capsule",
    serviceType: "ODM" as const,
    formulation: "HARD_CAPSULE",
    isFeatured: false,
    sortOrder: 3,
    ingredientSlugs: ["nmn", "fisetin"],
    ko: { title: "NMN 항노화 캡슐", description: "NMN과 피세틴을 복합 배합한 프리미엄 라인 제품입니다." },
    en: { title: "NMN Anti-aging Capsule", description: "A premium line product combining NMN and fisetin." },
    zh: { title: "NMN 抗衰胶囊", description: "复配 NMN 与非瑟酮的高端产品线。" },
  },
  {
    slug: "pet-gut-powder",
    serviceType: "PET" as const,
    formulation: "POWDER",
    isFeatured: false,
    sortOrder: 4,
    ingredientSlugs: [],
    ko: { title: "반려동물 장 건강 분말", description: "사료에 뿌려 급여하는 반려동물 전용 유산균 분말입니다." },
    en: { title: "Pet Gut Health Powder", description: "A probiotic powder for pets, sprinkled over regular feed." },
    zh: { title: "宠物肠道健康粉", description: "撒于日常饲料喂食的宠物专用益生菌粉。" },
  },
];

const POSTS = [
  {
    slug: "cphi-korea-2026",
    category: "NEWS" as const,
    publishedAt: new Date("2026-07-15T00:00:00Z"),
    ko: { title: "CPHI Korea 2026 참가 안내", excerpt: "8월 서울 코엑스에서 열리는 CPHI Korea 2026에 부스를 운영합니다.",
      body: "2026년 8월 서울 코엑스에서 개최되는 CPHI Korea 2026에 참가합니다.\n\n부스에서는 신규 개별인정형 원료와 이중제형 생산 사례를 소개할 예정입니다. 사전 등록하신 분께는 상담 시간을 우선 배정해 드립니다.\n\n방문을 원하시는 고객사는 생산 문의 양식을 통해 미리 알려주시기 바랍니다." },
    en: { title: "Joining CPHI Korea 2026", excerpt: "We will run a booth at CPHI Korea 2026 at COEX Seoul this August.",
      body: "We will exhibit at CPHI Korea 2026, held at COEX Seoul in August 2026.\n\nAt our booth we will introduce newly approved ingredients and dual-form production cases. Pre-registered visitors receive priority consultation slots.\n\nIf you plan to visit, please let us know in advance through the inquiry form." },
    zh: { title: "参展 CPHI Korea 2026", excerpt: "8月将在首尔 COEX 举办的 CPHI Korea 2026 设置展位。",
      body: "我们将参加2026年8月在首尔 COEX 举办的 CPHI Korea 2026。\n\n展位上将介绍新获个别认证的原料与双剂型生产案例。事先登记的访客可优先安排洽谈时间。\n\n计划到访的客户请通过生产咨询表单提前告知。" },
  },
  {
    slug: "minimum-order-guide",
    category: "NOTICE" as const,
    publishedAt: new Date("2026-06-01T00:00:00Z"),
    ko: { title: "제형별 최소 생산 수량 안내", excerpt: "자주 문의 주시는 최소 생산 수량을 제형별로 정리했습니다.",
      body: "최소 생산 수량은 제형과 포장 방식에 따라 달라집니다.\n\n• 정제·경질캡슐: 1,000개부터\n• 연질캡슐: 3,000개부터\n• 스틱 분말: 3,000포부터\n• 젤리: 5,000포부터\n• 액상 파우치: 5,000포부터\n\n위 수량은 기준값이며, 원료 수급 상황과 포장 사양에 따라 조정될 수 있습니다. 정확한 조건은 상담 시 안내드립니다." },
    en: { title: "Minimum order quantity by dosage form", excerpt: "We have summarised the minimum order quantities we are asked about most.",
      body: "Minimum order quantity varies by dosage form and packaging.\n\n• Tablet, hard capsule: from 1,000 units\n• Soft capsule: from 3,000 units\n• Stick powder: from 3,000 sachets\n• Jelly: from 5,000 sachets\n• Liquid pouch: from 5,000 pouches\n\nThese are baseline figures and may change with material availability and packaging specification. Exact terms are confirmed during consultation." },
    zh: { title: "各剂型最小生产量说明", excerpt: "整理了咨询最多的各剂型最小生产量。",
      body: "最小生产量依剂型与包装方式而异。\n\n• 片剂、硬胶囊：1,000个起\n• 软胶囊：3,000个起\n• 条包粉末：3,000包起\n• 果冻：5,000包起\n• 液体袋装：5,000包起\n\n以上为基准值，可能因原料供应与包装规格调整。准确条件在咨询时告知。" },
  },
  {
    slug: "esg-packaging-2026",
    category: "ESG" as const,
    publishedAt: new Date("2026-05-10T00:00:00Z"),
    ko: { title: "친환경 포장재 전환 현황", excerpt: "단상자 전량을 FSC 인증 용지로 전환했습니다.",
      body: "2026년 상반기까지 단상자 전량을 FSC 인증 용지로 전환했습니다.\n\n스틱 포장재의 경우 단일 소재 필름 적용을 검토 중이며, 2026년 하반기 시범 적용을 목표로 하고 있습니다.\n\n포장재 변경은 단가에 영향을 줄 수 있으므로, 적용을 원하시는 고객사는 견적 단계에서 말씀해 주시기 바랍니다." },
    en: { title: "Switching to sustainable packaging", excerpt: "All cartons have moved to FSC certified paper.",
      body: "By the first half of 2026 we moved all cartons to FSC certified paper.\n\nFor stick packaging we are evaluating mono-material film, targeting a pilot in the second half of 2026.\n\nPackaging changes can affect unit cost, so please raise it at the quotation stage if you would like it applied." },
    zh: { title: "环保包装材料转换进展", excerpt: "彩盒已全部更换为 FSC 认证纸张。",
      body: "截至2026年上半年，彩盒已全部更换为 FSC 认证纸张。\n\n条包材料方面正在评估单一材质薄膜，目标于2026年下半年试点应用。\n\n包装变更可能影响单价，如需采用请在报价阶段告知。" },
  },
  {
    slug: "factory-tour-guide",
    category: "FACTORY_TOUR" as const,
    publishedAt: new Date("2026-04-02T00:00:00Z"),
    ko: { title: "공장 투어 신청 안내", excerpt: "생산 현장을 직접 확인하실 수 있습니다.",
      body: "계약을 검토 중이신 고객사를 대상으로 공장 투어를 운영합니다.\n\n투어에서는 원료 입고 검사실, 칭량실, 타정·충전 라인, 포장 라인, 완제품 시험실을 순서대로 확인하실 수 있습니다.\n\n생산 일정에 따라 일부 구역은 참관이 제한될 수 있으며, 위생 규정상 방진복 착용이 필요합니다. 신청은 생산 문의 양식에 희망 일자를 적어 보내주시면 됩니다." },
    en: { title: "Requesting a factory tour", excerpt: "See the production floor for yourself.",
      body: "We run factory tours for clients considering a contract.\n\nThe tour covers the incoming material inspection room, weighing room, tableting and filling lines, packaging lines and the finished product laboratory, in that order.\n\nSome areas may be restricted depending on the production schedule, and cleanroom garments are required. To request a tour, note your preferred date in the inquiry form." },
    zh: { title: "工厂参观申请说明", excerpt: "可亲自确认生产现场。",
      body: "面向正在评估合作的客户提供工厂参观。\n\n参观依次包括原料入库检验室、称量室、压片与填充线、包装线以及成品试验室。\n\n部分区域可能因生产排期受限，且依卫生规定需穿着防尘服。申请时请在生产咨询表单中填写希望日期。" },
  },
];


/** 팝업 공지 3건 — 핸드폰 규격(320×480)으로 노출됩니다 */
const POPUPS = [
  {
    slug: "consultation-notice",
    linkUrl: "/ko/inquiry",
    sortOrder: 1,
    ko: { title: "생산 상담 안내", body: "OEM·ODM 생산 상담은 평일 09:00~18:00에 접수하시면\n영업일 기준 1일 이내에 연락드립니다.", linkLabel: "생산문의 하기" },
    en: { title: "Production consultation", body: "Submit an OEM/ODM inquiry on weekdays 09:00–18:00\nand we will reply within one business day.", linkLabel: "Send an inquiry" },
    zh: { title: "生产咨询指南", body: "工作日 09:00~18:00 提交 OEM/ODM 咨询，\n我们将在一个工作日内联系您。", linkLabel: "提交咨询" },
  },
  {
    slug: "minimum-order-popup",
    linkUrl: "/ko/community/notice/minimum-order-guide",
    sortOrder: 2,
    ko: { title: "제형별 최소 생산 수량", body: "정제·경질캡슐 1,000개 / 연질캡슐·스틱 3,000개 /\n젤리·액상 5,000개부터 생산 가능합니다.", linkLabel: "자세히 보기" },
    en: { title: "Minimum order quantity", body: "Tablet and hard capsule from 1,000 units, soft capsule and\nstick from 3,000, jelly and liquid from 5,000.", linkLabel: "Learn more" },
    zh: { title: "各剂型最小生产量", body: "片剂·硬胶囊 1,000个起，软胶囊·条包 3,000个起，\n果冻·液体 5,000个起。", linkLabel: "查看详情" },
  },
  {
    slug: "holiday-schedule",
    linkUrl: null,
    sortOrder: 3,
    ko: { title: "하계 휴무 안내", body: "8월 첫째 주(8/3~8/7)는 공장 정기 보수로 휴무입니다.\n해당 기간 접수된 문의는 8/10부터 순차 회신드립니다.", linkLabel: null },
    en: { title: "Summer shutdown notice", body: "The plant is closed for scheduled maintenance in the first\nweek of August (Aug 3–7). Replies resume from Aug 10.", linkLabel: null },
    zh: { title: "夏季停产通知", body: "8月第一周（8/3~8/7）工厂定期检修停产。\n期间收到的咨询将从8/10起依次回复。", linkLabel: null },
  },
];

async function main() {
  // ── 관리자 계정 ──
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "changeme1234";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "관리자",
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: "ADMIN",
    },
  });
  console.log(`관리자 계정: ${admin.email} / ${adminPassword}`);

  // ── 사이트 설정 ──
  await prisma.siteSetting.upsert({
    where: { key: "company" },
    update: {},
    create: {
      key: "company",
      value: {
        name: "(주)헬씨팜바이오",
        ceo: "홍길동",
        bizNo: "000-00-00000",
        address: "경기도 성남시 분당구 판교로 000",
        tel: "031-000-0000",
        fax: "031-000-0001",
      },
    },
  });

  // ── 인증 ──
  for (const cert of CERTIFICATIONS) {
    await prisma.certification.upsert({
      where: { code: cert.code },
      update: cert,
      create: cert,
    });
  }

  // ── 원료 (3개 국어) ──
  for (const item of INGREDIENTS) {
    const { slug, category, isFeatured, sortOrder, ko, en, zh } = item;
    await prisma.ingredient.upsert({
      where: { slug },
      update: { category, isFeatured, sortOrder },
      create: {
        slug,
        category,
        isFeatured,
        sortOrder,
        translations: {
          create: [
            { locale: "KO", ...ko },
            { locale: "EN", ...en },
            { locale: "ZH", ...zh },
          ],
        },
      },
    });
  }

  // ── 포트폴리오 ──
  for (const item of PRODUCTS) {
    const { slug, serviceType, formulation, isFeatured, sortOrder, ingredientSlugs, ko, en, zh } = item;
    await prisma.product.upsert({
      where: { slug },
      update: { serviceType, formulation, isFeatured, sortOrder },
      create: {
        slug,
        serviceType,
        formulation,
        isFeatured,
        sortOrder,
        ingredients: { connect: ingredientSlugs.map((s) => ({ slug: s })) },
        translations: {
          create: [
            { locale: "KO", ...ko },
            { locale: "EN", ...en },
            { locale: "ZH", ...zh },
          ],
        },
      },
    });
  }

  // ── 게시물 ──
  for (const item of POSTS) {
    const { slug, category, publishedAt, ko, en, zh } = item;
    await prisma.post.upsert({
      where: { slug },
      update: { category, publishedAt },
      create: {
        slug,
        category,
        publishedAt,
        translations: {
          create: [
            { locale: "KO", ...ko },
            { locale: "EN", ...en },
            { locale: "ZH", ...zh },
          ],
        },
      },
    });
  }

  // ── 팝업 공지 ──
  for (const item of POPUPS) {
    const { slug, linkUrl, sortOrder, ko, en, zh } = item;
    await prisma.popup.upsert({
      where: { slug },
      update: { linkUrl, sortOrder, isPublished: true },
      create: {
        slug,
        linkUrl,
        sortOrder,
        isPublished: true,
        translations: {
          create: [
            { locale: "KO", ...ko },
            { locale: "EN", ...en },
            { locale: "ZH", ...zh },
          ],
        },
      },
    });
  }

  console.log(
    `시드 완료: 원료 ${INGREDIENTS.length}건, 인증 ${CERTIFICATIONS.length}건, ` +
      `포트폴리오 ${PRODUCTS.length}건, 게시물 ${POSTS.length}건, ` +
      `팝업 ${POPUPS.length}건`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
