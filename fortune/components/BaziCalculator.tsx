"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { BaziResult, type BirthSummary } from "@/components/BaziResult";
import { ShareButton } from "@/components/ShareCard";
import { QuestionBanner, QuestionProvider, type Question } from "@/components/QuestionContext";
import { TopicPicker } from "@/components/TopicPicker";
import { topicActionLabel } from "@/components/topic-label";
import { hourToHourIndex } from "@/lib/bazi/hourIndex";
import type { Topic } from "@/lib/ai/schema";
import type { PaiPanResult } from "@/lib/bazi/types";

type Gender = "m" | "f";

type Outcome = {
  result: PaiPanResult;
  birth: BirthSummary;
  gender: Gender;
  /** 排盘时定格的所问（事项 + 补充语），随结果展示并进 AI prompt。 */
  question: Question;
};

const SHI_CHEN_NAMES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DEFAULT_MINUTE = 30;

/** 小时选项文案：00 时（早子时）… 23 时（晚子时）。 */
function hourOptionLabel(hour: number): string {
  const shiChen = SHI_CHEN_NAMES[hourToHourIndex(hour)];
  const suffix = hour === 23 ? "晚子时" : hour === 0 ? "早子时" : `${shiChen}时`;
  return `${String(hour).padStart(2, "0")} 时（${suffix}）`;
}

/** 该年该月的天数；年份未填时按 31 天给选项。 */
function daysInMonth(year: number, month: number): number {
  if (!Number.isInteger(year) || year < 1) return 31;
  return new Date(year, month, 0).getDate();
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-[11px] tracking-[0.12em] text-fg-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

export function BaziCalculator() {
  const [yearText, setYearText] = useState("");
  const [month, setMonth] = useState(1);
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(12);
  const [minuteText, setMinuteText] = useState(String(DEFAULT_MINUTE));
  const [gender, setGender] = useState<Gender>("m");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [extra, setExtra] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  /** 分享图截图目标：结果区内容，不含外框与按钮。 */
  const resultRef = useRef<HTMLDivElement | null>(null);

  const year = Number(yearText.trim());
  const effectiveDay = Math.min(day, daysInMonth(year, month));
  const askLabel = topicActionLabel("bazi", topic);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      setOutcome(null);
      setError("出生年需为 1900–2100 之间的整数（公历）。");
      return;
    }
    const minute = minuteText.trim() === "" ? DEFAULT_MINUTE : Number(minuteText);
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      setOutcome(null);
      setError("分钟需为 0–59 的整数；留空按 30 分计。");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // lunar-typescript 体积较大：只在提交时动态引入，避免进入首屏 bundle。
      const { paiPan } = await import("@/lib/bazi/paiPan");
      const result = paiPan({
        y: year,
        m: month,
        d: effectiveDay,
        hourIndex: hourToHourIndex(hour),
        gender,
        hour,
        minute,
      });
      setOutcome({
        result,
        birth: { y: year, m: month, d: effectiveDay, hour, minute },
        gender,
        question: { topic, extra: extra.trim() },
      });
    } catch (err) {
      setOutcome(null);
      setError(err instanceof Error ? err.message : "排盘失败，请检查输入的日期与时刻。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <TopicPicker
        kind="bazi"
        topic={topic}
        onTopicChange={setTopic}
        extra={extra}
        onExtraChange={setExtra}
        disabled={loading}
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7"
      >
        <div className="grid grid-cols-3 gap-3">
          <Field label="出生年" htmlFor="bazi-year">
            <input
              id="bazi-year"
              name="year"
              type="number"
              inputMode="numeric"
              min={1900}
              max={2100}
              placeholder="公历 1990"
              value={yearText}
              onChange={(e) => setYearText(e.currentTarget.value)}
              className="field"
              autoComplete="bday-year"
            />
          </Field>

          <Field label="月" htmlFor="bazi-month">
            <select
              id="bazi-month"
              name="month"
              value={month}
              onChange={(e) => setMonth(Number(e.currentTarget.value))}
              className="field"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </Field>

          <Field label="日" htmlFor="bazi-day">
            <select
              id="bazi-day"
              name="day"
              value={effectiveDay}
              onChange={(e) => setDay(Number(e.currentTarget.value))}
              className="field"
            >
              {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d} 日
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="时（0–23）" htmlFor="bazi-hour">
            <select
              id="bazi-hour"
              name="hour"
              value={hour}
              onChange={(e) => setHour(Number(e.currentTarget.value))}
              className="field"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourOptionLabel(h)}
                </option>
              ))}
            </select>
          </Field>

          <Field label="分（默认 30）" htmlFor="bazi-minute">
            <input
              id="bazi-minute"
              name="minute"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              value={minuteText}
              onChange={(e) => setMinuteText(e.currentTarget.value)}
              className="field"
            />
          </Field>

          <fieldset className="col-span-2 sm:col-span-1">
            <legend className="mb-1.5 block text-[11px] tracking-[0.12em] text-fg-muted">
              性别（定大运顺逆）
            </legend>
            <div className="flex gap-1 rounded-[2px] border border-rule bg-surface p-1">
              {(
                [
                  ["m", "男"],
                  ["f", "女"],
                ] as const
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`tap flex-1 cursor-pointer rounded-[1px] py-1.5 text-center text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--focus-ring)] ${
                    gender === value
                      ? "bg-cta text-on-cta"
                      : "text-fg-soft hover:bg-surface-3"
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={value}
                    checked={gender === value}
                    onChange={() => setGender(value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-xs leading-5 text-accent">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={loading}
            className="tap h-11 w-full rounded-[2px] bg-cta px-8 text-sm tracking-[0.25em] text-on-cta hover:bg-cta-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? "推演中…" : askLabel ?? "排盘"}
          </button>
          <p className="text-[11px] leading-5 text-fg-faint">生辰只在你的浏览器中计算，不会上传。</p>
        </div>
      </form>

      <div aria-live="polite" aria-busy={loading}>
        {loading ? (
          <div className="rounded-[2px] border border-dashed border-rule px-5 py-8 text-center">
            <p className="font-serif text-sm tracking-[0.2em] text-fg-soft">推演中…</p>
            <p className="mt-2 text-[11px] leading-5 text-fg-faint">
              首次排盘需加载历法引擎，请稍候。
            </p>
          </div>
        ) : outcome ? (
          <div className="space-y-4">
            <div className="rounded-[2px] border border-rule bg-surface-2 p-5 sm:p-7">
              <div ref={resultRef} className="space-y-6">
                <QuestionBanner question={outcome.question} />
                <QuestionProvider value={outcome.question}>
                  <BaziResult result={outcome.result} birth={outcome.birth} gender={outcome.gender} />
                </QuestionProvider>
              </div>
            </div>
            <ShareButton
              targetRef={resultRef}
              fileName="bazi"
              label="八字排盘"
              birthPrivacy
            />
          </div>
        ) : (
          <p className="border-t border-rule pt-5 text-[11px] leading-5 text-fg-faint">
            填好生辰后点「{askLabel ?? "排盘"}」，四柱、五行、大运与取象会出现在这里。
          </p>
        )}
      </div>
    </div>
  );
}
