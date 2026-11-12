import type { Metadata } from "next";
import { Noto_Sans_TC, Noto_Serif_TC } from "next/font/google";
import { SITE_NAME } from "@/config/site";
import "./globals.css";

/**
 * 字体白托管：next/font 在构建期把 Google Fonts 的字形分片下载到本地，
 * 运行时浏览器只请求同源资源 —— 没有第三方请求，隐私口径与「本地计算」一致。
 *
 * CJK 字体按 unicode-range 切成上百个分片，无法逐片 preload（preload 只会命中
 * `/* latin *\/` 这类带子集注释的分片），因此关闭 preload、用 font-display: swap，
 * 让浏览器只取页面实际用到的字形分片。
 */
const notoSans = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const notoSerif = Noto_Serif_TC({
  variable: "--font-noto-serif-tc",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

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
    <html
      lang="zh-CN"
      className={`${notoSans.variable} ${notoSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
