import type { ReactNode } from "react";
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

/** 五行 → 颜色（宣纸底色上可读的克制配色）。 */
const WU_XING_COLOR: Record<WuXing, string> = {
  金: "#a07a33",
  木: "#4d6f47",
  水: "#37606f",
  火: "#a63a2c",
  土: "#8a6a44",
};

const PILLARS = [
  { key: "year", label: "年柱" },
  { key: "month", label: "月柱" },
  { key: "day", label: "日柱" },
  { key: "hour", label: "时柱" },
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#e3d9c5] pb-2">
      <h2 className="font-serif text-[15px] tracking-[0.18em] text-[#2b2620]">{children}</h2>
      {hint ? <span className="shrink-0 text-[11px] text-[#786c57]">{hint}</span> : null}
    </div>
  );
}

/** 四柱排盘表：干支按五行上色，十神以日干为参照。 */
function SiZhuTable({ result, birth, gender }: BaziResultProps) {
  const siZhu = result.siZhu;
  const dayGan = siZhu.day.gan;

  return (
    <section aria-labelledby="sizhu-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="sizhu-heading" className="font-serif text-[15px] tracking-[0.18em]">
          四柱排盘
        </h2>
        {/* data-share-redact：分享图默认隐去出生年，只改克隆，不改页面 */}
        <p className="text-xs text-[#6f6451]">
          公历 <span data-share-redact="year">{birth.y}</span> 年 {birth.m} 月 {birth.d} 日{" "}
          {pad2(birth.hour)}:{pad2(birth.minute)} ·{" "}
          {gender === "m" ? "男" : "女"} · 日主
          <span
            className="mx-1 font-serif text-sm font-semibold"
            style={{ color: WU_XING_COLOR[wuXingOfGan(dayGan)] }}
          >
            {dayGan}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-[2.5rem_repeat(4,minmax(0,1fr))] items-start gap-x-1 gap-y-4">
        <div aria-hidden />
        {PILLARS.map((p) => (
          <div key={`h-${p.key}`} className="text-center">
            <div className="text-[11px] tracking-[0.2em] text-[#6f6451]">{p.label}</div>
            {p.key === "day" ? (
              <div className="mt-1 inline-block rounded-[2px] bg-[#a63a2c] px-1 py-[1px] text-[9px] leading-4 tracking-[0.1em] text-[#fbf6ec]">
                日主
              </div>
            ) : null}
          </div>
        ))}

        <div className="pt-1 text-[10px] tracking-[0.15em] text-[#786c57]">天干</div>
        {PILLARS.map((p) => {
          const pillar = siZhu[p.key];
          return (
            <div key={`gan-${p.key}`} className="flex flex-col items-center gap-1">
              <span
                className="font-serif text-[26px] leading-none"
                style={{ color: WU_XING_COLOR[wuXingOfGan(pillar.gan)] }}
              >
                {pillar.gan}
              </span>
              <span className="text-[10px] leading-none text-[#6f6451]">{pillar.shiShenGan}</span>
            </div>
          );
        })}

        <div className="pt-1 text-[10px] tracking-[0.15em] text-[#786c57]">地支</div>
        {PILLARS.map((p) => {
          const pillar = siZhu[p.key];
          return (
            <div key={`zhi-${p.key}`} className="flex flex-col items-center gap-1">
              <span
                className="font-serif text-[26px] leading-none"
                style={{ color: WU_XING_COLOR[wuXingOfZhi(pillar.zhi)] }}
              >
                {pillar.zhi}
              </span>
              <span className="text-center text-[10px] leading-tight text-[#6f6451]">
                {pillar.shiShenZhi.join(" · ")}
              </span>
            </div>
          );
        })}

        <div className="pt-1 text-[10px] tracking-[0.15em] text-[#786c57]">藏干</div>
        {PILLARS.map((p) => {
          const pillar = siZhu[p.key];
          return (
            <div key={`hide-${p.key}`} className="flex flex-col items-center gap-0.5">
              {pillar.hideGan.map((gan, i) => (
                <span
                  key={gan}
                  className="whitespace-nowrap text-[10px] leading-tight text-[#6f6451]"
                >
                  <span
                    className="font-serif text-[13px]"
                    style={{ color: WU_XING_COLOR[wuXingOfGan(gan)] }}
                  >
                    {gan}
                  </span>
                  <span className="ml-1">{pillar.shiShenZhi[i]}</span>
                </span>
              ))}
            </div>
          );
        })}

        <div className="pt-1 text-[10px] tracking-[0.15em] text-[#786c57]">纳音</div>
        {PILLARS.map((p) => (
          <div key={`nayin-${p.key}`} className="text-center text-[11px] leading-5 text-[#5b5344]">
            {siZhu[p.key].naYin}
          </div>
        ))}
      </div>
    </section>
  );
}

