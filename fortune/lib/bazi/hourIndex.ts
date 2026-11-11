/**
 * 具体小时（0-23）→ 八字时辰序号（子=0 … 亥=11）。
 *
 * 采用 controller 裁决的映射（UI 用具体小时选择器，不再暴露「子时/晚子时」模糊标签）：
 * - 23 时 → 0（晚子时，排盘层据 `hour: 23` 换日）；
 * - 0 时 → 0（早子时）；
 * - 其余 h → `floor((h+1)/2) % 12`。
 *
 * 时辰窗口：子 23:00-01:00、丑 01:00-03:00 …… 亥 21:00-23:00。
 */
export function hourToHourIndex(hour: number): number {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`hour 需为 0-23 的整数：${hour}`);
  }
  if (hour === 23) return 0;
  return Math.floor((hour + 1) / 2) % 12;
}
