import type { Metadata } from "next";
import { LiuyaoCast } from "@/components/LiuyaoCast";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "六爻起卦",
  description:
    "三枚铜钱掷六次起卦，或按此刻时间起卦：自下而上成卦，标注六亲、纳甲干支与世应，并按朱熹变占法取辞。所有计算在浏览器本地完成。",
};

export default function LiuyaoPage() {
  return (
    <PageShell wide>
      <section className="py-10 sm:py-12">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-[11px] tracking-[0.35em] text-fg-faint">
              <span aria-hidden className="coin coin--zi h-3 w-3 !border-[0.5px]">
                <span className="coin-hole !h-1 !w-1" />
              </span>
              三钱六掷 · 纳甲装卦
            </p>
            <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-fg sm:text-4xl">
              六爻起卦
            </h1>
          </div>
          <span
            aria-hidden
            className="mt-1 grid h-12 w-12 shrink-0 place-items-center border border-accent bg-accent font-serif text-[13px] leading-[1.1] text-on-accent"
          >
            六
            <br />
            爻
          </span>
        </div>

        <p className="mt-5 max-w-md text-sm leading-7 text-fg-soft">
          三枚铜钱掷六次成卦，或按此刻起卦。六爻自下而上，逐爻标注六亲、纳甲干支与世应，
          动爻标 ○ / ×，并按朱熹变占法取辞。
        </p>
        <p className="mt-2 max-w-md text-[11px] leading-5 text-fg-faint">
          排盘在本地完成，你的问题不会上传；点击 AI 解读时除外。
        </p>
      </section>

      <LiuyaoCast />

      <DisclaimerFooter note="多爻动取辞采用朱熹《易学启蒙》变占法；时间起卦为梅花易数式，23 点后归次日。" />
    </PageShell>
  );
}
