"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  drawSpread,
  SPREADS,
  type DrawnCard,
  type SpreadDef,
} from "@/lib/tarot/deck";
import { ShareButton } from "@/components/ShareCard";
import { AiInterpret } from "@/components/AiInterpret";
import { QuestionBanner, QuestionProvider, type Question } from "@/components/QuestionContext";
import { TopicPicker } from "@/components/TopicPicker";
import { topicActionLabel } from "@/components/topic-label";
import type { TarotData, Topic } from "@/lib/ai/schema";

/** 交互阶段：选阵/洗牌前 → 洗牌动画 → 可抽牌 → 逐张翻牌 → 全部翻开 */
type Phase = "idle" | "shuffling" | "shuffled" | "dealing" | "done";

/** 牌阵按 id 索引，这里统一遍历，后续追加新阵无需改 UI。 */
const SPREAD_LIST: SpreadDef[] = Object.values(SPREADS);

/** 洗牌动画时长（扇形开合 800ms + 收尾），动画结束后才允许抽牌。 */
const SHUFFLE_MS = 900;
/** 第一张牌的翻牌延迟（等按钮状态稳定）。 */
const FIRST_REVEAL_MS = 260;
/** 相邻两张牌的翻牌间隔，与 620ms 的翻转过渡形成错落。 */
const REVEAL_STEP_MS = 520;
/** 最后一张翻完后稍作停顿，再切到「已完成」。 */
const END_PAUSE_MS = 560;

/** 静态牌堆的三张错位布局。 */
const DECK_LAYOUT = [
  { x: -15, rot: -7 },
  { x: 0, rot: 0 },
  { x: 15, rot: 7 },
];

/** 牌背：几何星芒 + 细金边，纯 CSS，不用图片。 */
function CardBack() {
  return (
    <div className="tarot-back relative h-full w-full overflow-hidden rounded-[3px] border border-gold/50">
      <div aria-hidden className="absolute inset-[5px] rounded-[1px] border border-gold/25" />
      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="grid h-7 w-7 rotate-45 place-items-center border border-gold/50">
          <span className="block h-3 w-3 bg-gold/30" />
        </span>
      </div>
    </div>
  );
}

