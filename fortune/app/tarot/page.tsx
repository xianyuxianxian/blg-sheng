import type { Metadata } from "next";
import Link from "next/link";
import { TarotSpread } from "@/components/TarotSpread";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `塔罗牌阵 · ${SITE_NAME}`,
  description:
    "从 78 张韦特塔罗中抽取三张，按过去、现在、未来解读牌面与正逆位。洗牌与抽牌全部在浏览器本地完成。",
};

export default function TarotPage() {
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
                <p className="text-[11px] tracking-[0.35em] text-[#786c57]">
                  七十八张韦特 · 正逆位
                </p>
                <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-[#26221b] sm:text-4xl">
                  塔罗牌阵
                </h1>
              </div>
              <span
                aria-hidden
                className="mt-1 grid h-12 w-12 shrink-0 place-items-center border border-[#a63a2c] bg-[#a63a2c] font-serif text-[13px] leading-[1.1] text-[#fbf6ec]"
              >
                塔
                <br />
                罗
              </span>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-[#5b5344]">
              选一个牌阵，洗牌后抽牌。三张阵从左到右依次是过去、现在与未来，每张牌标注正位或逆位，并给出对应解读。
            </p>
            <p className="mt-2 max-w-md text-[11px] leading-5 text-[#786c57]">
              洗牌与抽牌都在你的浏览器中完成，你的问题不会被记录或上传。
            </p>
          </section>

          <TarotSpread />
        </main>

        <footer className="mt-14 border-t border-[#ddd2bb] pt-5 text-[11px] leading-6 text-[#6f6451]">
          <p>本工具仅供传统文化参考与娱乐，不构成任何决策建议。</p>
          <p className="mt-1">
            <Link href="/about" className="underline decoration-[#c0b294] underline-offset-4 hover:text-[#a63a2c]">
              了解抽牌口径、隐私说明与免责声明
            </Link>
          </p>
          <p className="mt-3 tracking-[0.2em] text-[#786c57]">{SITE_NAME}</p>
        </footer>
      </div>
    </div>
  );
}
