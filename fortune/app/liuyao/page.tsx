import type { Metadata } from "next";
import Link from "next/link";
import { LiuyaoCast } from "@/components/LiuyaoCast";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `六爻起卦 · ${SITE_NAME}`,
  description:
    "三枚铜钱掷六次起卦，或按此刻时间起卦：自下而上成卦，标注六亲、纳甲干支与世应，并按朱熹变占法取辞。所有计算在浏览器本地完成。",
};

export default function LiuyaoPage() {
  return (
    <div className="min-h-screen border-t-2 border-[#a63a2c] bg-[#f7f2e7] text-[#26221b]">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-5 pb-10 pt-6 sm:px-8 sm:pt-8">
        <header className="flex items-center justify-between border-b border-[#ddd2bb] pb-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-sm tracking-[0.2em] text-[#3f382d] transition-colors hover:text-[#a63a2c]"
          >
            <span
              aria-hidden
              className="grid h-6 w-6 place-items-center bg-[#a63a2c] font-serif text-[13px] leading-none text-[#fbf6ec]"
            >
              命
            </span>
            <span className="font-serif">{SITE_NAME}</span>
          </Link>
          <Link
            href="/about"
            className="text-[11px] tracking-[0.15em] text-[#6f6451] transition-colors hover:text-[#a63a2c]"
          >
            关于
          </Link>
        </header>

        <main className="flex-1">
          <section className="py-10 sm:py-12">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[11px] tracking-[0.35em] text-[#786c57]">三钱六掷 · 纳甲装卦</p>
                <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-[#26221b] sm:text-4xl">
                  六爻起卦
                </h1>
              </div>
              <span
                aria-hidden
                className="mt-1 grid h-12 w-12 shrink-0 place-items-center border border-[#a63a2c] bg-[#a63a2c] font-serif text-[13px] leading-[1.1] text-[#fbf6ec]"
              >
                六
                <br />
                爻
              </span>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-[#5b5344]">
              三枚铜钱掷六次成卦，或按此刻起卦。六爻自下而上，逐爻标注六亲、纳甲干支与世应，
              动爻标 ○ / ×，并按朱熹变占法取辞。
            </p>
            <p className="mt-2 max-w-md text-[11px] leading-5 text-[#786c57]">
              起卦与装卦全部在浏览器本地完成，你的问题不会被记录或上传。
            </p>
          </section>

          <LiuyaoCast />
        </main>

        <footer className="mt-14 border-t border-[#ddd2bb] pt-5 text-[11px] leading-6 text-[#6f6451]">
          <p>本工具仅供传统文化参考与娱乐，不构成任何决策建议。</p>
          <p className="mt-1">
            多爻动取辞采用朱熹《易学启蒙》变占法；时间起卦为梅花易数式，23 点后归次日。
          </p>
          <p className="mt-1">
            <Link
              href="/about"
              className="underline decoration-[#c0b294] underline-offset-4 hover:text-[#a63a2c]"
            >
              了解起卦口径、隐私说明与免责声明
            </Link>
          </p>
          <p className="mt-3 tracking-[0.2em] text-[#786c57]">{SITE_NAME}</p>
        </footer>
      </div>
    </div>
  );
}
