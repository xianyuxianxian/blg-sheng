"use client";

/**
 * 问事上下文：把「问事前置」选中的事项与补充语带给结果区内部的 AI 解读，
 * 避免为 AiInterpret 增加 props（其 props 契约保持不变）。
 *
 * 结果区外层的 `QuestionProvider` 由各页的起卦/排盘组件提供；
 * AiInterpret 用 `useQuestion()` 取初值，取不到时退化为「事业」。
 */

import { createContext, useContext, type ReactNode } from "react";
import type { Topic } from "@/lib/ai/schema";

export type Question = {
  /** 用户选中的事项；null 表示跳过（按「其他」处理）。 */
  topic: Topic | null;
  /** 补充一句（可为空）。 */
  extra: string;
};

const QuestionContext = createContext<Question | null>(null);

export function QuestionProvider({
  value,
  children,
}: {
  value: Question;
  children: ReactNode;
}) {
  return <QuestionContext.Provider value={value}>{children}</QuestionContext.Provider>;
}

export function useQuestion(): Question | null {
  return useContext(QuestionContext);
}

/** 结果区顶部「所问：事业（补充语）」一行。 */
export function QuestionBanner({
  question,
  className = "",
}: {
  question: Question;
  className?: string;
}) {
  const topic = question.topic ?? "其他";
  const extra = question.extra.trim();

  return (
    <p
      className={`flex flex-wrap items-baseline gap-x-2 gap-y-1 border-l-2 border-accent pl-3 ${className}`.trim()}
    >
      <span className="text-[10px] tracking-[0.3em] text-fg-faint">所问</span>
      <span className="font-serif text-[15px] leading-6 tracking-[0.08em] text-accent">
        {topic}
      </span>
      {question.topic === null ? (
        <span className="text-[11px] leading-5 text-fg-faint">未特别指明</span>
      ) : null}
      {extra ? (
        <span className="text-[11px] leading-5 text-fg-muted">· {extra}</span>
      ) : null}
    </p>
  );
}
