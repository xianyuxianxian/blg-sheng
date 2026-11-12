/**
 * 六爻卦象图示：六爻自上而下排列（初爻在最下方），逐爻标注六亲、纳甲干支与世应。
 *
 * 阴阳取自装卦结果的上下经卦（`TRIGRAM_LINES`），不从起卦结果另传，
 * 避免图示与装卦数据不一致。动爻标记：○ 阳爻动、× 阴爻动（朱砂色，出现时脉冲一次）。
 *
 * 版式（古籍排盘）：外框朱丝栏，装卦标注区用乌丝栏分栏——六亲/世应 | 纳甲干支 | 爻线，
 * 界线对齐爻线，爻线按真实爻画比例撑满栏宽（阳整条、阴两段带 gap）。
 */

import { TRIGRAM_LINES } from "@/lib/liuyao/guaShape";
import { hexagramSymbol } from "@/components/hexagram-symbol";
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

/** 阴阳爻画：阳一长横，阴两段带 gap；8px 大字量，宽度撑满栏。 */
function LineGlyph({ yang, moving }: { yang: boolean; moving: boolean }) {
  const tone = moving ? "yao-line--moving" : "";
  if (yang) {
    return (
      <span className="flex h-[8px] w-full items-center">
        <span className={`yao-line yao-line--lg w-full ${tone}`} />
      </span>
    );
  }
  return (
    <span className="flex h-[8px] w-full items-center gap-[9%]">
      <span className={`yao-line yao-line--lg flex-1 ${tone}`} />
      <span className={`yao-line yao-line--lg flex-1 ${tone}`} />
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
    <div className="border border-rule-cinnabar bg-surface p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-rule-cinnabar pb-2">
        <h3 className="flex items-center gap-2 font-serif text-[14px] tracking-[0.16em] text-fg">
          {/* 卦符是装饰图形，卦名文本已承担语义 */}
          <span aria-hidden className="hexagram-glyph text-[22px] leading-none text-accent">
            {hexagramSymbol(zhuang.shangGua, zhuang.xiaGua)}
          </span>
          <span>
            {title} · {zhuang.name}
          </span>
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

      <ol className="mt-2 border-t border-rule-ink">
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
            <li key={index} className="border-b border-rule-ink last:border-b-0">
              <span className="sr-only">{summary}。</span>
              <div
                aria-hidden
                className="grid grid-cols-[3.3rem_2.9rem_minmax(0,1fr)_1.1rem_1.7rem] items-center sm:grid-cols-[minmax(0,3fr)_minmax(0,2.6fr)_minmax(0,5fr)_minmax(0,1fr)_minmax(0,2fr)]"
              >
                <span className="flex items-center gap-1 py-[9px] font-serif text-[12px] text-fg">
                  {yao.liuQin}
                  {shiYing === "世" ? (
                    <span className="rounded-[1px] bg-accent px-0.5 py-[1px] text-[9px] leading-none text-on-accent">
                      世
                    </span>
                  ) : shiYing === "应" ? (
                    <span className="border border-gold px-0.5 py-[1px] text-[9px] leading-none text-fg-muted">
                      应
                    </span>
                  ) : null}
                </span>
                <span className="border-l border-rule-ink py-[9px] pl-1.5 font-serif text-[12px] text-fg-soft">
                  {yao.gan}
                  {yao.diZhi}
                </span>
                <span className="border-l border-rule-ink py-[9px] pl-2 pr-1">
                  <LineGlyph yang={yang} moving={moving} />
                </span>
                <span className="text-center font-serif text-[12px] leading-none text-accent">
                  {variant === "ben" && moving ? (
                    <span className="anim-pulse inline-block">{yang ? "○" : "×"}</span>
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

      <p className="mt-2 border-t border-rule-ink pt-2 text-[10px] leading-4 text-fg-faint">
        {variant === "ben"
          ? "初爻在最下，自下而上成卦；○ 阳爻动，× 阴爻动。"
          : "变卦由本卦动爻翻转而成，朱色为本卦动爻所变之爻；变卦六亲以本卦宫五行论。"}
      </p>
    </div>
  );
}
