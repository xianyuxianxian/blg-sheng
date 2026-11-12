"use client";

/**
 * 六爻起卦交互：手动掷币（六次，自初爻向上）与时间起卦（按点击时刻）。
 *
 * lunar 隔离：`lib/liuyao/qigua.ts` 顶部静态引入 lunar-typescript（时间起卦用），
 * 因此本组件**不静态引入 qigua**，两条路径都在点击回调里 `await import()`，
 * 历法引擎只在真正起卦时才下载，且不进入首屏 bundle。类型用 `import type`，编译期即抹除。
 *
 * 问事前置：起卦前必须选类别（传统一事一占）；未选时掷币/起卦按钮禁用。
 */

import { useEffect, useRef, useState } from "react";
import { LiuyaoResult } from "@/components/LiuyaoResult";
import { QuestionBanner, QuestionProvider, type Question } from "@/components/QuestionContext";
import { TopicPicker } from "@/components/TopicPicker";
import { topicActionLabel } from "@/components/topic-label";
import { BEI_FACE, ZI_FACE, type CoinFace } from "@/lib/liuyao/coins";
import { randomInt } from "@/lib/random";
import type { Topic } from "@/lib/ai/schema";
import type { QiGuaResult } from "@/lib/liuyao/qigua";
import type { QuZhanResult } from "@/lib/liuyao/bianZhan";

type Method = "coin" | "time";

/** 一次掷币：3 枚铜钱的面值（编码见 `lib/liuyao/coins`：3 = 字、2 = 背） */
type Toss = CoinFace[];

type Outcome = {
  result: QiGuaResult;
  quZhan: QuZhanResult;
  /** 起卦时刻（本地时间，已格式化） */
  castAt: string;
  /** 起卦时定格的所问（事项 + 补充语）。 */
  question: Question;
};

/** 爻位名（自下而上） */
const YAO_LABELS = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"] as const;

