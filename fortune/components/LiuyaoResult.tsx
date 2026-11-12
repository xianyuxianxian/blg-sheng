/**
 * 六爻结果展示：卦名 → 卦象图示（本卦 + 变卦）→ 时间起卦取数 → 朱熹变占取辞。
 *
 * 只做渲染，不取随机源、不调历法；数据全部来自 `lib/liuyao` 的起卦与变占结果。
 */

import { LiuyaoHexagram } from "@/components/LiuyaoHexagram";
import { AiInterpret } from "@/components/AiInterpret";
import type { QiGuaResult } from "@/lib/liuyao/qigua";
import type { QuZhanItem, QuZhanResult } from "@/lib/liuyao/bianZhan";
import type { LiuyaoData } from "@/lib/ai/schema";

export type LiuyaoResultProps = {
  result: QiGuaResult;
  quZhan: QuZhanResult;
  /** 起卦时刻（浏览器本地时间，已格式化） */
  castAt: string;
};

/** 取辞主次徽标：主/辅/贞/悔 */
function RoleBadge({ role }: { role: QuZhanItem["role"] }) {
  const style =
    role === "主"
      ? "border-accent bg-accent text-on-accent"
      : role === "辅"
        ? "border-accent text-accent"
        : role === "贞"
          ? "border-fg-soft text-fg-soft"
          : "border-rule text-fg-muted";
  return (
    <span
      className={`inline-block shrink-0 rounded-[1px] border px-1.5 py-[1px] text-[10px] leading-4 tracking-[0.12em] ${style}`}
    >
      {role}
    </span>
  );
}

/** 时间起卦的取数过程：把 basis 逐项摊开，便于核对口径 */
function TimeBasis({ result }: { result: QiGuaResult }) {
  const basis = result.basis;
  if (!basis) return null;

  const rows = [
    { label: "农历年支", value: `${basis.yearZhi}（${basis.yearZhiNum}）` },
    { label: "农历月", value: `${basis.lunarMonth} 月` },
    { label: "农历日", value: `${basis.lunarDay} 日` },
    { label: "时辰支", value: `${basis.timeZhi}（${basis.timeZhiNum}）` },
    { label: "上卦数", value: `${basis.shangGuaNum} · ${result.benGua.shangGua}` },
    { label: "下卦数", value: `${basis.xiaGuaNum} · ${result.benGua.xiaGua}` },
    { label: "动爻位", value: `第 ${basis.movingNum} 爻（自下而上）` },
  ];

  return (
    <section aria-labelledby="liuyao-basis-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
        <h2 id="liuyao-basis-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
          时间起卦取数
        </h2>
        <span className="shrink-0 text-[11px] text-fg-faint">梅花易数式</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="border-l border-rule pl-3">
            <dt className="text-[10px] tracking-[0.12em] text-fg-faint">{row.label}</dt>
            <dd className="mt-0.5 font-serif text-[13px] text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-[11px] leading-5 text-fg-faint">
        上卦取「年支数 + 月数 + 日数」除以 8 的余数，下卦取同一和数再加时辰数后除以 8 的余数，
        动爻取该和数除以 6 的余数（整除时分别取 8、6）。卦数按先天数：乾一、兑二、离三、震四、巽五、坎六、艮七、坤八。
      </p>
    </section>
  );
}

/**
 * AI 解读入参映射：卦名、动爻索引与六爻装卦结果。
 * 拍平装卦结构（gan + diZhi → 两字干支、isShi/isYing → 世/应），不取起卦时刻等时间信息。
 */
function buildAiData(result: QiGuaResult): LiuyaoData {
  return {
    benGua: result.benGua.name,
    bianGua: result.bianGua ? result.bianGua.name : "无变卦",
    movingLines: [...result.movingLines],
    lines: result.benGua.yao.map((yao) => ({
      ganzhi: `${yao.gan}${yao.diZhi}`,
      liuQin: yao.liuQin,
      shiYing: yao.isShi ? "世" : yao.isYing ? "应" : "",
    })),
  };
}

