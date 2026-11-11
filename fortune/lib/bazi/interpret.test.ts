import { describe, expect, it } from "vitest";
import { interpretWuXing } from "./interpret";
import { WU_XING_ORDER, type WuXing, type WuXingStat } from "./types";
import { hourToHourIndex } from "./hourIndex";

/** 从部分计数构造完整 WuXingStat（未给的记 0）。 */
function stat(partial: Partial<WuXingStat>): WuXingStat {
  return { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0, ...partial };
}

describe("interpretWuXing 极端分布（某行 ≥4，偏枯）", () => {
  it("单行偏枯：只给这一段文案", () => {
    const out = interpretWuXing(stat({ 金: 4, 木: 1, 水: 1, 火: 1, 土: 1 }));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("金");
    expect(out[0]).toContain("偏枯");
    expect(out[0]).toContain("4");
  });

  it("两行同时偏枯：各给一段，不重复", () => {
    const out = interpretWuXing(stat({ 金: 4, 木: 4, 水: 0, 火: 0, 土: 0 }));
    // 2 段偏枯（金、木）+ 3 段缺失（水、火、土）
    expect(out).toHaveLength(5);
    expect(new Set(out).size).toBe(5);
    expect(out.join("\n")).toContain("金");
    expect(out.join("\n")).toContain("木");
  });

  it("每一行达到 4 都能落到自己的文案", () => {
    for (const wx of WU_XING_ORDER) {
      const out = interpretWuXing(stat({ [wx]: 4, ...othersExcept(wx) } as WuXingStat));
      expect(out).toHaveLength(1);
      expect(out[0]).toContain(wx);
      expect(out[0]).toContain("偏枯");
    }
  });
});

describe("interpretWuXing 极端分布（某行 = 0，缺失）", () => {
  it("单行缺失：只给这一段文案", () => {
    const out = interpretWuXing(stat({ 金: 3, 木: 2, 水: 2, 火: 1, 土: 0 }));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("土");
    expect(out[0]).toContain("缺");
  });

  it("每一行缺失都能落到自己的文案", () => {
    for (const wx of WU_XING_ORDER) {
      // 缺失行为 0，其余四行各 2，合计 8。
      const out = interpretWuXing(stat({ [wx]: 0, ...othersExcept(wx, 2) } as WuXingStat));
      expect(out).toHaveLength(1);
      expect(out[0]).toContain(wx);
      expect(out[0]).toContain("缺");
    }
  });
});

describe("interpretWuXing 均衡分布", () => {
  it("五行俱全且各行 1-2 个：给均衡文案", () => {
    const out = interpretWuXing(stat({ 金: 2, 木: 2, 水: 2, 火: 1, 土: 1 }));
    expect(out).toHaveLength(1);
    expect(out[0]).toContain("均衡");
  });

  it("均衡文案不夹带偏枯/缺失文案", () => {
    const out = interpretWuXing(stat({ 金: 1, 木: 2, 水: 2, 火: 2, 土: 1 }));
    expect(out.join("")).not.toContain("偏枯");
    expect(out.join("")).not.toContain("缺");
  });
});

describe("interpretWuXing 中间分布（把握不足）", () => {
  it("无 0 且无 ≥4：返回空数组", () => {
    expect(interpretWuXing(stat({ 金: 3, 木: 2, 水: 1, 火: 1, 土: 1 }))).toEqual([]);
    expect(interpretWuXing(stat({ 金: 2, 木: 3, 水: 1, 火: 1, 土: 1 }))).toEqual([]);
  });

  it("只要出现 0 就归为缺失，不按中间分布处理", () => {
    expect(interpretWuXing(stat({ 金: 3, 木: 3, 水: 1, 火: 1, 土: 0 }))).toHaveLength(1);
  });
});

describe("interpretWuXing 文案占位符", () => {
  it("所有输出都已替换 {n} 占位符", () => {
    const cases: WuXingStat[] = [
      stat({ 金: 4, 木: 1, 水: 1, 火: 1, 土: 1 }),
      stat({ 金: 3, 木: 2, 水: 2, 火: 1, 土: 0 }),
      stat({ 金: 2, 木: 2, 水: 2, 火: 1, 土: 1 }),
    ];
    for (const s of cases) {
      for (const line of interpretWuXing(s)) {
        expect(line).not.toContain("{n}");
      }
    }
  });
});

describe("hourToHourIndex 小时 → 时辰序号", () => {
  it("覆盖 0-23 全部小时", () => {
    // 小时 → 时辰序号：23-1 子(0)、1-3 丑(1)、3-5 寅(2) …… 21-23 亥(11)。
    // 0 时与 23 时同属子时，但 23 时在排盘层按晚子时换日。
    const expected: Record<number, number> = {
      0: 0,
      1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4,
      9: 5, 10: 5, 11: 6, 12: 6, 13: 7, 14: 7, 15: 8, 16: 8,
      17: 9, 18: 9, 19: 10, 20: 10, 21: 11, 22: 11, 23: 0,
    };
    for (const [hour, want] of Object.entries(expected)) {
      expect(hourToHourIndex(Number(hour)), `hour=${hour}`).toBe(want);
    }
  });

  it("非法小时抛错", () => {
    expect(() => hourToHourIndex(-1)).toThrow();
    expect(() => hourToHourIndex(24)).toThrow();
    expect(() => hourToHourIndex(1.5)).toThrow();
  });
});

/** 除 wx 外四行各 fill（与 wx 合计由调用方决定）。 */
function othersExcept(wx: WuXing, fill = 1): Partial<WuXingStat> {
  const out: Partial<WuXingStat> = {};
  for (const other of WU_XING_ORDER) {
    if (other !== wx) out[other] = fill;
  }
  return out;
}
