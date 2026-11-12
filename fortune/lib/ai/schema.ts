/**
 * AI 解读接口的入参 schema（zod）。
 *
 * 隐私口径（见 docs/superpowers/specs/2026-11-12-ai-interpret-design.md）：
 * 只允许「排盘结果」进 prompt——干支 / 五行计数 / 卦象 / 牌面。
 * 类型层就没有出生年月日字段，服务端再按白名单逐字段重建（见 `prompt.ts`），
 * 因此前端即使多传了 `y/m/d`、`qiYun.startSolar` 之类字段也不会进入模型上下文。
 *
 * 纯计算层：不 import React / app / components。
 */

import { z } from "zod";

/** 事项类别（前端下拉框同一份来源）。顺序即展示顺序。 */
export const TOPICS = [
  "事业",
  "感情",
  "财运",
  "健康",
  "学业",
  "出行",
  "决策",
  "其他",
] as const;

export type Topic = (typeof TOPICS)[number];

/** 补充语上限：超出部分由服务端截断（不报错，见 {@link normalizeExtra}）。 */
export const EXTRA_MAX = 100;

/** 传输层硬上限：远大于 100 只为挡住异常大包，正常输入不会命中。 */
const EXTRA_HARD_MAX = 1000;

/** 干支/卦名/牌名这类短标签：限长是为了防注入长文本塞进 user 段。 */
const shortLabel = z.string().min(1).max(8);
const nameLabel = z.string().min(1).max(20);
const wuXingCount = z.number().nonnegative();

/** 八字：四柱干支字符串 + 五行计数 + 大运干支，不含任何数字生辰。 */
export const baziDataSchema = z.object({
  siZhu: z.object({
    year: shortLabel,
    month: shortLabel,
    day: shortLabel,
    hour: shortLabel,
  }),
  wuXing: z.object({
    金: wuXingCount,
    木: wuXingCount,
    水: wuXingCount,
    火: wuXingCount,
    土: wuXingCount,
  }),
  daYun: z.array(shortLabel).max(12),
});

/** 六爻：本卦 / 变卦名 + 动爻索引（0-5 自下而上）+ 六爻装卦结果（6 爻）。 */
export const liuyaoDataSchema = z.object({
  benGua: nameLabel,
  bianGua: nameLabel,
  movingLines: z.array(z.number().int().min(0).max(5)).max(6),
  lines: z
    .array(
      z.object({
        ganzhi: shortLabel,
        liuQin: shortLabel,
        /** "世" / "应" / "" 等标记，限长即可，不做枚举以免前端口径变动就 400。 */
        shiYing: z.string().max(8),
      }),
    )
    .length(6),
});

/** 塔罗：牌阵名 + 每张牌的名称、位置含义、正逆位。 */
export const tarotDataSchema = z.object({
  spread: nameLabel,
  cards: z
    .array(
      z.object({
        name: nameLabel,
        position: nameLabel,
        reversed: z.boolean(),
      }),
    )
    .min(1)
    .max(10),
});

const requestBase = {
  topic: z.enum(TOPICS),
  extra: z.string().max(EXTRA_HARD_MAX).optional(),
};

/** 判别联合：`type` 决定 `data` 的形状。 */
export const interpretRequestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bazi"), data: baziDataSchema, ...requestBase }),
  z.object({ type: z.literal("liuyao"), data: liuyaoDataSchema, ...requestBase }),
  z.object({ type: z.literal("tarot"), data: tarotDataSchema, ...requestBase }),
]);

export type BaziData = z.infer<typeof baziDataSchema>;
export type LiuyaoData = z.infer<typeof liuyaoDataSchema>;
export type TarotData = z.infer<typeof tarotDataSchema>;
export type InterpretRequest = z.infer<typeof interpretRequestSchema>;

/**
 * 补充语归一化：去首尾空白并截断到 {@link EXTRA_MAX} 字。
 * 超长不报错（设计文档口径：服务端截断）。
 */
export function normalizeExtra(extra?: string): string {
  return (extra ?? "").trim().slice(0, EXTRA_MAX).trim();
}
