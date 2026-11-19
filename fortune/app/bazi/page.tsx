import type { Metadata } from "next";
import { BaziCalculator } from "@/components/BaziCalculator";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "八字排盘",
  description:
    "按节气与晚子时口径排四柱，查看五行分布、十神、藏干、纳音与大运。所有计算在浏览器本地完成。",
};

export default function BaziPage() {
  return (
    <PageShell wide>
      <section className="py-10 sm:py-12">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[11px] tracking-[0.35em] text-fg-faint">四柱 · 五行 · 大运</p>
            <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-fg sm:text-4xl">
              八字排盘
            </h1>
          </div>
          {/* 命理文书：朱砂方印 */}
          <span
            aria-hidden
            className="mt-1 grid h-12 w-12 shrink-0 rotate-[-4deg] place-items-center border border-accent bg-accent font-serif text-[13px] leading-[1.1] text-on-accent"
          >
            八
            <br />
            字
          </span>
        </div>

        <p className="mt-5 max-w-md text-sm leading-7 text-fg-soft">
          以北京时间排四柱，标注十神、藏干与纳音，并排 10 步大运。年柱以立春、月柱以节令为界。
        </p>
        <p className="mt-2 max-w-md text-[11px] leading-5 text-fg-muted">
          所有计算在浏览器本地完成，生辰不会离开你的设备；点击 AI 解读时会发送排盘结果（不含生辰）与所问事项。
        </p>
      </section>

      <BaziCalculator />

      <DisclaimerFooter />
    </PageShell>
  );
}
