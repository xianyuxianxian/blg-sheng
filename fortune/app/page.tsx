import type { Metadata } from "next";
import Link from "next/link";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  // 标题沿用 layout 的默认值（SITE_NAME + 定位语），这里只收窄描述
  description:
    "八字排盘、六爻起卦与塔罗牌阵三种命理工具，全部在浏览器本地计算：生辰与问题不会离开你的设备。",
};

/** 三个功能入口：符号取自各页标题角标，不用图片资源 */
const ENTRIES = [
  {
    href: "/bazi",
    glyph: ["八", "字"],
    title: "八字排盘",
    kicker: "四柱 · 五行 · 大运",
    body: "输入出生时刻，排四柱、十神、藏干与纳音，并排 10 步大运。",
  },
  {
    href: "/liuyao",
    glyph: ["六", "爻"],
    title: "六爻起卦",
    kicker: "三钱六掷 · 纳甲装卦",
    body: "三枚铜钱掷六次成卦，或按此刻时间起卦，标注六亲、纳甲与世应。",
  },
  {
    href: "/tarot",
    glyph: ["塔", "罗"],
    title: "塔罗牌阵",
    kicker: "七十八张韦特 · 正逆位",
    body: "洗牌后抽三张，按过去、现在、未来解读牌面与正逆位。",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen border-t-2 border-accent bg-surface text-fg">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between border-b border-rule pb-4">
          <span className="flex items-center gap-2.5 text-sm tracking-[0.2em] text-fg-soft">
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center bg-accent font-serif text-[13px] leading-none text-on-accent"
            >
              命
            </span>
            <span className="font-serif">{SITE_NAME}</span>
          </span>
          <Link
            href="/about"
            className="tap text-[11px] tracking-[0.15em] text-fg-muted hover:text-accent"
          >
            关于
          </Link>
        </header>

        <main className="flex-1">
          <section className="py-10 sm:py-14">
            <p className="text-[11px] tracking-[0.35em] text-fg-muted">八字 · 六爻 · 塔罗</p>
            <h1 className="mt-3 font-serif text-3xl leading-[1.45] tracking-[0.1em] text-fg sm:text-4xl">
              把命理排盘
              <br className="sm:hidden" />
              放回你自己的浏览器
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-fg-soft">
              三个独立工具：八字排盘看四柱与大运，六爻起卦看动爻与变占，塔罗牌阵看过去、现在与未来。
              口径写在明处，推导过程留在页面上，可以逐条核对。
            </p>
            <p className="mt-4 max-w-md border-l-2 border-accent pl-3 text-[11px] leading-6 text-fg-muted">
              所有排盘在你的浏览器本地完成，生辰数据不会离开你的设备。
            </p>
          </section>

          <nav aria-label="工具入口" className="border-t border-rule pt-6">
            <ul className="flex flex-col gap-3">
              {ENTRIES.map((entry) => (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    className="tap group flex items-start gap-4 border border-rule bg-surface-2 p-5 hover:border-accent"
                  >
                    <span
                      aria-hidden
                      className="grid h-11 w-11 shrink-0 place-items-center border border-accent bg-accent font-serif text-[12px] leading-[1.15] text-on-accent"
                    >
                      {entry.glyph[0]}
                      <br />
                      {entry.glyph[1]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="font-serif text-lg tracking-[0.1em] text-fg transition-colors group-hover:text-accent">
                          {entry.title}
                        </span>
                        <span className="text-[10px] tracking-[0.2em] text-fg-faint">
                          {entry.kicker}
                        </span>
                      </span>
                      <span className="mt-2 block text-[13px] leading-6 text-fg-soft">
                        {entry.body}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </main>

        <DisclaimerFooter />
      </div>
    </div>
  );
}
