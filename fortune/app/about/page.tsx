import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { SITE_NAME } from "@/config/site";
import {
  DISCLAIMER_POINTS,
  METHOD_NOTES,
  PRIVACY_POINTS,
  PRODUCT_INTRO,
  type CopyPoint,
} from "@/data/disclaimer";

export const metadata: Metadata = {
  title: "关于本站",
  description:
    "产品介绍、隐私说明、排盘口径与完整免责声明：所有排盘在浏览器本地完成，不收集任何数据，结果只作传统文化参考。",
};

/** 关于页分节：居中序号 + 标题 + 正文 */
function Section({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[#ddd2bb] py-8">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-[11px] tracking-[0.2em] text-[#a63a2c]">{index}</span>
        <h2 className="font-serif text-lg tracking-[0.1em] text-[#26221b]">{title}</h2>
      </div>
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

/** 小节条目列表 */
function PointList({ points }: { points: readonly CopyPoint[] }) {
  return (
    <>
      {points.map((point) => (
        <div key={point.title}>
          <p className="text-[13px] font-medium tracking-[0.04em] text-[#3f382d]">{point.title}</p>
          <p className="mt-1 text-[13px] leading-7 text-[#5b5344]">{point.body}</p>
        </div>
      ))}
    </>
  );
}

export default function AboutPage() {
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
            href="/"
            className="text-[11px] tracking-[0.15em] text-[#6f6451] transition-colors hover:text-[#a63a2c]"
          >
            返回首页
          </Link>
        </header>

        <main className="flex-1">
          <section className="py-10 sm:py-12">
            <p className="text-[11px] tracking-[0.35em] text-[#786c57]">关于 · 隐私 · 口径</p>
            <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-[#26221b] sm:text-4xl">
              关于本站
            </h1>
            {PRODUCT_INTRO.map((paragraph) => (
              <p key={paragraph} className="mt-5 max-w-lg text-sm leading-7 text-[#5b5344]">
                {paragraph}
              </p>
            ))}
          </section>

          <Section index="一" title="隐私说明">
            <PointList points={PRIVACY_POINTS} />
          </Section>

          <Section index="二" title="排盘口径">
            <p className="text-[13px] leading-7 text-[#5b5344]">
              下面每一条都对应页面上可见的推导过程。口径与你的师承不同时，以你采用的规则为准。
            </p>
            <dl className="flex flex-col gap-4">
              {METHOD_NOTES.map((note) => (
                <div key={note.title}>
                  <dt className="text-[13px] font-medium tracking-[0.04em] text-[#3f382d]">
                    {note.title}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-7 text-[#5b5344]">{note.body}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section index="三" title="免责声明">
            <PointList points={DISCLAIMER_POINTS} />
          </Section>
        </main>

        <footer className="mt-12 border-t border-[#ddd2bb] pt-5 text-[11px] leading-6 text-[#6f6451]">
          <p>
            <Link
              href="/"
              className="underline decoration-[#c0b294] underline-offset-4 hover:text-[#a63a2c]"
            >
              回到首页
            </Link>
          </p>
          <p className="mt-3 tracking-[0.2em] text-[#786c57]">{SITE_NAME}</p>
        </footer>
      </div>
    </div>
  );
}
