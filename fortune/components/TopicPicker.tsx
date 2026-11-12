"use client";

/**
 * 问事前置：一排签筒式 chip（横滑 + scroll-snap）+ 可选补充语。
 *
 * 八项事项直接取 AI 的 `TOPICS`（唯一来源），保持前后端取值范围一致；
 * 六爻页传 `required`，未选时起卦按钮禁用（传统「一事一占」规矩）。
 */

import { EXTRA_MAX, TOPICS, type Topic } from "@/lib/ai/schema";
import type { SkinKind } from "@/components/topic-label";

export type TopicPickerProps = {
  kind: SkinKind;
  topic: Topic | null;
  onTopicChange: (topic: Topic | null) => void;
  extra: string;
  onExtraChange: (value: string) => void;
  /** 六爻：起卦前必选，未选不给提示语 */
  required?: boolean;
  disabled?: boolean;
  className?: string;
};

const EXTRA_PLACEHOLDER: Record<SkinKind, string> = {
  bazi: "例如：今年适合换工作吗",
  liuyao: "例如：这单合作能否谈成",
  tarot: "例如：这段关系的走向",
};

export function TopicPicker({
  kind,
  topic,
  onTopicChange,
  extra,
  onExtraChange,
  required = false,
  disabled = false,
  className = "",
}: TopicPickerProps) {
  const extraId = `${kind}-extra`;

  return (
    <section
      aria-labelledby={`${kind}-topic-heading`}
      className={className}
      data-share-hide
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-rule pb-2">
        <h2
          id={`${kind}-topic-heading`}
          className="font-serif text-[15px] tracking-[0.18em] text-fg"
        >
          所问之事
        </h2>
        <span className="text-[11px] leading-5 text-fg-faint">
          {required ? "起卦前必选 · 一事一占" : "可跳过，默认「其他」"}
        </span>
      </div>

      <div
        role="group"
        aria-label="所问之事类别"
        className="mt-3 flex gap-2 overflow-x-auto pb-2 [scroll-snap-type:x_mandatory] [scrollbar-width:thin]"
      >
        {TOPICS.map((item) => {
          const active = topic === item;
          return (
            <button
              key={item}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onTopicChange(active ? null : item)}
              className="chip tap disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="font-serif text-sm tracking-[0.14em]">{item}</span>
            </button>
          );
        })}
      </div>

      <label htmlFor={extraId} className="mt-3 flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between gap-2 text-[11px] tracking-[0.12em] text-fg-muted">
          <span>补充一句（选填）</span>
          <span className="text-fg-faint">
            {extra.length}/{EXTRA_MAX}
          </span>
        </span>
        <input
          id={extraId}
          type="text"
          maxLength={EXTRA_MAX}
          value={extra}
          disabled={disabled}
          onChange={(event) => onExtraChange(event.currentTarget.value)}
          placeholder={EXTRA_PLACEHOLDER[kind]}
          className="field"
        />
      </label>

      {required && !topic ? (
        <p className="mt-2 text-[11px] leading-5 text-accent">先选所问之事，再掷币起卦。</p>
      ) : null}
    </section>
  );
}
