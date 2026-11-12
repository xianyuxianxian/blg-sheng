"use client";

/**
 * AI 解读区块：事项下拉 + 补充语 + 流式渲染。
 *
 * 数据边界（隐私口径见 docs/superpowers/specs/2026-11-12-ai-interpret-design.md）：
 * 只把 `buildData()` 返回的排盘结果（干支 / 五行计数 / 卦象 / 牌面）发给服务端，
 * 生辰等数字字段在类型层就不存在——映射函数由各页自己写，见 BaziResult 等处。
 *
 * 所问事项：结果区外的 `QuestionProvider` 把「问事前置」选中的事项带进来作为初值，
 * props 契约保持不变；用户仍可在本区块改。
 *
 * 流式协议：POST /api/interpret 返回 `text/event-stream`，逐事件
 * `data: {"choices":[{"delta":{"content":"..."}}]}`，以 `data: [DONE]` 结束
 * （见 app/api/interpret/route.ts）。上游是推理型模型，首字节前有思考延迟，
 * 因此「已请求、未收到首 delta」这段时间单独显示「正在推算…」。
 */

import { useEffect, useRef, useState } from "react";
import { EXTRA_MAX, TOPICS } from "@/lib/ai/schema";
import type { BaziData, LiuyaoData, TarotData, Topic } from "@/lib/ai/schema";
import { useQuestion } from "@/components/QuestionContext";
import { appendStripped } from "@/components/stream-text";

export type AiInterpretType = "bazi" | "liuyao" | "tarot";

/** 排盘数据：由所在页面的结果对象映射而来；未完成排盘时返回 null。 */
export type AiInterpretData = BaziData | LiuyaoData | TarotData;

export type AiInterpretProps = {
  type: AiInterpretType;
  buildData: () => AiInterpretData | null;
};

/** 交互阶段：空闲 → 已请求待首字（思考中）→ 流式 → 完成 / 用户停止 / 失败。 */
type Phase = "idle" | "thinking" | "streaming" | "done" | "stopped" | "error";

const TYPE_LABEL: Record<AiInterpretType, string> = {
  bazi: "八字",
  liuyao: "六爻",
  tarot: "塔罗",
};

/** 失败文案：503 单独提示未配置，其余（400/502/网络）统一降级。 */
const ERROR_UNAVAILABLE = "解读服务暂不可用，请稍后再试";
const ERROR_NOT_CONFIGURED = "未配置解读服务";
const ERROR_EMPTY = "解读服务没有返回内容，请稍后再试";
/** 排盘未生成时的提示。 */
const HINT_NEEDS_RESULT = "先完成排盘";

/** 四态在界面上都要看得见（不只 aria-live）。 */
const PHASE_LABEL: Record<Phase, string> = {
  idle: "待解读",
  thinking: "正在推算",
  streaming: "正在生成",
  done: "已生成",
  stopped: "已停止",
  error: "生成失败",
};

type ParsedEvent = { kind: "content"; text: string } | { kind: "done" };

/** 解析一个 SSE 事件块；只认 `data:` 行，其余（心跳/注释）丢弃。 */
function parseEvent(rawEvent: string): ParsedEvent | null {
  for (const line of rawEvent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;
    const payload = trimmed.slice("data:".length).trim();
    if (!payload) continue;
    if (payload === "[DONE]") return { kind: "done" };
    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: unknown } }[];
      };
      const content = json.choices?.[0]?.delta?.content;
      if (typeof content === "string" && content.length > 0) {
        return { kind: "content", text: content };
      }
    } catch {
      // 非 JSON 的 data 行直接丢弃
    }
  }
  return null;
}

function isAbortError(err: unknown): boolean {
  return (err as { name?: unknown } | null | undefined)?.name === "AbortError";
}

/** 页头装饰：八字＝朱砂「解」印；六爻＝铜钱；塔罗＝星芒（60s 一圈）。 */
function SkinMark({ type }: { type: AiInterpretType }) {
  if (type === "bazi") {
    return (
      <span
        aria-hidden
        className="anim-seal grid h-6 w-6 shrink-0 place-items-center rounded-[2px] border border-accent font-serif text-[12px] leading-none text-accent"
      >
        解
      </span>
    );
  }
  if (type === "liuyao") {
    return (
      <span aria-hidden className="flex shrink-0 items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span key={i} className="coin coin--bei h-4 w-4 border-[0.5px]">
            <span className="coin-hole h-1 w-1 !border-[0.5px]" />
          </span>
        ))}
      </span>
    );
  }
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="anim-star h-6 w-6 shrink-0 text-gold"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
    >
      <path d="M12 2.5 13.6 9 20 10.5 13.6 12 12 18.5 10.4 12 4 10.5 10.4 9Z" />
      <path d="M12 2.5 13.6 9 20 10.5 13.6 12 12 18.5 10.4 12 4 10.5 10.4 9Z" transform="rotate(45 12 10.5)" />
      <circle cx="12" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function AiInterpret({ type, buildData }: AiInterpretProps) {
  // 用排盘结果的指纹做 key：换盘 / 换卦 / 重抽牌时整个面板重新挂载，
  // 上一轮解读自然清空，进行中的请求也会随卸载被 abort。
  // 比「用 effect 监听 data 再手动清状态」更稳：没有 setState-in-effect，也没有陈旧闭包。
  const data = buildData();
  const dataKey = data ? JSON.stringify(data) : "";
  // 问事前置选中的事项作为初值：换事项也重新挂载，避免旧解读挂着旧所问。
  const question = useQuestion();
  const initialTopic: Topic = question ? (question.topic ?? "其他") : TOPICS[0];
  const initialExtra = (question?.extra ?? "").trim().slice(0, EXTRA_MAX);

  return (
    <AiInterpretPanel
      key={`${dataKey}|${initialTopic}|${initialExtra}`}
      type={type}
      buildData={buildData}
      initialTopic={initialTopic}
      initialExtra={initialExtra}
    />
  );
}

