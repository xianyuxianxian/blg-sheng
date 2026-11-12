import { describe, expect, it } from "vitest";
import { getGua } from "../../data/najia-tables";
import { zhuangGua } from "./najia";
import { qiGuaByCoin, qiGuaByTime, trigramOfLines } from "./qigua";

/**
 * 掷币口径（Controller 裁决）
 * - 铜钱面值编码：3 = 字，2 = 背
 * - 每掷三枚，按「字」的枚数定爻：
 *   3 字 = 老阴（6，动）、2 字 = 少阳（7）、1 字 = 少阴（8）、0 字（3 背）= 老阳（9，动）
 * - tosses 6 次，索引 0 = 初爻（自下而上）
 */
const ZI = 3;
const BEI = 2;
const LAO_YIN = [ZI, ZI, ZI];
const SHAO_YANG = [ZI, ZI, BEI];
const SHAO_YIN = [ZI, BEI, BEI];
const LAO_YANG = [BEI, BEI, BEI];

describe("trigramOfLines：三爻阴阳 → 经卦", () => {
  it.each([
    [[true, true, true], "乾"],
    [[true, true, false], "兑"],
    [[true, false, true], "离"],
    [[true, false, false], "震"],
    [[false, true, true], "巽"],
    [[false, true, false], "坎"],
    [[false, false, true], "艮"],
    [[false, false, false], "坤"],
  ] as const)("%j → %s", (lines, name) => {
    expect(trigramOfLines([...lines])).toBe(name);
  });

  it("长度不是 3 抛 RangeError", () => {
    expect(() => trigramOfLines([true, true])).toThrow(RangeError);
  });
});

