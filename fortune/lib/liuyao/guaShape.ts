/**
 * 卦象 ⇄ 经卦转换。
 *
 * 独立成模块的原因：`bianZhan.ts` 需要爻位阴阳（拼「九三」「六二」这类爻名），
 * 但不能因此把 `qigua.ts` 里的 lunar-typescript 拉进首屏 bundle。
 * 本模块零依赖，可被计算层任意引用。
 */

import type { Trigram } from "./types";

/**
 * 三爻阴阳 → 经卦。数组自下而上，`true` = 阳爻。
 * 通行符号：乾☰111、兑☱110、离☲101、震☳100、
 * 巽☴011、坎☵010、艮☶001、坤☷000（自下而上读）。
 */
export const TRIGRAM_LINES: Record<Trigram, [boolean, boolean, boolean]> = {
  乾: [true, true, true],
  兑: [true, true, false],
  离: [true, false, true],
  震: [true, false, false],
  巽: [false, true, true],
  坎: [false, true, false],
  艮: [false, false, true],
  坤: [false, false, false],
};

/** 卦象比特串 → 经卦（"111" 自下而上） */
const TRIGRAM_BY_KEY = new Map<string, Trigram>(
  (Object.entries(TRIGRAM_LINES) as [Trigram, boolean[]][]).map(([name, pattern]) => [
    pattern.map((y) => (y ? 1 : 0)).join(""),
    name,
  ]),
);

/**
 * 三爻阴阳取经卦。
 *
 * @param lines 三爻阴阳，自下而上（`[0]` = 该经卦初爻）
 */
export function trigramOfLines(lines: boolean[]): Trigram {
  if (lines.length !== 3) {
    throw new RangeError(`经卦必须恰好 3 爻，收到 ${lines.length} 爻`);
  }
  const gua = TRIGRAM_BY_KEY.get(lines.map((y) => (y ? 1 : 0)).join(""));
  if (!gua) {
    // 3 位二进制穷尽 8 种，走不到这里
    throw new Error(`未知卦象：${lines.join("")}`);
  }
  return gua;
}

/** 经卦取三爻阴阳，自下而上（渲染卦象用） */
export function linesOfTrigram(gua: Trigram): [boolean, boolean, boolean] {
  return [...TRIGRAM_LINES[gua]];
}
