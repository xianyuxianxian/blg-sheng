import type { Metadata } from "next";
import { TarotSpread } from "@/components/TarotSpread";
import { DisclaimerFooter } from "@/components/DisclaimerFooter";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "塔罗牌阵",
  description:
    "从 78 张韦特塔罗中抽取三张，按过去、现在、未来解读牌面与正逆位。洗牌与抽牌全部在浏览器本地完成。",
};

export default function TarotPage() {
  return (
    /* 全站唯一深色页：把 body 底色也切到深底，滚动条与回弹区不露白（不做全站暗色）；
       skin-tarot 挂在最外层，PageShell 的语义 token 在克隆/皮肤层继续解析为深底墨金 */
    <div className="skin-tarot relative">
      <style>{"html,body{background-color:var(--dark-bg)}"}</style>
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-dark-bg" />
      <PageShell wide>
        <section className="py-10 sm:py-12">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-[11px] tracking-[0.35em] text-fg-muted">
                七十八张韦特 · 正逆位
              </p>
              <h1 className="mt-3 font-serif text-3xl tracking-[0.12em] text-fg sm:text-4xl">
                塔罗牌阵
              </h1>
            </div>
            <span
              aria-hidden
              className="mt-1 grid h-12 w-12 shrink-0 place-items-center border border-gold font-serif text-[13px] leading-[1.1] text-gold"
            >
              塔
              <br />
              罗
            </span>
          </div>

          <p className="mt-5 max-w-md text-sm leading-7 text-fg-soft">
            选一个牌阵，洗牌后抽牌。三张阵从左到右依次是过去、现在与未来，每张牌标注正位或逆位，并给出对应解读。
          </p>
          <p className="mt-2 max-w-md text-[11px] leading-5 text-fg-muted">
            排盘在本地完成，你的问题不会上传；点击 AI 解读时除外。
          </p>
        </section>

        <TarotSpread />

        <DisclaimerFooter />
      </PageShell>
    </div>
  );
}
