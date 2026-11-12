/**
 * 全站 sitemap —— 静态导出时在构建期求值，产物为 `out/sitemap.xml`。
 *
 * 站点只有 5 个静态路由，全部列在这里；新增页面时同步补一条。
 * 绝对地址由 `SITE_URL` 拼接（占位域名见 `config/site.ts`，上线前要改）。
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/** 静态导出（output: "export"）下 metadata route 必须显式声明构建期求值 */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE_URL}/bazi`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/liuyao`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/tarot`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "yearly", priority: 0.5 },
  ];
}
