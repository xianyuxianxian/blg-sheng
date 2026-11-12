"use client";

import { useEffect, useRef, useState } from "react";
import {
  drawSpread,
  SPREADS,
  type DrawnCard,
  type SpreadDef,
} from "@/lib/tarot/deck";
import { ShareButton } from "@/components/ShareCard";

/** 交互阶段：选阵/洗牌前 → 洗牌动画 → 可抽牌 → 逐张翻牌 → 全部翻开 */
type Phase = "idle" | "shuffling" | "shuffled" | "dealing" | "done";

/** 牌阵按 id 索引，这里统一遍历，后续追加新阵无需改 UI。 */
const SPREAD_LIST: SpreadDef[] = Object.values(SPREADS);

/** 洗牌动画时长：与 CSS 动画节奏对齐，动画结束后才允许抽牌。 */
const SHUFFLE_MS = 1100;
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

/** 牌背：朱砂底 + 细边框与中央菱形，纯装饰。 */
function CardBack() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-[3px] border border-[#8f3024] bg-[#a63a2c]">
      <div
        aria-hidden
        className="absolute inset-[5px] rounded-[1px] border border-[#efd3bc]/45"
      />
      <div aria-hidden className="absolute inset-0 grid place-items-center">
        <span className="grid h-7 w-7 rotate-45 place-items-center border border-[#efd3bc]/60">
          <span className="block h-3 w-3 bg-[#efd3bc]/35" />
        </span>
      </div>
    </div>
  );
}

