import type { Metadata } from "next";
import { SITE_NAME } from "@/config/site";
import "@fontsource-variable/noto-sans-tc";
import "@fontsource-variable/noto-serif-tc";
import "./globals.css";

/**
 * 字体自托管：@fontsource-variable（npm 包内含全部字形分片，构建期零网络请求）。
 * CSS 变量 --font-noto-sans-tc / --font-noto-serif-tc 在 globals.css 的 @theme 里
 * 指向这两个 family 名，效果与原 next/font/google 一致——运行时浏览器只请求同源
 * 资源，没有第三方请求，隐私口径与「本地计算」一致。
 *
 * CJK 字体按 unicode-range 切成上百个分片（font-display: swap），浏览器只取
 * 页面实际用到的字形分片。改用 fontsource 的原因：构建机网络到 fonts.googleapis.com
 * 不稳定（TLS 重置），npm 源分发的字体让构建完全离线可复现。
 */

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} · 八字排盘、六爻起卦与塔罗牌阵`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "在浏览器本地完成计算的命理工具：八字排盘看四柱、五行、十神与大运，六爻起卦按朱熹变占法取辞，塔罗牌阵抽三张解读过去、现在与未来。生辰与问题都不会离开你的设备。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
