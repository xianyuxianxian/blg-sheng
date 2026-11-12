import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SITE_NAME } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