describe("qiGuaByCoin：注入掷币结果得确定卦象", () => {
  it("六次全老阳 → 乾为天，六爻皆动，变坤", () => {
    const r = qiGuaByCoin(Array.from({ length: 6 }, () => [...LAO_YANG]));
    expect(r.method).toBe("coin");
    expect(r.benGua.name).toBe("乾");
    expect(r.benGua.shangGua).toBe("乾");
    expect(r.benGua.xiaGua).toBe("乾");
    expect(r.lines).toEqual([true, true, true, true, true, true]);
    expect(r.yaoShu).toEqual([9, 9, 9, 9, 9, 9]);
    expect(r.movingLines).toEqual([0, 1, 2, 3, 4, 5]);
    expect(r.benGua.yao.every((y) => y.isMoving)).toBe(true);
    expect(r.bianGua?.name).toBe("坤");
  });

  it("六次全老阴 → 坤为地，六爻皆动，变乾", () => {
    const r = qiGuaByCoin(Array.from({ length: 6 }, () => [...LAO_YIN]));
    expect(r.benGua.name).toBe("坤");
    expect(r.benGua.palaceGong).toBe("坤宫");
    expect(r.yaoShu).toEqual([6, 6, 6, 6, 6, 6]);
    expect(r.movingLines).toEqual([0, 1, 2, 3, 4, 5]);
    expect(r.bianGua?.name).toBe("乾");
  });

  it("六次少阳 → 乾为天，无动爻，无变卦", () => {
    const r = qiGuaByCoin(Array.from({ length: 6 }, () => [...SHAO_YANG]));
    expect(r.benGua.name).toBe("乾");
    expect(r.yaoShu).toEqual([7, 7, 7, 7, 7, 7]);
    expect(r.movingLines).toEqual([]);
    expect(r.bianGua).toBeNull();
    expect(r.benGua.yao.some((y) => y.isMoving)).toBe(false);
  });

  it("六次少阴 → 坤为地，无动爻", () => {
    const r = qiGuaByCoin(Array.from({ length: 6 }, () => [...SHAO_YIN]));
    expect(r.benGua.name).toBe("坤");
    expect(r.yaoShu).toEqual([8, 8, 8, 8, 8, 8]);
    expect(r.movingLines).toEqual([]);
    expect(r.bianGua).toBeNull();
  });

  it("混合序列 pin：少阳/少阴/老阳/少阳/少阴/老阴 → 雷火丰，三、上爻动，变火雷噬嗑", () => {
    const r = qiGuaByCoin([
      [...SHAO_YANG], // 初爻 阳
      [...SHAO_YIN], // 二爻 阴
      [...LAO_YANG], // 三爻 阳 动
      [...SHAO_YANG], // 四爻 阳
      [...SHAO_YIN], // 五爻 阴
      [...LAO_YIN], // 上爻 阴 动
    ]);
    expect(r.lines).toEqual([true, false, true, true, false, false]);
    expect(r.yaoShu).toEqual([7, 8, 9, 7, 8, 6]);
    expect(r.benGua.name).toBe("丰");
    expect(r.benGua.shangGua).toBe("震");
    expect(r.benGua.xiaGua).toBe("离");
    expect(r.movingLines).toEqual([2, 5]);
    expect(r.bianGua?.name).toBe("噬嗑");
    expect(r.bianGua?.shangGua).toBe("离");
    expect(r.bianGua?.xiaGua).toBe("震");
  });

  it("本卦与 zhuangGua 同源：装卦、卦辞爻辞逐条一致", () => {
    const r = qiGuaByCoin([
      [...SHAO_YANG],
      [...SHAO_YIN],
      [...LAO_YANG],
      [...SHAO_YANG],
      [...SHAO_YIN],
      [...LAO_YIN],
    ]);
    const expectBen = zhuangGua("震", "离", [2, 5]);
    // 变卦六亲以本卦宫五行（丰在坎宫，水）为基准
    const expectBian = zhuangGua("离", "震", [2, 5], expectBen.palaceWuXing);
    expect(r.benGua).toEqual(expectBen);
    expect(r.bianGua).toEqual(expectBian);
    // 变卦的卦爻辞取该卦自身（丰 → 噬嗑）
    expect(r.bianGua?.benGua.guaCi).toBe(getGua("离", "震").guaCi);
  });

  it("变卦六亲以本卦宫五行论：遁（乾宫金）初爻动 → 同人（离宫火）仍按金推导", () => {
    const r = qiGuaByCoin([
      [...LAO_YIN], // 初爻 阴 动
      [...SHAO_YIN], // 二爻 阴
      [...SHAO_YANG], // 三爻 阳
      [...SHAO_YANG], // 四爻 阳
      [...SHAO_YANG], // 五爻 阳
      [...SHAO_YANG], // 上爻 阳
    ]);
    expect(r.benGua.name).toBe("遁");
    expect(r.benGua.palaceGong).toBe("乾宫");
    expect(r.benGua.palaceWuXing).toBe("金");
    expect(r.movingLines).toEqual([0]);
    expect(r.bianGua?.name).toBe("同人");
    expect(r.bianGua?.palaceGong).toBe("离宫");
    // 变卦自身宫五行是火，六亲仍按本卦乾宫金：
    // 卯木我克=妻财、丑土生我=父母、亥水我生=子孙、午火克我=官鬼、申金同我=兄弟、戌土生我=父母
    expect(r.bianGua?.yao.map((y) => y.liuQin)).toEqual([
      "妻财",
      "父母",
      "子孙",
      "官鬼",
      "兄弟",
      "父母",
    ]);
    // 世应仍取变卦自身（同人归魂世在三爻）；本卦遁为乾宫二世，世在二爻
    expect(r.benGua.shiYao).toBe(1);
    expect(r.bianGua?.shiYao).toBe(2);
  });

  it("不修改入参 tosses", () => {
    const tosses = Array.from({ length: 6 }, () => [...LAO_YANG]);
    const snapshot = JSON.stringify(tosses);
    qiGuaByCoin(tosses);
    expect(JSON.stringify(tosses)).toBe(snapshot);
  });

  it("掷币次数不是 6 抛 RangeError", () => {
    expect(() => qiGuaByCoin(Array.from({ length: 5 }, () => [...LAO_YANG]))).toThrow(RangeError);
    expect(() => qiGuaByCoin(Array.from({ length: 7 }, () => [...LAO_YANG]))).toThrow(RangeError);
  });

  it("单次掷币不是 3 枚抛 RangeError", () => {
    const bad = Array.from({ length: 6 }, () => [...LAO_YANG]);
    bad[2] = [ZI, BEI];
    expect(() => qiGuaByCoin(bad)).toThrow(RangeError);
  });

  it.each([[0], [1], [4], [1.5], [Number.NaN]])("非法面值 %s 抛 RangeError", (bad) => {
    const tosses = Array.from({ length: 6 }, () => [...LAO_YANG]);
    tosses[0] = [ZI, BEI, bad as number];
    expect(() => qiGuaByCoin(tosses)).toThrow(RangeError);
  });
});

