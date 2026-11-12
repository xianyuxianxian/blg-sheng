"use client";

/**
 * AI 解读区块：事项下拉 + 补充语 + 流式渲染。
 *
 * 数据边界（隐私口径见 docs/superpowers/specs/2026-11-12-ai-interpret-design.md）：
 * 只把 `buildData()` 返回的排盘结果（干支 / 五行计数 / 卦象 / 牌面）发给服务端，
 * 生辰等数字字段在类型层就不存在——映射函数由各页自己写，见 BaziResult 等处。
 *
 * 流式协议：POST /api/interpret 返回 `text/event-stream`，逐事件
 * `data: {"choices":[{"delta":{"content":"..."}}]}`，以 `data: [DONE]` 结束
 * （见 app/api/interpret/route.ts）。上游是推理型模型，首字节前有思考延迟，
 * 因此「已请求、未收到首 delta」这段时间单独显示「正在推算…」。
 */

import { useEffect, useRef, useState } from "react";
import { EXTRA_MAX, TOPICS } from "@/lib/ai/schema";
import type { BaziData, LiuyaoData, TarotData, Topic } from "@/lib/ai/schema";

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

/**
 * 模型偶尔仍会吐 Markdown（**加粗**、# 标题、行内代码）。
 * 这里不做完整 Markdown 渲染，只去掉标记字符，保持纯文本段落。
 */
function plainText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "");
}

export function AiInterpret({ type, buildData }: AiInterpretProps) {
  // 用排盘结果的指纹做 key：换盘 / 换卦 / 重抽牌时整个面板重新挂载，
  // 上一轮解读自然清空，进行中的请求也会随卸载被 abort。
  // 比「用 effect 监听 data 再手动清状态」更稳：没有 setState-in-effect，也没有陈旧闭包。
  const data = buildData();
  const dataKey = data ? JSON.stringify(data) : "";
  return <AiInterpretPanel key={dataKey} type={type} buildData={buildData} />;
}

function AiInterpretPanel({ type, buildData }: AiInterpretProps) {
  const [topic, setTopic] = useState<Topic>(TOPICS[0]);
  const [extra, setExtra] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [answer, setAnswer] = useState("");
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
              ? errorText ?? ERROR_UNAVAILABLE
              : data
                ? "可以生成 AI 解读。"
                : HINT_NEEDS_RESULT;

  const actionLabel = busy ? "停止" : phase === "idle" ? "生成解读" : "重新解读";

  return (
    <section aria-labelledby="ai-interpret-heading" data-share-hide className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[#e3d9c5] pb-2">
        <h2 id="ai-interpret-heading" className="font-serif text-[15px] tracking-[0.18em]">
          AI 解读
        </h2>
        <span className="shrink-0 rounded-[2px] border border-[#c0b294] px-1.5 py-[1px] text-[10px] leading-4 tracking-[0.1em] text-[#6f6451]">
          AI 生成 · 仅供参考娱乐
        </span>
      </div>

      <p className="text-[11px] leading-5 text-[#786c57]">
        选一个想问的方向，可补一句话说明。只发送{TYPE_LABEL[type]}排盘结果（干支、卦象或牌面）以及你选择的事项与补充说明，不含生辰。
      </p>

      <div className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
        <label htmlFor="ai-topic" className="flex flex-col gap-1.5">
          <span className="text-[11px] tracking-[0.12em] text-[#6f6451]">所问之事</span>
          <select
            id="ai-topic"
            value={topic}
            disabled={busy || !data}
            onChange={(event) => setTopic(event.currentTarget.value as Topic)}
            className="h-10 w-full rounded-[2px] border border-[#d8cbb2] bg-[#fffdf7] px-2.5 text-sm text-[#26221b] outline-none transition-colors focus:border-[#a63a2c] focus:ring-2 focus:ring-[#a63a2c]/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {TOPICS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="ai-extra" className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2 text-[11px] tracking-[0.12em] text-[#6f6451]">
            <span>补充一句（选填）</span>
            <span className="text-[#a09680]">
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
            className="h-10 w-full rounded-[2px] border border-[#d8cbb2] bg-[#fffdf7] px-2.5 text-sm text-[#26221b] outline-none transition-colors placeholder:text-[#a09680] focus:border-[#a63a2c] focus:ring-2 focus:ring-[#a63a2c]/15 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
        <button
          id="ai-action"
          type="button"
          onClick={busy ? handleStop : handleGenerate}
          disabled={notConfigured || (!data && !busy)}
          className={`h-10 w-full rounded-[2px] px-6 text-sm tracking-[0.2em] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a63a2c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
            busy
              ? "border border-[#a63a2c] bg-transparent text-[#a63a2c] hover:bg-[#fbf2ec]"
              : "bg-[#a63a2c] text-[#fbf6ec] hover:bg-[#8f3024]"
          }`}
        >
          {actionLabel}
        </button>
        {!data ? (
          <span className="text-[11px] leading-5 text-[#786c57]">{HINT_NEEDS_RESULT}</span>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      <div
        id="ai-output"
        aria-busy={busy}
        className="min-h-[3rem] rounded-[2px] border border-[#ddd2bb] bg-[#fdfaf2] px-4 py-3"
      >
        {phase === "thinking" ? (
          <p className="text-sm leading-7 text-[#786c57]">正在推算…</p>
        ) : null}

        {hasAnswer ? (
          <div className="whitespace-pre-wrap break-words text-sm leading-7 text-[#3f382d]">
            {plainText(answer)}
            {phase === "streaming" ? (
              <span aria-hidden className="ml-0.5 text-[#a63a2c]">
                ▍
              </span>
            ) : null}
          </div>
        ) : null}

        {phase === "stopped" && hasAnswer ? (
          <p className="mt-2 text-[11px] leading-5 text-[#786c57]">
            已停止生成，上方为已生成的部分。
          </p>
        ) : null}

        {phase === "error" && errorText ? (
          <p role="alert" className="text-xs leading-5 text-[#a63a2c]">
            {errorText}
          </p>
        ) : null}

        {phase === "idle" && !hasAnswer ? (
          <p className="text-[11px] leading-5 text-[#786c57]">
            生成后，解读会在这里逐字出现。内容由模型生成，仅作传统文化参考。
          </p>
        ) : null}

        {stoppedEmpty ? (
          <p className="text-[11px] leading-5 text-[#786c57]">已停止，没有收到内容。</p>
        ) : null}
      </div>
    </section>
  );
}