/** 爻数 → 名称（6 老阴 / 7 少阳 / 8 少阴 / 9 老阳，与起卦结果同口径） */
const YAO_SHU_NAME: Record<number, string> = {
  6: "老阴",
  7: "少阳",
  8: "少阴",
  9: "老阳",
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** 起卦时刻文本：YYYY-MM-DD HH:mm（本地时间，不依赖 locale） */
function formatMoment(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(
    date.getHours(),
  )}:${pad2(date.getMinutes())}`;
}

/** 掷一次：三枚铜钱，字/背各半（随机源统一走 `lib/random`） */
function tossCoins(): Toss {
  return [0, 1, 2].map(() => (randomInt(2) === 0 ? ZI_FACE : BEI_FACE));
}

/**
 * 仅供掷币台即时画爻：字数偶数 → 阳爻（0 字老阳、2 字少阳），奇数 → 阴爻。
 * 与 `lib/liuyao/qigua.ts` 的 BY_ZI_COUNT 同口径；这里只决定线条形状，不产出卦象。
 */
function isYangToss(toss: Toss): boolean {
  return toss.filter((face) => face === ZI_FACE).length % 2 === 0;
}

/** 掷币起卦：动态引入起卦与变占模块；`moment` 为掷满第六爻的时刻 */
async function castByCoin(tosses: Toss[], moment: Date): Promise<Omit<Outcome, "question">> {
  const [{ qiGuaByCoin }, { bianZhan }] = await Promise.all([
    import("@/lib/liuyao/qigua"),
    import("@/lib/liuyao/bianZhan"),
  ]);
  const result = qiGuaByCoin(tosses);
  return {
    result,
    quZhan: bianZhan(result.benGua, result.bianGua, result.movingLines),
    castAt: formatMoment(moment),
  };
}

/** 时间起卦：以点击时刻取数（`Date` 在 await 之前捕获，避免加载耗时改变时刻） */
async function castByTime(moment: Date): Promise<Omit<Outcome, "question">> {
  const [{ qiGuaByTime }, { bianZhan }] = await Promise.all([
    import("@/lib/liuyao/qigua"),
    import("@/lib/liuyao/bianZhan"),
  ]);
  const result = qiGuaByTime(moment);
  return {
    result,
    quZhan: bianZhan(result.benGua, result.bianGua, result.movingLines),
    castAt: formatMoment(moment),
  };
}

/** 一枚铜钱：外圆 + 中央方孔，字/背以字形与颜色双重区分（不刻真实年号）。 */
function Coin({ face }: { face: CoinFace }) {
  const isZi = face === ZI_FACE;
  return (
    <span className={`coin h-7 w-7 sm:h-8 sm:w-8 ${isZi ? "coin--zi" : "coin--bei"}`}>
      <span aria-hidden className="coin-hole h-2 w-2 !border-[1.5px]" />
      <span aria-hidden className="coin-face">
        {isZi ? "字" : "背"}
      </span>
    </span>
  );
}

/** 一根爻线（只画阴阳；动爻由结果区标注）。整根线从中心向两侧生长。 */
function YaoLine({ yang, animate }: { yang: boolean; animate: boolean }) {
  const cls = animate ? "anim-line" : "";
  if (yang) {
    return (
      <span className={`flex h-[6px] w-full items-center justify-center ${cls}`}>
        <span className="yao-line w-full" />
      </span>
    );
  }
  return (
    <span className={`flex h-[6px] w-full items-center justify-center gap-1 ${cls}`}>
      <span className="yao-line w-[42%]" />
      <span className="yao-line w-[42%]" />
    </span>
  );
}

/**
 * 掷币台：六行自上而下（上爻在最上），未掷的爻显示为待掷。
 * 每次落定，该行的爻线从中心向两侧长出（本页的灵魂交互）。
 */
function CoinBoard({ tosses, yaoShu }: { tosses: Toss[]; yaoShu?: number[] }) {
  const order = [5, 4, 3, 2, 1, 0];
  const lastIndex = tosses.length - 1;

  return (
    <ol aria-label="掷币记录，自上而下排列" className="space-y-1">
      {order.map((index) => {
        const toss = tosses[index];
        const isLatest = index === lastIndex;
        const name = yaoShu?.[index];
        const faces = toss
          ? toss.map((face) => (face === ZI_FACE ? "字" : "背")).join("、")
          : "待掷";
        const yaoText =
          name !== undefined
            ? `，${YAO_SHU_NAME[name]}${name === 6 || name === 9 ? "，动爻" : ""}`
            : "";

        return (
          <li key={index} className="rounded-[1px]">
            {/* 读屏：一行一句话，避免字形与图形重复播报 */}
            <span className="sr-only">
              {`第 ${index + 1} 掷（${YAO_LABELS[index]}）：${faces}${yaoText}。`}
            </span>

            <div
              aria-hidden
              className={`grid grid-cols-[3rem_minmax(0,1fr)_2.2rem_2.9rem] items-center gap-x-1 px-1 py-1 ${
                isLatest ? "bg-surface-3" : ""
              }`}
            >
              <span className="text-[10px] leading-4 text-fg-muted">
                {YAO_LABELS[index]}
                <span className="ml-1">第 {index + 1} 掷</span>
              </span>

              <span className="flex items-center gap-1" style={{ perspective: "300px" }}>
                {toss ? (
                  toss.map((face, i) => (
                    <span key={i} className="inline-block">
                      <span
                        className={isLatest ? "anim-coin inline-block" : "inline-block"}
                        style={isLatest ? { animationDelay: `${i * 80}ms` } : undefined}
                      >
                        <Coin face={face} />
                      </span>
                    </span>
                  ))
                ) : (
                  [0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-7 w-7 rounded-full border border-dashed border-rule sm:h-8 sm:w-8"
                    />
                  ))
                )}
              </span>

              <span className="flex items-center">
                {toss ? <YaoLine yang={isYangToss(toss)} animate={isLatest} /> : null}
              </span>

              <span className="text-right text-[11px] leading-4 text-fg-muted">
                {toss ? (
                  name !== undefined ? (
                    <span className="font-serif text-accent">
                      {YAO_SHU_NAME[name]}
                      {name === 6 || name === 9 ? " · 动" : ""}
                    </span>
                  ) : (
                    <span>已成爻</span>
                  )
                ) : (
                  <span>待掷</span>
                )}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LiuyaoCast() {
  const [method, setMethod] = useState<Method>("coin");
  const [tosses, setTosses] = useState<Toss[]>([]);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [extra, setExtra] = useState("");
  const resultRef = useRef<HTMLDivElement | null>(null);

  const tossed = tosses.length;
  const finished = outcome !== null;
  const busy = loading || finished;
  const askLabel = topicActionLabel("liuyao", topic);

  // 成卦后：等卦名浮现（300ms 延迟 + 520ms 动画）再滚到装卦区
  useEffect(() => {
    if (!outcome) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }, 720);
    return () => window.clearTimeout(timer);
  }, [outcome]);

  function resetAll() {
    setTosses([]);
    setOutcome(null);
    setError(null);
  }

  function handleSelectMethod(next: Method) {
    if (loading || next === method) return;
    // 换方式等于重新起卦：清空上一轮的全部状态（掷币记录、卦象、错误）
    setMethod(next);
    resetAll();
  }

  async function handleToss() {
    if (busy || tossed >= 6 || !topic) return;
    const next = [...tosses, tossCoins()];
    setTosses(next);
    setError(null);
    if (next.length < 6) return;

    // 第六掷的时刻即起卦时刻，在 await 之前定格
    const moment = new Date();
    setLoading(true);
    try {
      setOutcome({ ...(await castByCoin(next, moment)), question: { topic, extra: extra.trim() } });
    } catch (err) {
      // 掷币数据本身必然合法；出错时不留在「已掷满却无结果」的死状态
      setTosses([]);
      setError(err instanceof Error ? err.message : "起卦失败，请重新掷币。");
    } finally {
      setLoading(false);
    }
  }

  async function handleTimeCast() {
    if (busy || !topic) return;
    setError(null);
    // 点击时刻即起卦时刻：先定格，再等历法引擎加载
    const moment = new Date();
    setLoading(true);
    try {
      setOutcome({ ...(await castByTime(moment)), question: { topic, extra: extra.trim() } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "起卦失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  const statusText = loading
    ? "正在起卦。"
    : outcome
      ? `起卦完成：本卦${outcome.result.benGua.name}，${
          outcome.result.movingLines.length === 0
            ? "六爻皆静"
            : `动爻 ${outcome.result.movingLines.length} 爻`
        }。取辞见下方。`
      : method === "coin" && tossed > 0
        ? `第 ${tossed} 掷完成，还需 ${6 - tossed} 次。`
        : "";

  return (
    <div className="space-y-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <TopicPicker
        kind="liuyao"
        topic={topic}
        onTopicChange={setTopic}
        extra={extra}
        onExtraChange={setExtra}
        required
        disabled={loading}
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      />

      <section
        aria-labelledby="liuyao-method-heading"
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
          <h2
            id="liuyao-method-heading"
            className="font-serif text-[15px] tracking-[0.18em] text-fg"
          >
            起卦方式
          </h2>
          <span className="text-[11px] text-fg-faint">
            {finished ? "更换方式会清空当前卦象" : "择一即可，两种方式取卦结果同等看待"}
          </span>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: "coin",
                name: "手动掷币",
                desc: "三枚铜钱掷六次，第一次为初爻，自下而上成卦。",
              },
              {
                id: "time",
                name: "时间起卦",
                desc: "以点击时刻的农历年月日时取数，梅花易数式。",
              },
            ] as const
          ).map((item) => {
            const active = method === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                disabled={loading}
                onClick={() => handleSelectMethod(item.id)}
                className={`tap rounded-[2px] border px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-accent bg-accent-soft"
                    : "border-rule bg-surface-2 hover:border-gold"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-base text-fg">{item.name}</span>
                  {active ? (
                    <span className="rounded-[2px] bg-accent px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-on-accent">
                      已选
                    </span>
                  ) : null}
                </span>
                <span className="mt-1.5 block text-[11px] leading-5 text-fg-muted">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          {method === "coin" ? (
            <CoinBoard tosses={tosses} yaoShu={outcome?.result.yaoShu} />
          ) : (
            <div className="rounded-[2px] border border-dashed border-rule px-4 py-5">
              <p className="text-[12px] leading-6 text-fg-soft">
                按下按钮的瞬间即为起卦时刻，取农历年支、月、日与时辰数。
              </p>
              <p className="mt-1 text-[11px] leading-5 text-fg-faint">
                23 点后按次日取农历日数（晚子时），时辰仍为子时。
              </p>
            </div>
          )}
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-xs leading-5 text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-center gap-3">
          {finished ? (
            <button
              type="button"
              onClick={resetAll}
              className="tap h-11 w-full max-w-[16rem] rounded-[2px] border border-accent bg-transparent px-8 text-sm tracking-[0.25em] text-accent hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              重新起卦
            </button>
          ) : method === "coin" ? (
            <button
              type="button"
              onClick={handleToss}
              disabled={busy || !topic}
              aria-describedby={!topic ? "liuyao-topic-required" : undefined}
              className="tap h-11 w-full max-w-[16rem] rounded-[2px] bg-cta px-8 text-sm tracking-[0.25em] text-on-cta hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "起卦中…"
                : tossed >= 6
                  ? "成卦中…"
                  : tossed === 0 && askLabel
                    ? askLabel
                    : `掷第 ${tossed + 1} 爻`}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTimeCast}
              disabled={busy || !topic}
              aria-describedby={!topic ? "liuyao-topic-required" : undefined}
              className="tap h-11 w-full max-w-[16rem] rounded-[2px] bg-cta px-8 text-sm tracking-[0.25em] text-on-cta hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "起卦中…" : (askLabel ?? "以此刻起卦")}
            </button>
          )}

          <p id="liuyao-topic-required" className="text-center text-[11px] leading-5 text-fg-faint">
            {!topic
              ? "先选所问之事，再起卦（一事一占）。"
              : method === "coin"
                ? finished
                  ? "已成一卦，可重新起卦，或对照下方卦象与取辞。"
                  : tossed === 0
                    ? "点击六次，每次三枚铜钱；第 1 次为初爻。"
                    : `已掷 ${tossed} / 6 次，下一掷为${YAO_LABELS[tossed]}。`
                : finished
                  ? "已按起卦时刻成卦，可重新起卦。"
                  : "以此刻的农历年月日时取卦。"}
          </p>
        </div>
      </section>

      <div aria-busy={loading}>
        {loading ? (
          <div className="rounded-[2px] border border-dashed border-rule px-5 py-8 text-center">
            <p className="font-serif text-sm tracking-[0.2em] text-fg-soft">起卦中…</p>
            <p className="mt-2 text-[11px] leading-5 text-fg-faint">
              首次起卦需加载历法引擎，请稍候。
            </p>
          </div>
        ) : outcome ? (
          <div
            ref={resultRef}
            className="anim-rise space-y-6 border border-rule-cinnabar bg-surface-2 p-5 sm:p-7"
          >
            <QuestionBanner question={outcome.question} />
            <QuestionProvider value={outcome.question}>
              <LiuyaoResult
                result={outcome.result}
                quZhan={outcome.quZhan}
                castAt={outcome.castAt}
              />
            </QuestionProvider>
          </div>
        ) : (
          <p className="border-t border-rule pt-5 text-[11px] leading-5 text-fg-faint">
            {method === "coin"
              ? "掷满六次后，这里会出现本卦与变卦的卦象、装卦标注与取辞。"
              : "点「以此刻起卦」后，这里会出现本卦与变卦的卦象、取数过程与取辞。"}
          </p>
        )}
      </div>
    </div>
  );
}