describe("qiGuaByTime：梅花易数时间起卦", () => {
  it("2026-11-11 12:00（农历十月初三 午时）→ 雷火丰，三爻动", () => {
    const r = qiGuaByTime(new Date(2026, 10, 11, 12, 0, 0));
    expect(r.method).toBe("time");
    // 年支午=7，农历十月，初三，午时=7
    expect(r.basis).toEqual({
      yearZhi: "午",
      yearZhiNum: 7,
      lunarMonth: 10,
      lunarDay: 3,
      timeZhi: "午",
      timeZhiNum: 7,
      shangGuaNum: 4,
      xiaGuaNum: 3,
      movingNum: 3,
    });
    expect(r.benGua.name).toBe("丰");
    expect(r.benGua.shangGua).toBe("震");
    expect(r.benGua.xiaGua).toBe("离");
    expect(r.movingLines).toEqual([2]);
    expect(r.yaoShu).toEqual([7, 8, 9, 7, 8, 8]);
    expect(r.bianGua?.name).toBe("震");
  });

  it("2026-11-11 05:30（卯时 4）→ 下卦与动爻均除尽：取坤、上爻动", () => {
    const r = qiGuaByTime(new Date(2026, 10, 11, 5, 30, 0));
    // 年+月+日 = 20 → 20 mod 8 = 4 震（上卦）
    // 20 + 4 = 24 → 24 mod 8 = 0 → 8 坤（下卦）；24 mod 6 = 0 → 6 上爻动
    expect(r.basis?.shangGuaNum).toBe(4);
    expect(r.basis?.xiaGuaNum).toBe(8);
    expect(r.basis?.movingNum).toBe(6);
    expect(r.benGua.name).toBe("豫");
    expect(r.movingLines).toEqual([5]);
  });

  it("2026-11-15 13:30（农历十月初七 未时 8）→ 上下卦均取 8 坤，二爻动", () => {
    const r = qiGuaByTime(new Date(2026, 10, 15, 13, 30, 0));
    // 7 + 10 + 7 = 24 → 8 坤（上卦）；24 + 8 = 32 → 8 坤（下卦）；32 mod 6 = 2 二爻动
    expect(r.basis).toMatchObject({
      lunarMonth: 10,
      lunarDay: 7,
      timeZhi: "未",
      timeZhiNum: 8,
      shangGuaNum: 8,
      xiaGuaNum: 8,
      movingNum: 2,
    });
    expect(r.benGua.name).toBe("坤");
    expect(r.movingLines).toEqual([1]);
    expect(r.bianGua?.name).toBe("师");
  });

  it("22:30（当日，非晚子时）仍取当日农历日数", () => {
    const r = qiGuaByTime(new Date(2026, 10, 11, 22, 30, 0));
    expect(r.basis).toMatchObject({
      lunarMonth: 10,
      lunarDay: 3,
      timeZhi: "亥",
      timeZhiNum: 12,
    });
    // 年+月+日 = 20 → 4 震（上）；20 + 12 = 32 → 8 坤（下）；32 mod 6 = 2 二爻动
    expect(r.basis).toMatchObject({ shangGuaNum: 4, xiaGuaNum: 8, movingNum: 2 });
  });

  it("23:00 后晚子时归次日：2026-11-11 23:30 按十月初四、子时起卦", () => {
    const r = qiGuaByTime(new Date(2026, 10, 11, 23, 30, 0));
    // 次日 = 2026-11-12 农历十月初四；年支午 7
    expect(r.basis).toMatchObject({
      yearZhi: "午",
      yearZhiNum: 7,
      lunarMonth: 10,
      lunarDay: 4,
      timeZhi: "子",
      timeZhiNum: 1,
    });
    // 7 + 10 + 4 = 21 → 21 mod 8 = 5 巽（上）
    // 21 + 1 = 22 → 22 mod 8 = 6 坎（下）；22 mod 6 = 4 四爻动
    expect(r.basis).toMatchObject({ shangGuaNum: 5, xiaGuaNum: 6, movingNum: 4 });
    expect(r.benGua.name).toBe("涣");
    expect(r.movingLines).toEqual([3]);
    // 涣 四爻动 → 天水讼
    expect(r.bianGua?.name).toBe("讼");
  });

  it("晚子时跨农历月末：2026-12-08 23:30 归次日冬月初一", () => {
    const r = qiGuaByTime(new Date(2026, 11, 8, 23, 30, 0));
    expect(r.basis).toMatchObject({
      lunarMonth: 11,
      lunarDay: 1,
      timeZhi: "子",
      timeZhiNum: 1,
    });
    // 7 + 11 + 1 = 19 → 19 mod 8 = 3 离（上）；19 + 1 = 20 → 4 震（下）；20 mod 6 = 2 二爻动
    expect(r.basis).toMatchObject({ shangGuaNum: 3, xiaGuaNum: 4, movingNum: 2 });
    expect(r.benGua.name).toBe("噬嗑");
    expect(r.movingLines).toEqual([1]);
    // 噬嗑 二爻动 → 火泽睽
    expect(r.bianGua?.name).toBe("睽");
  });

  it("闰六月取本月数（2025-08-01 闰六月初八）", () => {
    const r = qiGuaByTime(new Date(2025, 7, 1, 12, 0, 0));
    // 巳年 6 + 闰六月 6 + 初八 8 = 20 → 4 震（上）；加午时 7 = 27 → 3 离（下）；27 mod 6 = 3 三爻动
    expect(r.basis).toEqual({
      yearZhi: "巳",
      yearZhiNum: 6,
      lunarMonth: 6,
      lunarDay: 8,
      timeZhi: "午",
      timeZhiNum: 7,
      shangGuaNum: 4,
      xiaGuaNum: 3,
      movingNum: 3,
    });
    expect(r.benGua.name).toBe("丰");
  });

  it("无效日期抛 RangeError", () => {
    expect(() => qiGuaByTime(new Date(Number.NaN))).toThrow(RangeError);
  });
});
