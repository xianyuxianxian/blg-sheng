/**
 * robots.txt —— 静态导出时在构建期求值，产物为 `out/robots.txt`。
 *
 * 全部页面允许抓取（无私有路由），并指向 sitemap。
 */

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

/** 静态导出（output: "export"）下 metadata route 必须显式声明构建期求值 */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
