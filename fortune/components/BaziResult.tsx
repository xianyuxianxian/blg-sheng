"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { DaYunStep, PaiPanResult, SiZhu, WuXing } from "@/lib/bazi/types";
import { WU_XING_ORDER } from "@/lib/bazi/types";
import { wuXingOfGan, wuXingOfZhi } from "@/lib/bazi/wuXing";
import { interpretWuXing, WU_XING_EXCESS_THRESHOLD } from "@/lib/bazi/interpret";
import { AiInterpret } from "@/components/AiInterpret";
import type { BaziData } from "@/lib/ai/schema";
import {
  WU_XING_EMPTY,
  WU_XING_EMPTY_HINT,
  WU_XING_INTRO,
} from "@/data/bazi-wenan";

/** 结果区所需的出生信息摘要（不传具体时刻以外的隐私字段）。 */
export type BirthSummary = {
  y: number;
  m: number;
  d: number;
  hour: number;
  minute: number;
};

export type BaziResultProps = {
  result: PaiPanResult;
  birth: BirthSummary;
  gender: "m" | "f";
};

/** 五行 → 颜色（宣纸底色上可读的克制配色，取 globals.css 的 --wu-* token）。 */
const WU_XING_COLOR: Record<WuXing, string> = {
  金: "var(--wu-jin)",
  木: "var(--wu-mu)",
  水: "var(--wu-shui)",
  火: "var(--wu-huo)",
  土: "var(--wu-tu)",
};

/** 五行圆环的 SVG 几何：半径与描边宽度。 */
const RING = { size: 200, center: 100, radius: 72, stroke: 15 };

const PILLARS = [
  { key: "year", label: "年" },
  { key: "month", label: "月" },
  { key: "day", label: "日" },
  { key: "hour", label: "时" },
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
      <h2 className="font-serif text-[15px] tracking-[0.18em] text-fg">{children}</h2>
      {hint ? <span className="shrink-0 text-[11px] text-fg-faint">{hint}</span> : null}
    </div>
  );
}

/**
 * 四柱文书区：古籍朱丝栏界格——四根竖栏由 1px 朱砂界行分隔，无卡片。
 * 干支按 `writing-mode: vertical-rl` 竖排大字（--display-xl），
 * 十神/藏干/纳音放栏底横排（340px 四栏每栏约 70px，小字竖排会折行且难读）。
 * 出现时按 80ms 逐柱淡入（CSS animation-delay，reduced-motion 时由全局规则关掉）。
 */
