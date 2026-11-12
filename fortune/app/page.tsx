import type { Metadata } from "next";
import Link from "next/link";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  // 标题沿用 layout 的默认值（SITE_NAME + 定位语），这里只收窄描述
  description:
    "八字排盘、六爻起卦与塔罗牌阵三种命理工具，全部在浏览器本地计算：生辰与问题不会离开你的设备。",
};

/** 三个功能入口：书签牌式竖长卡，底部点缀取自各页符号（不引图片资源）。 */
const ENTRIES = [
  {
    href: "/bazi",
    mark: "甲子",
    title: "八字排盘",
    kicker: "四柱 · 五行 · 大运",
    body: "输入出生时刻，排四柱、十神、藏干与纳音，并排 10 步大运。",
  },
  {
    href: "/liuyao",
    mark: "䷀",
    title: "六爻起卦",
    kicker: "三钱六掷 · 纳甲装卦",
    body: "三枚铜钱掷六次成卦，或按此刻时间起卦，标注六亲、纳甲与世应。",
  },
  {
    href: "/tarot",
    mark: "✦",
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
            <h1 className="mt-3 font-serif text-[clamp(2rem,7vw,2.75rem)] leading-[1.45] tracking-[0.1em] text-fg">
              把命理排盘
              <br className="sm:hidden" />
              放回你自己的浏览器
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-fg-soft">
              三个独立工具：八字排盘看四柱与大运，六爻起卦看动爻与变占，塔罗牌阵看过去、现在与未来。
              口径写在明处，推导过程留在页面上，可以逐条核对。
            </p>
            <p className="mt-4 max-w-md border-l-2 border-accent pl-3 text-[11px] leading-6 text-fg-muted">
              排盘在你的浏览器本地完成，生辰数据不会离开你的设备；点击 AI 解读时会发送排盘结果（不含生辰）与所问事项。
            </p>
          </section>

          <nav aria-label="工具入口" className="border-t border-rule pt-6">
            <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
              {ENTRIES.map((entry) => (
                <li key={entry.href} className="flex">
                  <Link
                    href={entry.href}
                    aria-label={entry.title}
                    className="tap group relative flex min-h-[22rem] w-full flex-col justify-between border border-rule bg-surface-2 p-5 transition-[transform,border-color,box-shadow] duration-150 hover:-translate-y-1 hover:border-accent hover:shadow-[0_14px_26px_-22px_var(--ink)] sm:min-h-[23rem] sm:p-4"
                  >
                    {/* 书签牌的朱砂系带 */}
                    <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-accent" />

                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[10px] leading-4 tracking-[0.18em] text-fg-faint">
                        {entry.kicker}
                      </span>
                      <span
                        aria-hidden
                        className="shrink-0 font-serif text-[17px] leading-none text-accent"
                      >
                        {entry.mark}
                      </span>
                    </span>

                    <span className="flex flex-1 items-center justify-center py-5">
                      <span className="vertical font-serif text-[clamp(1.4rem,6.4vw,1.85rem)] font-semibold leading-none tracking-[0.3em] text-fg transition-colors group-hover:text-accent">
                        {entry.title}
                      </span>
                    </span>

                    <span className="block border-t border-rule-ink pt-2.5 text-[12px] leading-6 text-fg-soft">
                      {entry.body}
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
