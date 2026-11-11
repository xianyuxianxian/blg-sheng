import { describe, expect, it } from "vitest";
import { countWuXing, wuXingOfGan, wuXingOfZhi } from "./wuXing";
import { paiPan } from "./paiPan";

describe("wuXingOfGan", () => {
  it.each([
    ["甲", "木"],
    ["乙", "木"],
    ["丙", "火"],
    ["丁", "火"],
    ["戊", "土"],
    ["己", "土"],
    ["庚", "金"],
    ["辛", "金"],
    ["壬", "水"],
    ["癸", "水"],
  ])("%s → %s", (gan, wx) => {
    expect(wuXingOfGan(gan)).toBe(wx);
  });

  it("未知天干抛错", () => {
    expect(() => wuXingOfGan("X")).toThrow();
  });
});

describe("wuXingOfZhi", () => {
  it.each([
    ["寅", "木"],
    ["卯", "木"],
    ["巳", "火"],
    ["午", "火"],
    ["申", "金"],
    ["酉", "金"],
    ["亥", "水"],
    ["子", "水"],
    ["辰", "土"],
    ["戌", "土"],
    ["丑", "土"],
    ["未", "土"],
  ])("%s → %s", (zhi, wx) => {
    expect(wuXingOfZhi(zhi)).toBe(wx);
  });
});

describe("countWuXing", () => {
  it("四柱干支各计 1，总和恒为 8", () => {
    const pillars = [
      { gan: "庚", zhi: "午" },
      { gan: "壬", zhi: "午" },
      { gan: "辛", zhi: "亥" },
      { gan: "甲", zhi: "午" },
    ];
    const stat = countWuXing(pillars);
    expect(stat).toEqual({ 金: 2, 木: 1, 水: 2, 火: 3, 土: 0 });
    expect(Object.values(stat).reduce((a, b) => a + b, 0)).toBe(8);
  });

  it("多组生日总和恒为 8（未计藏干）", () => {
    for (const { y, m, d, hourIndex } of [
      { y: 1990, m: 6, d: 15, hourIndex: 6 },
      { y: 2020, m: 1, d: 1, hourIndex: 0 },
      { y: 1987, m: 2, d: 4, hourIndex: 11 },
      { y: 2000, m: 12, d: 31, hourIndex: 5 },
    ]) {
      const { wuXing } = paiPan({ y, m, d, hourIndex, gender: "m" });
      expect(Object.values(wuXing).reduce((a, b) => a + b, 0)).toBe(8);
    }
  });
});