/** 正/逆位标签：文字与图形双重区分，不依赖颜色。 */
function OrientationBadge({ reversed }: { reversed: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[10px] leading-4 tracking-[0.12em] ${
        reversed
          ? "border-[#8a5a3a]/50 bg-[#f7efe4] text-[#8a5a3a]"
          : "border-[#4d6f47]/50 bg-[#f1f4ea] text-[#4d6f47]"
      }`}
    >
      <span aria-hidden className="text-[9px] leading-none">
        {reversed ? "▽" : "△"}
      </span>
      {reversed ? "逆位" : "正位"}
    </span>
  );
}

/** 洗牌前的牌堆（洗牌时播放 CSS 抖动动画）。 */
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
            className={`h-full w-full ${shuffling ? "tarot-shuffle-card" : ""}`}
            style={shuffling ? { animationDelay: `${i * 110}ms` } : undefined}
          >
            <CardBack />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 单张已抽出的牌：3D 翻牌 + 牌位与正逆位。 */
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
    <li className="flex flex-col items-center gap-2">
      <div className="w-full" style={{ perspective: "1000px" }}>
        <div
          className="tarot-flip relative aspect-[500/870] w-full"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* 牌背与牌面互为背面，由父级 rotateY 切换；读屏以牌下方的状态文字为准 */}
          <div
            aria-hidden
            className="tarot-face absolute inset-0 overflow-hidden rounded-[3px]"
          >
            <CardBack />
          </div>

          {/* 牌面：lazy 加载，逆位时牌图倒置显示 */}
          <div
            aria-hidden
            className="tarot-face absolute inset-0 overflow-hidden rounded-[3px] border border-[#c9b89c] bg-[#fbf6ec]"
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
        <p className="text-[10px] leading-4 tracking-[0.2em] text-[#6f6451]">{label}</p>
        <p className="mt-0.5 font-serif text-sm leading-5 text-[#26221b]">
          {flipped ? card.name : "未翻开"}
        </p>
        <p className="mt-1">
          {flipped ? (
            <OrientationBadge reversed={reversed} />
          ) : (
            <span className="text-[10px] text-[#786c57]">第 {index + 1} 张</span>
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
  // 持有预热图引用，避免 Image 对象被回收导致请求中断
  const preloads = useRef<HTMLImageElement[]>([]);
  /** 分享图截图目标：整个抽牌结果区（牌阵选择区在分享图中隐去）。 */
  const shareRef = useRef<HTMLDivElement | null>(null);

  const spread = SPREAD_LIST.find((item) => item.id === spreadId) ?? SPREAD_LIST[0];
  const positions = spread.positions;
  const isBusy = phase === "shuffling" || phase === "dealing";

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
    setPhase("idle");
  }

  const actionLabel =
    phase === "idle"
      ? "洗牌"
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
        ? "正在打乱牌序，请稍候。"
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
      {/* 洗牌 / 翻牌 / 淡入动画；偏好减少动效时全部关闭 */}
      <style>{`
        .tarot-face { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .tarot-flip { transition: transform 620ms cubic-bezier(0.2, 0.7, 0.2, 1); }
        @keyframes tarot-shuffle-card {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          20% { transform: translate3d(-9px, -5px, 0) rotate(-6deg); }
          45% { transform: translate3d(9px, 3px, 0) rotate(5deg); }
          70% { transform: translate3d(-5px, 5px, 0) rotate(-3deg); }
        }
        .tarot-shuffle-card { animation: tarot-shuffle-card 760ms ease-in-out infinite; }
        @keyframes tarot-reveal-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .tarot-reveal { animation: tarot-reveal-in 420ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .tarot-flip { transition: none; }
          .tarot-shuffle-card { animation: none; }
          .tarot-reveal { animation: none; }
        }
      `}</style>

      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <section
        aria-labelledby="spread-heading"
        data-share-hide
        className="space-y-3"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-[#e3d9c5] pb-2">
          <h2 id="spread-heading" className="font-serif text-[15px] tracking-[0.18em]">
            选择牌阵
          </h2>
          <span className="shrink-0 text-[11px] text-[#786c57]">
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
                className={`rounded-[2px] border px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a63a2c] disabled:cursor-not-allowed ${
                  active
                    ? "border-[#a63a2c] bg-[#fbf2ec]"
                    : "border-[#ddd2bb] bg-[#fdfaf2] hover:border-[#c0b294]"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-serif text-base text-[#26221b]">{item.name}</span>
                  {active ? (
                    <span className="rounded-[2px] bg-[#a63a2c] px-1.5 py-0.5 text-[9px] tracking-[0.1em] text-[#fbf6ec]">
                      已选
                    </span>
                  ) : null}
                </span>
                <span className="mt-1.5 block text-[11px] leading-5 text-[#6f6451]">
                  {item.positions.map((position) => position.label).join(" · ")}
                </span>
              </button>
            );
          })}

          <div className="flex flex-col justify-center rounded-[2px] border border-dashed border-[#ddd2bb] px-4 py-3">
            <span className="font-serif text-base text-[#786c57]">更多牌阵</span>
            <span className="mt-1.5 block text-[11px] leading-5 text-[#786c57]">
              凯尔特十字等牌阵即将上线。
            </span>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="draw-heading"
        aria-busy={isBusy}
        className="rounded-[2px] border border-[#ddd2bb] bg-[#fdfaf2] p-5 sm:p-7"
      >
        <div className="flex items-baseline justify-between gap-4 border-b border-[#e3d9c5] pb-2">
          <h2 id="draw-heading" className="font-serif text-[15px] tracking-[0.18em]">
            洗牌与抽牌
          </h2>
          <span className="shrink-0 text-[11px] text-[#786c57]">
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
            className="h-11 w-full max-w-[16rem] rounded-[2px] bg-[#a63a2c] px-8 text-sm tracking-[0.25em] text-[#fbf6ec] transition-colors hover:bg-[#8f3024] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a63a2c] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel}
          </button>
          <p className="text-center text-[11px] leading-5 text-[#786c57]">{actionHint}</p>
        </div>
      </section>

      <section aria-labelledby="reading-heading" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-[#e3d9c5] pb-2">
          <h2 id="reading-heading" className="font-serif text-[15px] tracking-[0.18em]">
            牌义解读
          </h2>
          <span className="shrink-0 text-[11px] text-[#786c57]">按牌位逐张展开</span>
        </div>

        {drawn.length === 0 ? (
          <p className="text-[11px] leading-5 text-[#786c57]">
            {`洗牌并抽牌后，这里会按「${positions
              .map((position) => position.label)
              .join(" · ")}」列出每张牌的牌位含义与正逆位解读。`}
          </p>
        ) : revealed === 0 ? (
          <p className="text-[11px] leading-5 text-[#786c57]">正在翻牌…</p>
        ) : (
          <ol className="space-y-6">
            {positions.map((position, i) => {
              const entry = drawn[i];
              if (!entry || revealed <= i) return null;
              return (
                <li
                  key={`${drawSeq}-${i}-${entry.card.id}`}
                  className="tarot-reveal border-t border-[#e3d9c5] pt-5 first:border-t-0 first:pt-0"
                >
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
                    <span className="font-serif text-lg tracking-[0.08em] text-[#26221b]">
                      {position.label}
                    </span>
                    <span className="font-serif text-base text-[#3f382d]">
                      {entry.card.name}
                    </span>
                    <OrientationBadge reversed={entry.reversed} />
                  </div>
                  <p className="mt-2 text-[11px] leading-5 text-[#786c57]">
                    牌位含义：{position.meaning}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[#3f382d]">
                    {entry.reversed ? entry.card.reversed : entry.card.upright}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {phase === "done" ? (
        <ShareButton targetRef={shareRef} fileName="tarot" label="塔罗抽牌" />
      ) : null}
    </div>
  );
}