/** 正/逆位标签：文字与图形双重区分，不依赖颜色（深底上的两档都 ≥4.5:1）。 */
function OrientationBadge({ reversed }: { reversed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[10px] leading-4 tracking-[0.12em] ${
        reversed
          ? "border-rule bg-surface-3 text-fg-muted"
          : "border-gold/60 bg-accent-soft text-accent"
      }`}
    >
      <span aria-hidden className="text-[9px] leading-none">
        {reversed ? "▽" : "△"}
      </span>
      {reversed ? "逆位" : "正位"}
    </span>
  );
}

/** 洗牌前的牌堆：三张牌扇形展开再合拢（800ms，方向由 --fan-* 给）。 */
function DeckStack({ shuffling }: { shuffling: boolean }) {
  return (
    <div aria-hidden className="relative h-44 w-36">
      {DECK_LAYOUT.map((slot, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 w-[5.25rem] aspect-[500/870]"
          style={{
            transform: `translate(calc(-50% + ${slot.x}px), -50%) rotate(${slot.rot}deg)`,
          }}
        >
          <div
            className={`h-full w-full ${shuffling ? "anim-shuffle" : ""}`}
            style={
              shuffling
                ? ({
                    "--fan-x": `${(i - 1) * 46}px`,
                    "--fan-rot": `${(i - 1) * 20}deg`,
                    animationDelay: `${i * 60}ms`,
                  } as CSSProperties)
                : undefined
            }
          >
            <CardBack />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 单张已抽出的牌：滑出到位 + 3D 翻牌（金色描边闪光一次）+ 牌位与正逆位。 */
function DrawnCardCell({
  drawn,
  label,
  index,
  flipped,
}: {
  drawn: DrawnCard;
  label: string;
  index: number;
  flipped: boolean;
}) {
  const { card, reversed } = drawn;

  return (
    <li
      className="anim-deal flex flex-col items-center gap-2"
      style={{ "--deal-index": index } as CSSProperties}
    >
      <div className="w-full" style={{ perspective: "1000px" }}>
        <div
          className={`tarot-flip relative aspect-[500/870] w-full rounded-[3px] ${
            flipped ? "anim-flash ring-1 ring-gold/60" : ""
          }`}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 牌背与牌面互为背面，由父级 rotateY 切换；读屏以牌下方的状态文字为准 */}
          <div aria-hidden className="tarot-face absolute inset-0 overflow-hidden rounded-[3px]">
            <CardBack />
          </div>

          {/* 牌面：lazy 加载，逆位时牌图倒置显示 */}
          <div
            aria-hidden
            className="tarot-face absolute inset-0 overflow-hidden rounded-[3px] border border-gold/60 bg-paper"
            style={{ transform: "rotateY(180deg)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 静态导出下不做图片优化，固定比例 + lazy 足够 */}
            <img
              src={card.image}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
              style={{ transform: reversed ? "rotate(180deg)" : undefined }}
            />
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[10px] leading-4 tracking-[0.2em] text-fg-muted">{label}</p>
        <p className="mt-0.5 font-serif text-sm leading-5 text-fg">
          {flipped ? card.name : "未翻开"}
        </p>
        <p className="mt-1">
          {flipped ? (
            <OrientationBadge reversed={reversed} />
          ) : (
            <span className="text-[10px] text-fg-faint">第 {index + 1} 张</span>
          )}
        </p>
      </div>
    </li>
  );
}

export function TarotSpread() {
  const [spreadId, setSpreadId] = useState(SPREAD_LIST[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [drawn, setDrawn] = useState<DrawnCard[]>([]);
  const [revealed, setRevealed] = useState(0);
  const [drawSeq, setDrawSeq] = useState(0);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [extra, setExtra] = useState("");
  /** 抽牌时定格的所问：换问题要重新洗牌，结果区的所问保持不变。 */
  const [question, setQuestion] = useState<Question | null>(null);
  // 持有预热图引用，避免 Image 对象被回收导致请求中断
  const preloads = useRef<HTMLImageElement[]>([]);
  /** 分享图截图目标：整个抽牌结果区（牌阵选择区在分享图中隐去）。 */
  const shareRef = useRef<HTMLDivElement | null>(null);

  const spread = SPREAD_LIST.find((item) => item.id === spreadId) ?? SPREAD_LIST[0];
  const positions = spread.positions;
  const isBusy = phase === "shuffling" || phase === "dealing";
  const askLabel = topicActionLabel("tarot", topic);
  const activeQuestion = question ?? { topic, extra: extra.trim() };

  // 洗牌：动画结束后进入「可抽牌」
  useEffect(() => {
    if (phase !== "shuffling") return;
    const timer = window.setTimeout(() => setPhase("shuffled"), SHUFFLE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // 逐张翻牌：每次只推进一张，翻完最后一张后收尾
  useEffect(() => {
    if (phase !== "dealing") return;
    const finished = revealed >= drawn.length;
    const delay = finished ? END_PAUSE_MS : revealed === 0 ? FIRST_REVEAL_MS : REVEAL_STEP_MS;
    const timer = window.setTimeout(() => {
      if (finished) {
        setPhase("done");
      } else {
        setRevealed((n) => n + 1);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [phase, revealed, drawn.length]);

  function handleShuffle() {
    setDrawn([]);
    setRevealed(0);
    setQuestion(null);
    setPhase("shuffling");
  }

  function handleDraw() {
    if (phase !== "shuffled") return;
    const cards = drawSpread(positions.length);
    // 牌面要等翻牌后才可见：先用普通 Image 预热，翻开时直接命中缓存，不会先看到空白。
    preloads.current = cards.map(({ card }) => {
      const preload = new window.Image();
      preload.src = card.image;
      return preload;
    });
    setQuestion({ topic, extra: extra.trim() });
    setDrawn(cards);
    setRevealed(0);
    setDrawSeq((n) => n + 1);
    setPhase("dealing");
  }

  function handleSelectSpread(id: string) {
    if (isBusy || id === spreadId) return;
    // 换阵等于重新开始：清掉上一轮的牌与解读
    setSpreadId(id);
    setDrawn([]);
    setRevealed(0);
    setQuestion(null);
    setPhase("idle");
  }

  /**
   * AI 解读入参映射：牌阵名 + 每张牌的牌名、牌位含义与正逆位。
   * 牌未翻完（或还没抽牌）时返回 null，按钮保持禁用。
   */
  function buildAiData(): TarotData | null {
    if (phase !== "done" || drawn.length !== positions.length) return null;
    return {
      spread: spread.name,
      cards: drawn.map((entry, i) => ({
        name: entry.card.name,
        position: positions[i]?.label ?? `第 ${i + 1} 张`,
        reversed: entry.reversed,
      })),
    };
  }

  const actionLabel =
    phase === "idle"
      ? (askLabel ?? "洗牌")
      : phase === "shuffling"
        ? "洗牌中…"
        : phase === "shuffled"
          ? "抽牌"
          : phase === "dealing"
            ? "翻牌中…"
            : "重新洗牌";

  const actionHint =
    phase === "idle"
      ? "洗牌后点「抽牌」，一次性翻出全部牌位。"
      : phase === "shuffling"
        ? "正在打散牌序，请稍候。"
        : phase === "shuffled"
          ? "心里默想你的问题，然后抽牌。"
          : phase === "dealing"
            ? `正在翻开第 ${Math.min(revealed + 1, drawn.length)} 张…`
            : "可以换一个问题重新洗牌，或对照下方解读。";

  const lastRevealed =
    phase === "dealing" && revealed > 0 ? drawn[revealed - 1] : null;
  const statusText =
    phase === "shuffling"
      ? "正在洗牌。"
      : phase === "shuffled"
        ? `洗牌完成，可以抽牌了（${spread.name}）。`
        : lastRevealed
          ? `已翻出${positions[revealed - 1]?.label ?? ""}：${lastRevealed.card.name}，${lastRevealed.reversed ? "逆位" : "正位"}。`
          : phase === "dealing"
            ? "正在翻牌。"
            : phase === "done"
              ? `${drawn.length} 张牌已全部翻开，下方是完整解读。`
              : "";

  return (
    <div ref={shareRef} className="space-y-8">
      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <TopicPicker
        kind="tarot"
        topic={topic}
        onTopicChange={setTopic}
        extra={extra}
        onExtraChange={setExtra}
        disabled={isBusy}
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      />

      <section
        aria-labelledby="spread-heading"
        data-share-hide
        className="space-y-3"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 id="spread-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
            选择牌阵
          </h2>
          <span className="shrink-0 text-[11px] text-fg-faint">
            {phase === "idle"
              ? "一期仅开放三张阵"
              : isBusy
                ? "洗牌进行中…"
                : "更换牌阵将重新开始"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SPREAD_LIST.map((item) => {
            const active = item.id === spreadId;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                disabled={isBusy}
                onClick={() => handleSelectSpread(item.id)}
                className={`tap rounded-[2px] border px-4 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed ${
                  active
                    ? "border-gold bg-accent-soft"
                    : "border-rule bg-surface-2 hover:border-gold/60"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-base text-fg">{item.name}</span>
                  {active ? (
                    <span className="rounded-[2px] bg-gold-accent px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-on-cta">
                      已选
                    </span>
                  ) : null}
                </span>
                <span className="mt-1.5 block text-[11px] leading-5 text-fg-muted">
                  {item.positions.map((position) => position.label).join(" · ")}
                </span>
              </button>
            );
          })}

          <div className="flex flex-col justify-center rounded-[2px] border border-dashed border-rule px-4 py-3">
            <span className="font-serif text-base text-fg-muted">更多牌阵</span>
            <span className="mt-1.5 block text-[11px] leading-5 text-fg-faint">
              凯尔特十字等牌阵即将上线。
            </span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="draw-heading"
        aria-busy={isBusy}
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 id="draw-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
            洗牌与抽牌
          </h2>
          <span className="shrink-0 text-[11px] text-fg-faint">
            {spread.name} · {positions.length} 张
          </span>
        </div>

        <div className="mt-6 flex min-h-[11rem] items-center justify-center">
          {drawn.length === 0 ? (
            <DeckStack shuffling={phase === "shuffling"} />
          ) : (
            <ol className="grid w-full grid-cols-3 gap-2 sm:gap-4">
              {positions.map((position, i) => {
                const entry = drawn[i];
                if (!entry) return null;
                return (
                  <DrawnCardCell
                    key={`${drawSeq}-${i}-${entry.card.id}`}
                    drawn={entry}
                    label={position.label}
                    index={i}
                    flipped={revealed > i}
                  />
                );
              })}
            </ol>
          )}
        </div>

        {/* 操作区（洗牌/抽牌按钮 + 提示）不进入分享图；牌面在上面的 ol 里 */}
        <div data-share-hide className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={phase === "shuffled" ? handleDraw : handleShuffle}
            disabled={isBusy}
            className="tap h-11 w-full max-w-[16rem] rounded-[2px] bg-cta px-8 text-sm tracking-[0.25em] text-on-cta hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel}
          </button>
          <p className="text-center text-[11px] leading-5 text-fg-muted">{actionHint}</p>
        </div>
      </section>

      <section aria-labelledby="reading-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-2">
          <h2 id="reading-heading" className="font-serif text-[15px] tracking-[0.18em] text-fg">
            牌义解读
          </h2>
          <span className="shrink-0 text-[11px] text-fg-faint">按牌位逐张展开</span>
        </div>

        {drawn.length > 0 ? <QuestionBanner question={activeQuestion} /> : null}

        {drawn.length === 0 ? (
          <p className="text-[11px] leading-5 text-fg-faint">
            {`洗牌并抽牌后，这里会按「${positions
              .map((position) => position.label)
              .join(" · ")}」列出每张牌的牌位含义与正逆位解读。`}
          </p>
        ) : revealed === 0 ? (
          <p className="text-[11px] leading-5 text-fg-faint">正在翻牌…</p>
        ) : (
          <ol className="space-y-6">
            {positions.map((position, i) => {
              const entry = drawn[i];
              if (!entry || revealed <= i) return null;
              return (
                <li
                  key={`${drawSeq}-${i}-${entry.card.id}`}
                  className="anim-rise border-t border-rule pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span className="font-serif text-lg tracking-[0.08em] text-fg">
                      {position.label}
                    </span>
                    <span className="font-serif text-base text-fg-soft">{entry.card.name}</span>
                    <OrientationBadge reversed={entry.reversed} />
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-fg-muted">
                    牌位含义：{position.meaning}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-fg-soft">
                    {entry.reversed ? entry.card.reversed : entry.card.upright}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <QuestionProvider value={activeQuestion}>
        <AiInterpret type="tarot" buildData={buildAiData} />
      </QuestionProvider>

      {phase === "done" ? (
        <ShareButton targetRef={shareRef} fileName="tarot" label="塔罗抽牌" theme="dark" />
      ) : null}
    </div>
  );
}
