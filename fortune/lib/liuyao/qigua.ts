/**
 * 起卦：掷币法（六爻）与时间法（梅花易数）。
 *
 * 纯计算层（无副作用、不取随机源）：
 * - 掷币：`qiGuaByCoin` 接收**注入**的掷币结果，便于测试与动画回放；
 *   真实随机在 Task 9 的 UI 层用 `lib/random.ts` 的 `randomInt` 组装后传入。
 * - 时间：`qiGuaByTime` 用传入 `Date` 的农历年支/月/日/时辰取数；
 *   23:00-23:59 为晚子时，归次日取农历日数（与八字页换日口径一致）。
 * - 变卦：翻转动爻（阳变阴、阴变阳）后重新取上下卦，再调 `zhuangGua` 装卦。
 *
 * 本模块禁止 import React / app / components。
 */

import { Solar } from "lunar-typescript";
import { linesOfTrigram, trigramOfLines } from "./guaShape";
import { zhuangGua } from "./najia";
import type { Trigram, ZhuangResult } from "./types";

export { linesOfTrigram, trigramOfLines } from "./guaShape";

/** 十二地支（子 1 … 亥 12） */
const ZHI = [
  "子", "丑", "寅", "卯", "辰", "巳",
  "午", "未", "申", "酉", "戌", "亥",
] as const;

/** 先天卦数 → 经卦：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8 */
const GUA_BY_NUM: Trigram[] = ["乾", "兑", "离", "震", "巽", "坎", "艮", "坤"];

/** 晚子时起点：23:00 起归次日（与八字页晚子时换日口径一致） */
const LATE_ZI_HOUR = 23;

/** 时间起卦的中间量：页面展示推算过程用 */
export interface QiGuaTimeBasis {
  /** 农历年支，如 "午" */
  yearZhi: string;
  /** 年支数：子 1 … 亥 12 */
  yearZhiNum: number;
  /** 农历月数（闰月取本月数，如闰六月 = 6） */
  lunarMonth: number;
  /** 农历日数 1-30 */
  lunarDay: number;
  /** 时支，如 "午" */
  timeZhi: string;
  /** 时辰数：子 1 … 亥 12 */
  timeZhiNum: number;
  /** 上卦卦数 1-8（先天卦数） */
  shangGuaNum: number;
  /** 下卦卦数 1-8 */
  xiaGuaNum: number;
  /** 动爻序数 1-6（1 = 初爻，自下而上） */
  movingNum: number;
}

/** 起卦结果：本卦装卦 + 变卦装卦（无动爻时变卦为 null） */
export interface QiGuaResult {
  /** 起卦方式 */
  method: "coin" | "time";
  /** 六爻阴阳，自下而上（[0] = 初爻）；`true` = 阳 */
  lines: boolean[];
  /** 六爻之数：6 老阴 / 7 少阳 / 8 少阴 / 9 老阳，与 `lines` 同序 */
  yaoShu: number[];
  /** 动爻索引，升序，自下而上 */
  movingLines: number[];
  /** 本卦装卦结果（含卦辞爻辞引用） */
  benGua: ZhuangResult;
  /** 变卦装卦结果；无动爻时为 null */
  bianGua: ZhuangResult | null;
  /** 时间起卦的推算中间量；掷币起卦为 null */
  basis: QiGuaTimeBasis | null;
}

/**
 * 由「六爻阴阳 + 动爻」组装起卦结果：本卦装卦，翻转动爻后再装变卦。
 *
 * 动爻在变卦上的标记与调用 `zhuangGua` 时保持一致（同一组索引），
 * 便于页面把两卦的动爻对齐展示。
 */
function buildResult(
  method: QiGuaResult["method"],
  lines: boolean[],
  yaoShu: number[],
  movingLines: number[],
  basis: QiGuaTimeBasis | null,
): QiGuaResult {
  const moving = [...new Set(movingLines)].sort((a, b) => a - b);
  const benGua = zhuangGua(
    trigramOfLines(lines.slice(3, 6)),
    trigramOfLines(lines.slice(0, 3)),
    moving,
  );

  let bianGua: ZhuangResult | null = null;
  if (moving.length > 0) {
    const flipped = lines.map((yang, i) => (moving.includes(i) ? !yang : yang));
    bianGua = zhuangGua(
      trigramOfLines(flipped.slice(3, 6)),
      trigramOfLines(flipped.slice(0, 3)),
      moving,
    );
  }

  return { method, lines: [...lines], yaoShu: [...yaoShu], movingLines: moving, benGua, bianGua, basis };
}

/** 铜钱字面（按 Controller 裁决编码） */
const ZI_FACE = 3;
/** 铜钱背面 */
const BEI_FACE = 2;

/**
 * 一次掷币（三枚）→ 爻，按「字」的枚数直索（下标 0-3）。
 *
 * 口径（Controller 裁决）：
 * - 3 字 = 老阴（6，动）
 * - 2 字 1 背 = 少阳（7，静）
 * - 1 字 2 背 = 少阴（8，静）
 * - 3 背 = 老阳（9，动）
 */
