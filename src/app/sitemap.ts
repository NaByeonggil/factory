import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import {
  POST_CATEGORY_SLUGS,
  getAllIngredientSlugs,
  getAllPosts,
  getAllProductSlugs,
} from "@/lib/queries";

const STATIC_PATHS = [
  "",
  "/about",
  "/about/rnd",
  "/about/qc",
  "/service/oem-odm",
  "/service/material",
  "/service/cdmo",
  "/service/dtc",
  "/service/pet",
  "/service/cosmetic",
  "/ingredients",
  "/portfolio",
  "/inquiry",
  "/legal/terms",
  "/legal/privacy",
  ...Object.keys(POST_CATEGORY_SLUGS).map((c) => `/community/${c}`),
];

const SLUG_BY_CATEGORY = Object.fromEntries(
  Object.entries(POST_CATEGORY_SLUGS).map(([slug, value]) => [value, slug]),
) as Record<string, string>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [slugs, productSlugs, posts] = await Promise.all([
    getAllIngredientSlugs(),
    getAllProductSlugs(),
    getAllPosts(),
  ]);
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of STATIC_PATHS) {
      entries.push({
        url: `${siteUrl}/${locale}${path}`,
        lastModified,
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : path === "/inquiry" ? 0.9 : 0.7,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
          ),
        },
      });
    }

    for (const { slug } of slugs) {
      entries.push({
        url: `${siteUrl}/${locale}/ingredients/${slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const { slug } of productSlugs) {
      entries.push({
        url: `${siteUrl}/${locale}/portfolio/${slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    for (const post of posts) {
      entries.push({
        url: `${siteUrl}/${locale}/community/${SLUG_BY_CATEGORY[post.category]}/${post.slug}`,
        lastModified,
        changeFrequency: "yearly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
