import { describe, expect, it } from "vitest";
import { getGua } from "../../data/najia-tables";
import { bianZhan } from "./bianZhan";
import { zhuangGua } from "./najia";
import type { Trigram } from "./types";

const QIAN = getGua("乾", "乾");
const KUN = getGua("坤", "坤");
const XIAO_GUO = getGua("震", "艮");
const BO = getGua("艮", "坤");
const DING = getGua("离", "巽");

/** 本卦/变卦均按「上卦、下卦、动爻」装卦，与 qiGua 产出一致 */
const z = (shangGua: Trigram, xiaGua: Trigram, moving: number[] = []) =>
  zhuangGua(shangGua, xiaGua, moving);

describe("bianZhan：朱熹《易学启蒙》变占七法", () => {
  it("0 爻动：占本卦卦辞", () => {
    const r = bianZhan(z("乾", "乾"), null, []);
    expect(r.movingCount).toBe(0);
    expect(r.rule).toContain("本卦卦辞");
    expect(r.items).toEqual([
      {
        gua: "本卦",
        guaName: "乾",
        kind: "卦辞",
        yaoIndex: null,
        yaoName: null,
        text: QIAN.guaCi,
        role: "主",
      },
    ]);
  });

  it("1 爻动：占本卦动爻爻辞", () => {
    const r = bianZhan(z("乾", "乾", [2]), null, [2]);
    expect(r.movingCount).toBe(1);
    expect(r.rule).toContain("本卦动爻爻辞");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      gua: "本卦",
      guaName: "乾",
      kind: "爻辞",
      yaoIndex: 2,
      yaoName: "九三",
      text: QIAN.yaoCi[2],
      role: "主",
    });
  });

  it("2 爻动：占本卦二动爻爻辞，上爻为主", () => {
    // 乾 二、四爻动 → 变卦 风火家人（二爻动不取变卦，此处仅验证变卦被忽略）
    const r = bianZhan(z("乾", "乾", [1, 3]), z("巽", "离", [1, 3]), [1, 3]);
    expect(r.movingCount).toBe(2);
    expect(r.rule).toContain("上爻为主");
    expect(r.items).toHaveLength(2);
    // 上爻（索引 3）为主，下爻（索引 1）为辅
    expect(r.items[0]).toMatchObject({ yaoIndex: 3, yaoName: "九四", role: "主", text: QIAN.yaoCi[3] });
    expect(r.items[1]).toMatchObject({ yaoIndex: 1, yaoName: "九二", role: "辅", text: QIAN.yaoCi[1] });
    expect(r.items.every((i) => i.gua === "本卦")).toBe(true);
  });

  it("3 爻动：占本卦及变卦卦辞，本卦为贞、变卦为悔", () => {
    // 乾 初、三、五爻动 → 变卦 坎为水
    const r = bianZhan(z("乾", "乾", [0, 2, 4]), z("坎", "坎", [0, 2, 4]), [0, 2, 4]);
    expect(r.movingCount).toBe(3);
    expect(r.rule).toContain("贞");
    expect(r.rule).toContain("悔");
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      gua: "本卦",
      guaName: "乾",
      kind: "卦辞",
      text: QIAN.guaCi,
      role: "贞",
    });
    expect(r.items[1]).toMatchObject({
      gua: "变卦",
      guaName: "坎",
      kind: "卦辞",
      text: getGua("坎", "坎").guaCi,
      role: "悔",
    });
  });

  it("4 爻动：占变卦二不动爻爻辞，下爻为主", () => {
    // 乾 初、二、五、上爻动 → 变卦 雷山小过，不动爻为三、四爻
    const r = bianZhan(z("乾", "乾", [0, 1, 4, 5]), z("震", "艮", [0, 1, 4, 5]), [0, 1, 4, 5]);
    expect(r.movingCount).toBe(4);
    expect(r.rule).toContain("下爻为主");
    expect(r.items).toHaveLength(2);
    expect(r.items[0]).toMatchObject({
      gua: "变卦",
      guaName: "小过",
      kind: "爻辞",
      yaoIndex: 2,
      yaoName: "九三",
      text: XIAO_GUO.yaoCi[2],
      role: "主",
    });
    expect(r.items[1]).toMatchObject({
      gua: "变卦",
      guaName: "小过",
      yaoIndex: 3,
      yaoName: "九四",
      text: XIAO_GUO.yaoCi[3],
      role: "辅",
    });
  });

  it("5 爻动：占变卦不动爻爻辞", () => {
    // 乾 初至五爻动 → 变卦 山地剥，不动爻为上爻
    const r = bianZhan(z("乾", "乾", [0, 1, 2, 3, 4]), z("艮", "坤", [0, 1, 2, 3, 4]), [0, 1, 2, 3, 4]);
    expect(r.movingCount).toBe(5);
    expect(r.rule).toContain("变卦不动爻爻辞");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      gua: "变卦",
      guaName: "剥",
      kind: "爻辞",
      yaoIndex: 5,
      yaoName: "上九",
      text: BO.yaoCi[5],
      role: "主",
    });
  });

  it("6 爻动 · 乾：占用九", () => {
    const r = bianZhan(z("乾", "乾", [0, 1, 2, 3, 4, 5]), z("坤", "坤", [0, 1, 2, 3, 4, 5]), [0, 1, 2, 3, 4, 5]);
    expect(r.movingCount).toBe(6);
    expect(r.rule).toContain("用九");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toEqual({
      gua: "本卦",
      guaName: "乾",
      kind: "用九",
      yaoIndex: null,
      yaoName: null,
      text: QIAN.yongCi,
      role: "主",
    });
  });

  it("6 爻动 · 坤：占用六", () => {
    const r = bianZhan(z("坤", "坤", [0, 1, 2, 3, 4, 5]), z("乾", "乾", [0, 1, 2, 3, 4, 5]), [0, 1, 2, 3, 4, 5]);
    expect(r.movingCount).toBe(6);
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({ kind: "用六", text: KUN.yongCi, gua: "本卦", role: "主" });
  });

  it("6 爻动 · 非乾坤：占变卦卦辞", () => {
    // 屯 六爻全动 → 变卦 火风鼎
    const r = bianZhan(z("坎", "震", [0, 1, 2, 3, 4, 5]), z("离", "巽", [0, 1, 2, 3, 4, 5]), [0, 1, 2, 3, 4, 5]);
    expect(r.movingCount).toBe(6);
    expect(r.rule).toContain("变卦卦辞");
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      gua: "变卦",
      guaName: "鼎",
      kind: "卦辞",
      text: DING.guaCi,
      role: "主",
    });
  });
});