const BY_ZI_COUNT: { yaoShu: number; yang: boolean; moving: boolean }[] = [
  { yaoShu: 9, yang: true, moving: true }, // 0 字（3 背）= 老阳
  { yaoShu: 8, yang: false, moving: false }, // 1 字 2 背 = 少阴
  { yaoShu: 7, yang: true, moving: false }, // 2 字 1 背 = 少阳
  { yaoShu: 6, yang: false, moving: true }, // 3 字 = 老阴
];

/**
 * 掷币起卦。
 *
 * @param tosses 6 次掷币结果，索引 0 = 初爻（自下而上）；每次为 3 枚铜钱的面值，
 *   3 = 字、2 = 背（其它值/枚数抛 RangeError）
 */
export function qiGuaByCoin(tosses: number[][]): QiGuaResult {
  if (!Array.isArray(tosses) || tosses.length !== 6) {
    throw new RangeError(`掷币必须是 6 次，收到 ${Array.isArray(tosses) ? tosses.length : "非数组"}`);
  }

  const lines: boolean[] = [];
  const yaoShu: number[] = [];
  const movingLines: number[] = [];

  tosses.forEach((toss, i) => {
    if (!Array.isArray(toss) || toss.length !== 3) {
      throw new RangeError(`第 ${i + 1} 掷必须是 3 枚铜钱，收到 ${Array.isArray(toss) ? toss.length : "非数组"} 枚`);
    }
    let ziCount = 0;
    for (const face of toss) {
      if (face !== ZI_FACE && face !== BEI_FACE) {
        throw new RangeError(`铜钱面值只能是 3（字）或 2（背），第 ${i + 1} 掷收到：${face}`);
      }
      if (face === ZI_FACE) ziCount += 1;
    }
    const outcome = BY_ZI_COUNT[ziCount];
    if (!outcome) {
      // ziCount 只可能是 0-3，走不到这里
      throw new Error(`掷币结果无法解析：第 ${i + 1} 掷 ${ziCount} 字`);
    }
    lines.push(outcome.yang);
    yaoShu.push(outcome.yaoShu);
    if (outcome.moving) movingLines.push(i);
  });

  return buildResult("coin", lines, yaoShu, movingLines, null);
}

/** 余数取卦数/爻数：整除时取基数本身（8 或 6） */
function modOrSelf(n: number, base: number): number {
  const r = n % base;
  return r === 0 ? base : r;
}

/** 地支取序数：子 1 … 亥 12 */
function zhiNum(zhi: string): number {
  const idx = ZHI.indexOf(zhi as (typeof ZHI)[number]);
  if (idx < 0) throw new Error(`未知地支：${zhi}`);
  return idx + 1;
}

/**
 * 时间起卦（梅花易数）。
 *
 * 口径（Controller 裁决）：
 * - 年支数（子 1…亥 12，按**农历年**，即正月初一换年）、农历月数（1-12，闰月取本月数）、
 *   农历日数（1-30）
 * - 上卦数 = (年支数 + 月数 + 日数) mod 8，除尽取 8
 * - 下卦数 = (年支数 + 月数 + 日数 + 时辰数) mod 8，除尽取 8
 * - 动爻数 = (年支数 + 月数 + 日数 + 时辰数) mod 6，除尽取 6（1 = 初爻）
 * - 卦数 → 经卦：乾1 兑2 离3 震4 巽5 坎6 艮7 坤8（先天卦数）
 *
 * 时辰按子 1…亥 12；**23:00-23:59 为晚子时，归次日**：日数取次日的农历日
 * （月末自动进位到次月初一），时辰仍取子。与八字页的晚子时换日口径一致。
 *
 * @param date 起卦时刻（按运行环境本地时区解析）
 */
export function qiGuaByTime(date: Date): QiGuaResult {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RangeError("qiGuaByTime 需要有效的 Date");
  }

  const solar = Solar.fromDate(date);
  // 晚子时（23:00 起）归次日取农历日；nextDay 走公历日界，月末/年末进位由历法库处理
  const lunar = (solar.getHour() >= LATE_ZI_HOUR ? solar.nextDay(1) : solar).getLunar();
  const yearZhi = lunar.getYearZhi();
  const yearZhiNum = zhiNum(yearZhi);
  // lunar-typescript 闰月返回负数（如 -6），梅花易数按本月数取
  const lunarMonth = Math.abs(lunar.getMonth());
  const lunarDay = lunar.getDay();
  const timeZhi = lunar.getTimeZhi();
  const timeZhiNum = zhiNum(timeZhi);

  const daySum = yearZhiNum + lunarMonth + lunarDay;
  const shangGuaNum = modOrSelf(daySum, 8);
  const total = daySum + timeZhiNum;
  const xiaGuaNum = modOrSelf(total, 8);
  const movingNum = modOrSelf(total, 6);

  const lines = [
    ...linesOfTrigram(GUA_BY_NUM[xiaGuaNum - 1]),
    ...linesOfTrigram(GUA_BY_NUM[shangGuaNum - 1]),
  ];
  const movingIndex = movingNum - 1;
  const yaoShu = lines.map((yang, i) => {
    if (i === movingIndex) return yang ? 9 : 6;
    return yang ? 7 : 8;
  });

  return buildResult("time", lines, yaoShu, [movingIndex], {
    yearZhi,
    yearZhiNum,
    lunarMonth,
    lunarDay,
    timeZhi,
    timeZhiNum,
    shangGuaNum,
    xiaGuaNum,
    movingNum,
  });
}