/** 五行分布：内联 SVG 条形图（不引图表库）。 */
function WuXingChart({ result }: { result: PaiPanResult }) {
  const entries = WU_XING_ORDER.map((wx) => ({ wx, n: result.wuXing[wx] }));
  const missing = entries.filter(({ n }) => n === 0).map(({ wx }) => wx);
  const excess = entries
    .filter(({ n }) => n >= WU_XING_EXCESS_THRESHOLD)
    .map(({ wx }) => wx);
  const max = 8;
  const trackX = 34;
  const trackW = 250;
  const trackH = 12;
  const rowH = 34;

  return (
    <section aria-labelledby="wuxing-heading" className="space-y-4">
      <SectionTitle hint="天干 4 + 地支 4，各计 1">
        <span id="wuxing-heading">五行分布</span>
      </SectionTitle>

      <div className="flex flex-col gap-4">
        <svg
          viewBox={`0 0 ${trackX + trackW + 26} ${rowH * entries.length + 8}`}
          className="h-auto w-full max-w-[340px] font-serif"
          role="img"
          aria-label={`五行分布：${entries.map(({ wx, n }) => `${wx} ${n}`).join("，")}`}
        >
          {entries.map(({ wx, n }, i) => {
            const y = i * rowH + 6;
            const w = Math.max((n / max) * trackW, n > 0 ? 3 : 0);
            return (
              <g key={wx}>
                <text x={0} y={y + trackH - 1} fontSize={13} fill="#3a342b">
                  {wx}
                </text>
                <rect
                  x={trackX}
                  y={y}
                  width={trackW}
                  height={trackH}
                  rx={1}
                  fill="#e9e0ce"
                />
                {w > 0 ? (
                  <rect x={trackX} y={y} width={w} height={trackH} rx={1} fill={WU_XING_COLOR[wx]} />
                ) : null}
                <text
                  x={trackX + trackW + 10}
                  y={y + trackH - 1}
                  fontSize={12}
                  fill={n === 0 ? "#a63a2c" : "#5b5344"}
                  textAnchor="middle"
                >
                  {n}
                </text>
              </g>
            );
          })}
        </svg>

        <ul className="sr-only">
          {entries.map(({ wx, n }) => (
            <li key={wx}>
              {wx} {n}
            </li>
          ))}
        </ul>

        <p className="text-[11px] leading-5 text-[#6f6451]">
          {excess.length > 0 ? `偏旺：${excess.join("、")}` : "无偏旺"}
          <span aria-hidden className="mx-2 text-[#c0b294]">
            |
          </span>
          {missing.length > 0 ? (
            <span className="text-[#a63a2c]">缺失：{missing.join("、")}</span>
          ) : (
            "无缺失"
          )}
        </p>
      </div>
    </section>
  );
}

/** 大运：横向可滚动时间轴，标出当前所在的一步。 */
function DaYunAxis({
  result,
  birth,
}: {
  result: PaiPanResult;
  birth: BirthSummary;
}) {
  const currentNominalAge = new Date().getFullYear() - birth.y + 1;
  const { qiYun } = result;

  return (
    <section aria-labelledby="dayun-heading" className="space-y-3">
      <SectionTitle hint={`${qiYun.isForward ? "顺排" : "逆排"} · 10 步 · 左右滑动`}>
        <span id="dayun-heading">大运</span>
      </SectionTitle>

      <p className="text-[11px] leading-5 text-[#6f6451]">
        起运：出生后 {qiYun.startYear} 年 {qiYun.startMonth} 个月 {qiYun.startDay} 天（
        {/* 起运公历时刻可反推出生年，分享图里隐去 */}
        <span data-share-redact="derived">{qiYun.startSolar}</span>）
      </p>

      <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:thin]">
        {result.daYun.map((step: DaYunStep) => {
          const active =
            currentNominalAge >= step.startAge && currentNominalAge <= step.endAge;
          return (
            <li
              key={step.index}
              className={`min-w-[5.25rem] shrink-0 rounded-[2px] border px-2 py-3 text-center ${
                active
                  ? "border-[#a63a2c] bg-[#fbf2ec]"
                  : "border-[#ddd2bb] bg-[#fdfaf2]"
              }`}
            >
              <div
                className={`text-[9px] tracking-[0.18em] ${
                  active ? "text-[#a63a2c]" : "text-[#786c57]"
                }`}
              >
                {active ? "当运" : `第 ${step.index} 步`}
              </div>
              <div className="mt-2 font-serif text-lg leading-[1.15]">
                <div style={{ color: WU_XING_COLOR[wuXingOfGan(step.gan)] }}>{step.gan}</div>
                <div style={{ color: WU_XING_COLOR[wuXingOfZhi(step.zhi)] }}>{step.zhi}</div>
              </div>
              <div className="mt-2 text-[10px] leading-tight text-[#5b5344]">
                {step.startAge}–{step.endAge} 岁
              </div>
              {/* 大运年份区间保留：裁决是「大运可读性优先」，分享图只隐出生年份 */}
              <div className="text-[9px] leading-tight text-[#786c57]">
                {step.startYear}–{step.endYear}
              </div>
            </li>
          );
        })}
      </ol>
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
      <p className="text-[11px] leading-5 text-[#786c57]">{WU_XING_INTRO}</p>

      {paragraphs.length > 0 ? (
        <div className="space-y-3">
          {paragraphs.map((text) => (
            <p key={text} className="text-sm leading-7 text-[#3f382d]">
              {text}
            </p>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          <p className="font-serif text-sm text-[#3f382d]">{WU_XING_EMPTY}</p>
          <p className="text-[11px] leading-5 text-[#786c57]">{WU_XING_EMPTY_HINT}</p>
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
    <section
      aria-labelledby="notes-heading"
      data-share-redact="dates"
      className="space-y-3"
    >
      <SectionTitle>
        <span id="notes-heading">排盘口径</span>
      </SectionTitle>
      <ul className="space-y-1.5">
        {note.map((line) => (
          <li key={line} className="flex gap-2 text-[11px] leading-5 text-[#6f6451]">
            <span aria-hidden className="text-[#c0b294]">
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
    <div className="space-y-10 divide-y divide-[#e3d9c5] [&>section]:pt-8 [&>section:first-child]:pt-0">
      <SiZhuTable {...props} />
      <WuXingChart result={props.result} />
      <DaYunAxis result={props.result} birth={props.birth} />
      <Interpretation result={props.result} />
      <AiInterpret type="bazi" buildData={() => buildAiData(props.result)} />
      <Notes note={props.result.note} />
    </div>
  );
}