/** 主结果：卦象与取辞 */
export function LiuyaoResult({ result, quZhan, castAt }: LiuyaoResultProps) {
  const movingCount = result.movingLines.length;
  const methodText = result.method === "coin" ? "手动掷币" : "梅花时间起卦";

  return (
    <div className="space-y-8">
      <section aria-labelledby="liuyao-gua-heading" className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
          <h2 id="liuyao-gua-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
            卦象
          </h2>
          <span className="text-[11px] text-fg-faint">
            {methodText} · {castAt} · {movingCount === 0 ? "六爻皆静" : `动爻 ${movingCount} 爻`}
          </span>
        </div>

        {/* 成卦后卦名大字浮现（300ms 后，见 .anim-gua） */}
        <div className="anim-gua py-1 text-center">
          <p className="text-[10px] tracking-[0.4em] text-fg-faint">
            {result.method === "time" ? "梅花易数" : "三钱六掷"}
          </p>
          <p className="mt-1.5 font-serif text-[32px] leading-tight tracking-[0.18em] text-fg sm:text-[36px]">
            {result.benGua.name}
            {result.bianGua ? (
              <span className="text-fg-faint">
                <span className="mx-2 text-[0.55em] tracking-normal">之</span>
                {result.bianGua.name}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-fg-muted">
            {movingCount === 0
              ? "六爻皆静，依朱熹变占法占本卦卦辞。"
              : `动爻 ${movingCount} 爻，取辞规则见下。`}
          </p>
        </div>

        <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_1.5rem_minmax(0,1fr)]">
          <LiuyaoHexagram zhuang={result.benGua} title="本卦" variant="ben" />
          {result.bianGua ? (
            <>
              <span
                aria-hidden
                className="hidden text-center font-serif text-lg text-fg-faint sm:block"
              >
                之
              </span>
              <LiuyaoHexagram zhuang={result.bianGua} title="变卦" variant="bian" />
            </>
          ) : (
            <div className="grid min-h-[8rem] place-items-center rounded-[2px] border border-dashed border-rule p-4 sm:col-span-2">
              <p className="text-center text-[11px] leading-5 text-fg-faint">
                六爻皆静，无变卦。
                <br />
                依朱熹变占法，占本卦卦辞。
              </p>
            </div>
          )}
        </div>
      </section>

      <TimeBasis result={result} />

      <section aria-labelledby="liuyao-quzhan-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2
            id="liuyao-quzhan-heading"
            className="font-serif text-[15px] tracking-[0.18em] text-fg"
          >
            取辞
          </h2>
          <span className="shrink-0 text-[11px] text-fg-faint">朱熹《易学启蒙》变占法</span>
        </div>

        <p className="rounded-[2px] border-l-2 border-gold bg-surface-3 px-3 py-2 text-[12px] leading-6 text-fg-soft">
          {quZhan.rule}
          <span className="mt-1 block text-[10px] leading-4 text-fg-faint">
            主 = 主占之辞，辅 = 兼参之辞，贞 = 本卦，悔 = 变卦。
          </span>
        </p>

        <ol className="space-y-5">
          {quZhan.items.map((item, i) => (
            <li key={`${item.gua}-${item.kind}-${item.yaoIndex ?? "gua"}-${i}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <RoleBadge role={item.role} />
                <span className="font-serif text-[15px] tracking-[0.06em] text-fg">
                  {item.gua} · {item.guaName}
                </span>
                <span className="text-[11px] text-fg-muted">
                  {item.kind}
                  {item.yaoName ? ` · ${item.yaoName}` : ""}
                </span>
              </div>
              <p className="mt-2 text-sm leading-7 text-fg-soft">{item.text}</p>
            </li>
          ))}
        </ol>

        <p className="text-[11px] leading-5 text-fg-faint">
          仅呈现卦爻辞原文与传统标排，不做吉凶断语。
        </p>
      </section>

      <AiInterpret type="liuyao" buildData={() => buildAiData(result)} />
    </div>
  );
}
