import { prisma } from "@/lib/prisma";

/** 포트폴리오 폼의 원료 선택지 (한국어명 기준) */
export async function getIngredientOptions() {
  const rows = await prisma.ingredient.findMany({
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      translations: { where: { locale: "KO" }, select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    name: row.translations[0]?.name ?? row.slug,
  }));
}