function SiZhuTable({ result, birth, gender }: BaziResultProps) {
  const siZhu = result.siZhu;
  const dayGan = siZhu.day.gan;

  return (
    <section aria-labelledby="sizhu-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sizhu-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
          四柱排盘
        </h2>
        {/* data-share-redact：分享图默认隐去出生年，只改克隆，不改页面 */}
        <p className="text-xs text-fg-muted">
          公历 <span data-share-redact="year">{birth.y}</span> 年 {birth.m} 月 {birth.d} 日{" "}
          {pad2(birth.hour)}:{pad2(birth.minute)} · {gender === "m" ? "男" : "女"} · 日主
          <span
            className="mx-1 font-serif text-sm font-semibold"
            style={{ color: WU_XING_COLOR[wuXingOfGan(dayGan)] }}
          >
            {dayGan}
          </span>
        </p>
      </div>

      <ol className="grid grid-cols-4 border-y border-rule-cinnabar bg-surface">
        {PILLARS.map((p, index) => {
          const pillar = siZhu[p.key];
          return (
            <li
              key={p.key}
              className="anim-pillar flex flex-col items-center border-l border-rule-cinnabar px-0.5 pb-3 pt-3 first:border-l-0 sm:px-1.5"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* 柱顶小字「年/月/日/时」；读屏补全为「年柱」 */}
              <div className="text-[10px] tracking-[0.2em] text-fg-muted">
                <span aria-hidden>{p.label}</span>
                <span className="sr-only">{p.label}柱</span>
              </div>
              {p.key === "day" ? (
                <div className="mt-1 rounded-[1px] bg-accent px-1 py-[1px] text-[9px] leading-4 tracking-[0.1em] text-on-accent">
                  日主
                </div>
              ) : (
                <div aria-hidden className="mt-1 h-[18px]" />
              )}

              {/* 干支竖排：天干在上、地支在下，思源宋 600 大字 */}
              <div
                className="vertical mt-3 font-serif font-semibold leading-none"
                style={{ fontSize: "var(--display-xl)" }}
              >
                <span style={{ color: WU_XING_COLOR[wuXingOfGan(pillar.gan)] }}>
                  {pillar.gan}
                </span>
                <span style={{ color: WU_XING_COLOR[wuXingOfZhi(pillar.zhi)] }}>
                  {pillar.zhi}
                </span>
              </div>

              {/* 十神预留固定行高：各柱十神行数不同时，栏底藏干界行仍能对齐
                  （窄视口下「正官·劫财·正印」会折成两行，故 ≤sm 预留三行） */}
              <div className="mt-2 flex min-h-[2.6em] flex-col text-center text-[10px] leading-tight text-fg-muted max-sm:min-h-[3.9em]">
                <div>{pillar.shiShenGan}</div>
                {/* 分隔符并入前一段：换行时不会出现行首「·」（「劫财·」+「正印」） */}
                <div>
                  {pillar.shiShenZhi.map((shiShen, i) => (
                    <span key={`${shiShen}-${i}`} className="whitespace-nowrap">
                      {shiShen}
                      {i < pillar.shiShenZhi.length - 1 ? "·" : ""}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-2 w-full border-t border-rule-ink pt-1.5">
                <div className="text-[9px] tracking-[0.1em] text-fg-faint">藏干</div>
                <ul className="mt-0.5 space-y-0.5">
                  {pillar.hideGan.map((gan, i) => (
                    <li
                      key={gan}
                      className="whitespace-nowrap text-[10px] leading-tight text-fg-muted"
                    >
                      <span
                        className="font-serif text-[12px]"
                        style={{ color: WU_XING_COLOR[wuXingOfGan(gan)] }}
                      >
                        {gan}
                      </span>
                      <span className="ml-0.5">{pillar.shiShenZhi[i]}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-1.5 text-[10px] leading-tight text-fg-faint">{pillar.naYin}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 五行分布：五段墨色圆环 + 图例（不引图表库）。 */
function WuXingChart({ result }: { result: PaiPanResult }) {
  const entries = WU_XING_ORDER.map((wx) => ({ wx, n: result.wuXing[wx] }));
  const total = entries.reduce((sum, { n }) => sum + n, 0);
  const missing = entries.filter(({ n }) => n === 0).map(({ wx }) => wx);
  const excess = entries
    .filter(({ n }) => n >= WU_XING_EXCESS_THRESHOLD)
    .map(({ wx }) => wx);
  const dominant = [...entries].sort((a, b) => b.n - a.n)[0];

  // 圆环按 pathLength=100 归一化：每段长度 = 占比，段间留 2.4 的缝。
  const GAP = 2.4;
  const shares = entries.map(({ n }) => (total > 0 ? (n / total) * 100 : 0));
  const arcs = entries.map(({ wx, n }, i) => ({
    wx,
    n,
    length: Math.max(shares[i] - GAP, 0),
    offset: shares.slice(0, i).reduce((sum, share) => sum + share, 0),
  }));

  return (
    <section aria-labelledby="wuxing-heading" className="space-y-4">
      <SectionTitle hint="天干 4 + 地支 4，各计 1">
        <span id="wuxing-heading">五行分布</span>
      </SectionTitle>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
        {/* 墨色圆环外裹乌丝栏窄框：环本身已验收，不动几何与配色 */}
        <div className="relative shrink-0 border border-rule-ink p-2.5">
          <svg
            viewBox={`0 0 ${RING.size} ${RING.size}`}
            className="h-[9.5rem] w-[9.5rem] font-serif"
            role="img"
            aria-label={`五行分布：${entries.map(({ wx, n }) => `${wx} ${n}`).join("，")}`}
          >
            <circle
              cx={RING.center}
              cy={RING.center}
              r={RING.radius}
              fill="none"
              stroke="var(--rule)"
              strokeWidth={RING.stroke}
            />
            {arcs.map(({ wx, n, length, offset: arcOffset }) =>
              n > 0 ? (
                <circle
                  key={wx}
                  cx={RING.center}
                  cy={RING.center}
                  r={RING.radius}
                  fill="none"
                  stroke={WU_XING_COLOR[wx]}
                  strokeWidth={RING.stroke}
                  pathLength={100}
                  strokeDasharray={`${length} ${100 - length}`}
                  strokeDashoffset={-arcOffset}
                  transform={`rotate(-90 ${RING.center} ${RING.center})`}
                />
              ) : null,
            )}
            <text
              x={RING.center}
              y={RING.center - 2}
              textAnchor="middle"
              fontSize="30"
              fill={dominant && dominant.n > 0 ? WU_XING_COLOR[dominant.wx] : "var(--fg-faint)"}
            >
              {dominant && dominant.n > 0 ? dominant.wx : "—"}
            </text>
            <text
              x={RING.center}
              y={RING.center + 18}
              textAnchor="middle"
              fontSize="10"
              letterSpacing="2"
              fill="var(--fg-faint)"
            >
              {dominant && dominant.n > 0 ? "最旺" : "未成"}
            </text>
          </svg>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 sm:max-w-[12rem] sm:grid-cols-1 sm:gap-y-1">
          {entries.map(({ wx, n }) => (
            <li key={wx} className="flex items-center gap-2 text-[12px] leading-6">
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: WU_XING_COLOR[wx] }}
              />
              <span className="font-serif text-fg">{wx}</span>
              <span className="ml-auto font-serif tabular-nums text-fg-soft">{n}</span>
              <span className="w-8 text-[10px] text-fg-faint">
                {n === 0 ? "缺" : n >= WU_XING_EXCESS_THRESHOLD ? "偏旺" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-[11px] leading-5 text-fg-muted">
        {excess.length > 0 ? `偏旺：${excess.join("、")}` : "无偏旺"}
        <span aria-hidden className="mx-2 text-fg-faint">
          |
        </span>
        {missing.length > 0 ? (
          <span className="text-accent">缺失：{missing.join("、")}</span>
        ) : (
          "无缺失"
        )}
      </p>
    </section>
  );
}

/**
 * 大运：横向可滚动时间轴，两端加卷轴轴头装饰，标出当前所在的一步。
 * 出现时把「当运」那步滚到视野中央（reduced-motion 时直接跳位，不滚动）。
 */
function DaYunAxis({
  result,
  birth,
}: {
  result: PaiPanResult;
  birth: BirthSummary;
}) {
  const currentNominalAge = new Date().getFullYear() - birth.y + 1;
  const { qiYun } = result;
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const list = track.querySelector<HTMLOListElement>("ol");
    const active = track.querySelector<HTMLElement>('[data-dayun-active="true"]');
    if (!list || !active) return;
    // 只滚这条横向时间轴：scrollIntoView 会连 window 一起滚，把四柱/五行滚出视野。
    const listRect = list.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();
    const delta =
      activeRect.left + activeRect.width / 2 - (listRect.left + listRect.width / 2);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({
      left: list.scrollLeft + delta,
      behavior: reduced ? "auto" : "smooth",
    });
  }, []);

  return (
    <section aria-labelledby="dayun-heading" className="space-y-3">
      <SectionTitle hint={`${qiYun.isForward ? "顺排" : "逆排"} · 10 步 · 左右滑动`}>
        <span id="dayun-heading">大运</span>
      </SectionTitle>

      <p className="text-[11px] leading-5 text-fg-muted">
        起运：出生后 {qiYun.startYear} 年 {qiYun.startMonth} 个月 {qiYun.startDay} 天（
        {/* 起运公历时刻可反推出生年，分享图里隐去 */}
        <span data-share-redact="derived">{qiYun.startSolar}</span>）
      </p>

      <div ref={trackRef} className="relative">
        {/* 轴头鱼尾：纯 CSS 三角对顶，置于时间轴之上（滚动后仍不被牌位遮住）；
            纯装饰，分享图里隐去 */}
        <div aria-hidden data-share-hide className="mb-1.5 flex items-center justify-between">
          <span className="fish-tail" />
          <span className="fish-tail" />
        </div>
        <ol className="flex gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin]">
          {result.daYun.map((step: DaYunStep) => {
            const active =
              currentNominalAge >= step.startAge && currentNominalAge <= step.endAge;
            return (
              <li
                key={step.index}
                data-dayun-active={active}
                className={`min-w-[5.25rem] shrink-0 rounded-[2px] border px-2 py-3 text-center ${
                  active ? "border-gold bg-surface-3" : "border-rule bg-surface-2"
                }`}
              >
                {active ? (
                  <div className="mx-auto w-fit rounded-[1px] bg-gold px-1.5 py-[1px] text-[9px] leading-4 tracking-[0.18em] text-dark-bg">
                    当运
                  </div>
                ) : (
                  <div className="text-[9px] leading-4 tracking-[0.18em] text-fg-faint">
                    第 {step.index} 步
                  </div>
                )}
                <div className="mt-2 font-serif text-lg leading-[1.15]">
                  <div style={{ color: WU_XING_COLOR[wuXingOfGan(step.gan)] }}>{step.gan}</div>
                  <div style={{ color: WU_XING_COLOR[wuXingOfZhi(step.zhi)] }}>{step.zhi}</div>
                </div>
                <div className="mt-2 text-[10px] leading-tight text-fg-soft">
                  {step.startAge}–{step.endAge} 岁
                </div>
                {/* 大运年份区间保留：裁决是「大运可读性优先」，分享图只隐出生年份 */}
                <div className="text-[9px] leading-tight text-fg-muted">
                  {step.startYear}–{step.endYear}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

/** 解读：只展示有把握的组合，其余显示「暂无解读」。 */
function Interpretation({ result }: { result: PaiPanResult }) {
  const paragraphs = interpretWuXing(result.wuXing);

  return (
    <section aria-labelledby="interpret-heading" className="space-y-3">
      <SectionTitle hint="规则式，非 AI">
        <span id="interpret-heading">五行取象</span>
      </SectionTitle>
      <p className="text-[11px] leading-5 text-fg-faint">{WU_XING_INTRO}</p>

      {paragraphs.length > 0 ? (
        <div className="space-y-3">
          {paragraphs.map((text) => (
            <p key={text} className="text-sm leading-7 text-fg-soft">
              {text}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-serif text-sm text-fg-soft">{WU_XING_EMPTY}</p>
          <p className="text-[11px] leading-5 text-fg-faint">{WU_XING_EMPTY_HINT}</p>
        </div>
      )}
    </section>
  );
}

/** AI 解读入参映射：只取干支字符串、五行计数与大运干支，不含任何生辰数字。 */
function buildAiData(result: PaiPanResult): BaziData {
  const pillar = (siZhu: SiZhu) => `${siZhu.gan}${siZhu.zhi}`;
  return {
    siZhu: {
      year: pillar(result.siZhu.year),
      month: pillar(result.siZhu.month),
      day: pillar(result.siZhu.day),
      hour: pillar(result.siZhu.hour),
    },
    wuXing: { ...result.wuXing },
    // schema 上限 12：当前固定 10 步，截断只为挡住将来加长时整单 400
    daYun: result.daYun.slice(0, 12).map((step) => `${step.gan}${step.zhi}`),
  };
}

/** 排盘口径：原样展示计算层给出的 note。 */
function Notes({ note }: { note: string[] }) {
  return (
    <section aria-labelledby="notes-heading" data-share-redact="dates" className="space-y-3">
      <SectionTitle>
        <span id="notes-heading">排盘口径</span>
      </SectionTitle>
      <ul className="space-y-1.5">
        {note.map((line) => (
          <li key={line} className="flex gap-2 text-[11px] leading-5 text-fg-muted">
            <span aria-hidden className="text-gold">
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 八字结果面板：纯展示，计算与输入在 BaziCalculator 中完成。 */
export function BaziResult(props: BaziResultProps) {
  return (
    <div className="space-y-10 divide-y divide-rule-ink [&>section]:pt-8 [&>section:first-child]:pt-0">
      <SiZhuTable {...props} />
      <WuXingChart result={props.result} />
      <DaYunAxis result={props.result} birth={props.birth} />
      <Interpretation result={props.result} />
      <AiInterpret type="bazi" buildData={() => buildAiData(props.result)} />
      <Notes note={props.result.note} />
    </div>
  );
}