function AiInterpretPanel({
  type,
  buildData,
  initialTopic,
  initialExtra,
}: AiInterpretProps & { initialTopic: Topic; initialExtra: string }) {
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [extra, setExtra] = useState(initialExtra);
  const [phase, setPhase] = useState<Phase>("idle");
  const [answer, setAnswer] = useState("");
  /**
   * 已剥 Markdown 的分段：每段独立播 fade-in。
   * 剥离在「累计原文」上做（见 stream-text.ts），delta 切在 `**`/` 中间也不会漏裸标记。
   */
  const [segments, setSegments] = useState<string[]>([]);
  const [errorText, setErrorText] = useState<string | null>(null);
  /** 服务端未配置（503）：按钮置灰，避免反复点同一个必然失败的请求。 */
  const [notConfigured, setNotConfigured] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /** 用户主动停止过：流正常收尾也要落到「已停止」而不是「已完成」。 */
  const stoppedRef = useRef(false);

  // 映射是纯函数，每次渲染取一次：排盘结果变化时按钮禁用态随之更新。
  const data = buildData();
  const busy = phase === "thinking" || phase === "streaming";
  const hasAnswer = answer.length > 0;
  const stoppedEmpty = phase === "stopped" && !hasAnswer;

  // 卸载时断开连接：离开页面即停止生成，服务端读到断开也会终止上游请求。
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleGenerate() {
    const payload = buildData();
    if (!payload) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    stoppedRef.current = false;

    setAnswer("");
    setSegments([]);
    setErrorText(null);
    setPhase("thinking");

    try {
      const res = await fetch("/api/interpret", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, topic, extra, data: payload }),
        signal: controller.signal,
      });

      if (!res.ok) {
        setPhase("error");
        if (res.status === 503) {
          setNotConfigured(true);
          setErrorText(ERROR_NOT_CONFIGURED);
        } else {
          setErrorText(ERROR_UNAVAILABLE);
        }
        return;
      }
      if (!res.body) {
        setPhase("error");
        setErrorText(ERROR_UNAVAILABLE);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let sawDone = false;

      while (!sawDone) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // 归一化 CRLF：chunk 恰好切在 "\r\n" 中间时不丢事件分隔
        buffer = buffer.replace(/\r\n/g, "\n");

        let idx = buffer.indexOf("\n\n");
        while (idx !== -1) {
          const event = parseEvent(buffer.slice(0, idx));
          buffer = buffer.slice(idx + 2);
          idx = buffer.indexOf("\n\n");

          if (!event) continue;
          if (event.kind === "done") {
            sawDone = true;
            break;
          }
          acc += event.text;
          setAnswer(acc);
          // 在累计原文上剥 Markdown，再取相对上一段的增量：跨 delta 的 ** / ` 也不漏
          setSegments((prev) => appendStripped(prev, acc));
          // 首字到达才离开「思考中」
          setPhase("streaming");
        }
      }

      setPhase(stoppedRef.current ? "stopped" : acc.length > 0 ? "done" : "error");
      if (!stoppedRef.current && acc.length === 0) setErrorText(ERROR_EMPTY);
      // [DONE] 后再读会挂住：主动释放连接（服务端也会在断开时收尾）
      if (sawDone) await reader.cancel().catch(() => {});
    } catch (err) {
      // 已被新的请求接管：旧请求的收尾不能覆盖新请求的状态
      if (abortRef.current !== controller) return;
      if (isAbortError(err) || stoppedRef.current) {
        // 用户点「停止」：保留已生成的部分，不当作失败
        setPhase("stopped");
        return;
      }
      setPhase("error");
      setErrorText(ERROR_UNAVAILABLE);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  function handleStop() {
    stoppedRef.current = true;
    abortRef.current?.abort();
  }

  const statusText =
    phase === "thinking"
      ? "正在推算…"
      : phase === "streaming"
        ? "正在生成解读。"
        : phase === "done"
          ? "解读已生成。"
          : phase === "stopped"
            ? "已停止生成，保留已生成的部分。"
            : phase === "error"
              ? (errorText ?? ERROR_UNAVAILABLE)
              : data
                ? "可以生成 AI 解读。"
                : HINT_NEEDS_RESULT;

  const actionLabel = busy ? "停止" : phase === "idle" ? "生成解读" : "重新解读";

  return (
    <section aria-labelledby="ai-interpret-heading" data-share-hide className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-rule pb-2">
        <h2
          id="ai-interpret-heading"
          className="flex items-center gap-2 font-serif text-[15px] tracking-[0.18em] text-fg"
        >
          <SkinMark type={type} />
          AI 解读
        </h2>
        <span className="shrink-0 rounded-[2px] border border-rule px-1.5 py-[1px] text-[10px] leading-4 tracking-[0.1em] text-fg-muted">
          AI 生成 · 仅供参考娱乐
        </span>
      </div>

      <p className="text-[11px] leading-5 text-fg-muted">
        选一个想问的方向，可补一句话说明。只发送{TYPE_LABEL[type]}
        排盘结果（干支、卦象或牌面）以及你选择的事项与补充说明，不含生辰。
      </p>

      <div className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <label htmlFor="ai-topic" className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-[0.12em] text-fg-muted">所问之事</span>
          <select
            id="ai-topic"
            value={topic}
            disabled={busy || !data}
            onChange={(event) => setTopic(event.currentTarget.value as Topic)}
            className="field disabled:cursor-not-allowed"
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="ai-extra" className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2 text-[11px] tracking-[0.12em] text-fg-muted">
            <span>补充一句（选填）</span>
            <span className="text-fg-faint">
              {extra.length}/{EXTRA_MAX}
            </span>
          </span>
          <input
            id="ai-extra"
            type="text"
            maxLength={EXTRA_MAX}
            value={extra}
            disabled={busy || !data}
            onChange={(event) => setExtra(event.currentTarget.value)}
            placeholder="例如：最近在考虑换工作"
            className="field disabled:cursor-not-allowed"
          />
        </label>
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <button
          id="ai-action"
          type="button"
          onClick={busy ? handleStop : handleGenerate}
          disabled={notConfigured || (!data && !busy)}
          className={`tap h-10 w-full rounded-[2px] px-6 text-sm tracking-[0.2em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
            busy
              ? "border border-accent bg-transparent text-accent hover:bg-accent-soft"
              : "bg-cta text-on-cta hover:bg-cta-hover"
          }`}
        >
          {actionLabel}
        </button>
        <p className="flex items-center gap-1.5 text-[11px] leading-5 text-fg-faint">
          <span
            aria-hidden
            className={`inline-block h-1.5 w-1.5 rounded-full ${
              phase === "error"
                ? "bg-accent"
                : busy
                  ? "animate-pulse bg-gold"
                  : phase === "done"
                    ? "bg-gold"
                    : "bg-[var(--ink-muted)]"
            }`}
          />
          {PHASE_LABEL[phase]}
        </p>
        {!data ? (
          <span className="text-[11px] leading-5 text-fg-muted">{HINT_NEEDS_RESULT}</span>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <div
        id="ai-output"
        aria-busy={busy}
        className={`min-h-[3rem] rounded-[2px] border border-rule bg-surface-2 px-4 py-3 ${
          type === "liuyao" ? "border-l-2 border-l-gold" : ""
        }`}
      >
        {phase === "thinking" ? (
          <p className="text-sm leading-7 text-fg-muted">正在推算…</p>
        ) : null}

        {hasAnswer ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-fg-soft">
            {segments.map((segment, index) => (
              <span key={index} className="anim-chunk inline">
                {segment}
              </span>
            ))}
            {phase === "streaming" ? (
              <span aria-hidden className="ml-0.5 text-accent">
                ▍
              </span>
            ) : null}
          </div>
        ) : null}

        {phase === "stopped" && hasAnswer ? (
          <p className="mt-2 text-[11px] leading-5 text-fg-muted">
            已停止生成，上方为已生成的部分。
          </p>
        ) : null}

        {phase === "error" && errorText ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p role="alert" className="text-xs leading-5 text-accent">
              {errorText}
            </p>
            {notConfigured ? null : (
              <button
                type="button"
                onClick={handleGenerate}
                className="tap rounded-[2px] border border-accent px-2.5 py-1 text-[11px] leading-4 tracking-[0.1em] text-accent hover:bg-accent-soft"
              >
                重试
              </button>
            )}
          </div>
        ) : null}

        {phase === "idle" && !hasAnswer ? (
          <p className="text-[11px] leading-5 text-fg-muted">
            生成后，解读会在这里逐字出现。内容由模型生成，仅作传统文化参考。
          </p>
        ) : null}

        {stoppedEmpty ? (
          <p className="text-[11px] leading-5 text-fg-muted">已停止，没有收到内容。</p>
        ) : null}
      </div>
    </section>
  );
}
