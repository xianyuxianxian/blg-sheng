import type { WuXingStat } from "./types";
import { wuXingEntries } from "./wuXing";
import {
  WU_XING_BALANCED,
  WU_XING_EXCESS,
  WU_XING_MISSING,
} from "../../data/bazi-wenan";

/** 偏枯阈值：某一行计数达到此值即视为「某行独旺」。 */
export const WU_XING_EXCESS_THRESHOLD = 4;

/**
 * 按五行分布生成解读文案。
 *
 * 只覆盖三类把握足够的分布：
 * 1. 某行 ≥4（`WU_XING_EXCESS_THRESHOLD`）→ 该行「偏枯」文案；
 * 2. 某行 =0 → 该行「缺失」文案；
 * 3. 五行俱全且各行相差 ≤1（sum=8 时即 2/2/2/1/1）→ 「均衡」文案。
 *
 * 其余（中间分布）返回空数组，由页面显示「暂无解读」——宁缺毋滥。
 *
 * 前置条件：`stat` 来自 `countWuXing`，五项之和为 8、各项为非负整数。
 * 多条命中时按金木水火土的固定顺序拼接，先偏枯后缺失。
 *
 * @returns 文案段落数组；无稳妥解读时为空数组。
 */
export function interpretWuXing(stat: WuXingStat): string[] {
  const entries = wuXingEntries(stat);
  const out: string[] = [];

  for (const [wx, n] of entries) {
    if (n >= WU_XING_EXCESS_THRESHOLD) {
      out.push(WU_XING_EXCESS[wx].replaceAll("{n}", String(n)));
    }
  }

  for (const [wx, n] of entries) {
    if (n === 0) out.push(WU_XING_MISSING[wx]);
  }

  if (out.length === 0) {
    const counts = entries.map(([, n]) => n);
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    // 五行俱全（min>0）且分布平缓（极差 ≤1）才算均衡；
    // 3/3/1/1/0 这类虽有 3 行不低，仍不入「均衡」。
    if (min > 0 && max - min <= 1) out.push(WU_XING_BALANCED);
  }

  return out;
}