describe("bianZhan：爻位名与入参校验", () => {
  it.each([
    [0, "初九"],
    [1, "九二"],
    [5, "上九"],
  ])("乾 第 %i 爻动 → %s", (index, name) => {
    const r = bianZhan(z("乾", "乾", [index]), null, [index]);
    expect(r.items[0].yaoName).toBe(name);
  });

  it.each([
    [0, "初六"],
    [2, "六三"],
    [5, "上六"],
  ])("坤 第 %i 爻动 → %s", (index, name) => {
    const r = bianZhan(z("坤", "坤", [index]), null, [index]);
    expect(r.items[0].yaoName).toBe(name);
  });

  it("动爻数三及以上缺变卦抛 RangeError", () => {
    expect(() => bianZhan(z("乾", "乾", [0, 1, 2]), null, [0, 1, 2])).toThrow(RangeError);
    expect(() => bianZhan(z("乾", "乾", [0, 1, 2, 3]), null, [0, 1, 2, 3])).toThrow(RangeError);
    expect(() => bianZhan(z("乾", "乾", [0, 1, 2, 3, 4]), null, [0, 1, 2, 3, 4])).toThrow(RangeError);
  });

  it("六爻动非乾坤缺变卦抛 RangeError", () => {
    expect(() => bianZhan(z("坎", "震", [0, 1, 2, 3, 4, 5]), null, [0, 1, 2, 3, 4, 5])).toThrow(RangeError);
  });

  it.each([[-1], [6], [1.5], [Number.NaN]])("非法动爻索引 %s 抛 RangeError", (bad) => {
    expect(() => bianZhan(z("乾", "乾", []), null, [bad])).toThrow(RangeError);
  });

  it("重复动爻索引按去重后计（与装卦一致）", () => {
    const r = bianZhan(z("乾", "乾", [1, 1, 3]), null, [1, 1, 3]);
    expect(r.movingCount).toBe(2);
    expect(r.items.map((i) => i.yaoIndex)).toEqual([3, 1]);
  });
});
