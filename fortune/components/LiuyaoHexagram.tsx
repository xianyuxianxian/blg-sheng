/**
 * 六爻卦象图示：六爻自上而下排列（初爻在最下方），逐爻标注六亲、纳甲干支与世应。
 *
 * 阴阳取自装卦结果的上下经卦（`TRIGRAM_LINES`），不从起卦结果另传，
 * 避免图示与装卦数据不一致。动爻标记：○ 阳爻动、× 阴爻动（朱砂色，出现时脉冲一次）。
 */

import { TRIGRAM_LINES } from "@/lib/liuyao/guaShape";
import type { ZhuangResult } from "@/lib/liuyao/types";

/** 爻位序数：索引 0-5 自下而上 */
const YAO_POS = ["初", "二", "三", "四", "五", "上"] as const;

/** 爻位名：初九 / 九二 / 六三 / 上六（与变占取辞的爻名口径一致） */
function yaoName(index: number, yang: boolean): string {
  const num = yang ? "九" : "六";
  if (index === 0) return `初${num}`;
  if (index === 5) return `上${num}`;
  return `${num}${YAO_POS[index]}`;
}

/** 阴阳爻画：阳一长横，阴两短横；手绘感来自 `.yao-line` 的轻微不规则圆角与墨点。 */
function LineGlyph({ yang, moving }: { yang: boolean; moving: boolean }) {
  const tone = moving ? "yao-line--moving" : "";
  if (yang) {
    return (
      <span className="flex h-[6px] w-full items-center">
        <span className={`yao-line w-full ${tone}`} />
      </span>
    );
  }
  return (
    <span className="flex h-[6px] w-full items-center gap-1.5">
      <span className={`yao-line w-[46%] ${tone}`} />
      <span className={`yao-line w-[46%] ${tone}`} />
    </span>
  );
}

export type LiuyaoHexagramProps = {
  /** 装卦结果（本卦或变卦） */
  zhuang: ZhuangResult;
  /** 图示标题：本卦 / 变卦 */
  title: string;
  /** 变卦不标 ○/×，只把由动爻变来的爻画标朱色 */
  variant: "ben" | "bian";
};

/** 单卦图示：上爻在最上、初爻在最下 */
export function LiuyaoHexagram({ zhuang, title, variant }: LiuyaoHexagramProps) {
  const lines = [
    ...TRIGRAM_LINES[zhuang.xiaGua],
    ...TRIGRAM_LINES[zhuang.shangGua],
  ];
  const shiYang = lines[zhuang.shiYao];
  // 自上而下渲染：索引 5 → 0
  const order = [5, 4, 3, 2, 1, 0];

  return (
    <div className="rounded-[2px] border border-rule bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-b border-rule pb-2">
        <h3 className="font-serif text-[14px] tracking-[0.16em] text-fg">
          {title} · {zhuang.name}
        </h3>
        <span className="text-[11px] text-fg-faint">
          {zhuang.shangGua}上 {zhuang.xiaGua}下 · {zhuang.palaceGong}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-4 text-fg-faint">
        世在{yaoName(zhuang.shiYao, shiYang)}，应在
        {yaoName(zhuang.yingYao, lines[zhuang.yingYao])}
      </p>

      <p className="sr-only">
        {`${title}${zhuang.name}，${zhuang.shangGua}上${zhuang.xiaGua}下，${zhuang.palaceGong}。以下六爻自上而下排列，初爻在最下方。`}
      </p>

      <ol className="mt-1">
        {order.map((index) => {
          const yao = zhuang.yao[index];
          const yang = lines[index];
          const moving = yao.isMoving;
          const shiYing = yao.isShi ? "世" : yao.isYing ? "应" : null;
          const summary = [
            yaoName(index, yang),
            yang ? "阳爻" : "阴爻",
            yao.liuQin,
            `${yao.gan}${yao.diZhi}`,
            shiYing === "世" ? "世爻" : shiYing === "应" ? "应爻" : null,
            moving
              ? variant === "ben"
                ? yang
                  ? "动爻，阳变阴"
                  : "动爻，阴变阳"
                : "由动爻变来"
              : null,
          ]
            .filter(Boolean)
            .join("，");

          return (
            <li key={index} className="border-b border-rule-soft last:border-b-0">
              <span className="sr-only">{summary}。</span>
              <div
                aria-hidden
                className="grid grid-cols-[2.4rem_2rem_1.1rem_minmax(2.2rem,1fr)_1.1rem_1.6rem] items-center gap-x-1 py-[7px]"
              >
                <span className="font-serif text-[12px] text-fg">{yao.liuQin}</span>
                <span className="font-serif text-[12px] tracking-[0.04em] text-fg-soft">
                  {yao.gan}
                  {yao.diZhi}
                </span>
                <span className="text-[10px] leading-none">
                  {shiYing === "世" ? (
                    <span className="inline-block rounded-[1px] bg-accent px-1 py-[2px] text-on-accent">
                      世
                    </span>
                  ) : shiYing === "应" ? (
                    <span className="inline-block rounded-[1px] border border-gold px-1 py-[2px] text-fg-muted">
                      应
                    </span>
                  ) : null}
                </span>
                <LineGlyph yang={yang} moving={moving} />
                <span className="text-center font-serif text-[12px] leading-none text-accent">
                  {variant === "ben" && moving ? (
                    <span className={variant === "ben" ? "anim-pulse inline-block" : undefined}>
                      {yang ? "○" : "×"}
                    </span>
                  ) : (
                    ""
                  )}
                </span>
                <span className="text-right text-[10px] leading-none text-fg-faint">
                  {yaoName(index, yang)}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-1 border-t border-rule pt-2 text-[10px] leading-4 text-fg-faint">
        {variant === "ben"
          ? "初爻在最下，自下而上成卦；○ 阳爻动，× 阴爻动。"
          : "变卦由本卦动爻翻转而成，朱色为本卦动爻所变之爻；变卦六亲以本卦宫五行论。"}
      </p>
    </div>
  );
}
