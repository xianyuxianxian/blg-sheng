import { describe, expect, it } from "vitest";
import { paiPan } from "./paiPan";

describe("paiPan 稳定已知盘", () => {
  it("1990-06-15 午时 男：四柱 庚午 壬午 辛亥 甲午", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });
    expect([
      r.siZhu.year.gan + r.siZhu.year.zhi,
      r.siZhu.month.gan + r.siZhu.month.zhi,
      r.siZhu.day.gan + r.siZhu.day.zhi,
      r.siZhu.hour.gan + r.siZhu.hour.zhi,
    ]).toEqual(["庚午", "壬午", "辛亥", "甲午"]);
  });

  it("1990-06-15 午时 男：藏干/纳音/十神 完整", () => {
    const { siZhu } = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });

    expect(siZhu.year).toMatchObject({
      hideGan: ["丁", "己"],
      naYin: "路旁土",
      shiShenGan: "劫财",
      shiShenZhi: ["七杀", "偏印"],
    });
    expect(siZhu.month).toMatchObject({
      hideGan: ["丁", "己"],
      naYin: "杨柳木",
      shiShenGan: "伤官",
      shiShenZhi: ["七杀", "偏印"],
    });
    expect(siZhu.day).toMatchObject({
      hideGan: ["壬", "甲"],
      naYin: "钗钏金",
      shiShenGan: "日主",
      shiShenZhi: ["伤官", "正财"],
    });
    expect(siZhu.hour).toMatchObject({
      hideGan: ["丁", "己"],
      naYin: "沙中金",
      shiShenGan: "正财",
      shiShenZhi: ["七杀", "偏印"],
    });
  });

  it("四柱的月支与时支与 hourIndex 一致（午时 → 午支）", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });
    expect(r.siZhu.hour.zhi).toBe("午");
  });
});

describe("paiPan 节气边界（立春换年柱）", () => {
  // 1987 立春 = 1987-02-04 16:51:40
  it("1987-02-03 午时：年柱 丙寅（立春前）", () => {
    const r = paiPan({ y: 1987, m: 2, d: 3, hourIndex: 6, gender: "m" });
    expect(r.siZhu.year.gan + r.siZhu.year.zhi).toBe("丙寅");
    expect(r.siZhu.month.gan + r.siZhu.month.zhi).toBe("辛丑");
  });

  it("1987-02-04 午时（12:30，立春时刻 16:51 之前）：年柱仍 丙寅", () => {
    const r = paiPan({ y: 1987, m: 2, d: 4, hourIndex: 6, gender: "m" });
    expect(r.siZhu.year.gan + r.siZhu.year.zhi).toBe("丙寅");
    expect(r.siZhu.month.gan + r.siZhu.month.zhi).toBe("辛丑");
  });

  it("1987-02-04 亥时（22:30，立春时刻之后）：年柱 丁卯、月柱 壬寅", () => {
    const r = paiPan({ y: 1987, m: 2, d: 4, hourIndex: 11, gender: "m" });
    expect(r.siZhu.year.gan + r.siZhu.year.zhi).toBe("丁卯");
    expect(r.siZhu.month.gan + r.siZhu.month.zhi).toBe("壬寅");
  });
});

describe("paiPan 子时换日", () => {
  it("早子时默认口径（00:30）：2020-01-01 日柱 癸卯", () => {
    const r = paiPan({ y: 2020, m: 1, d: 1, hourIndex: 0, gender: "m" });
    expect([
      r.siZhu.year.gan + r.siZhu.year.zhi,
      r.siZhu.month.gan + r.siZhu.month.zhi,
      r.siZhu.day.gan + r.siZhu.day.zhi,
      r.siZhu.hour.gan + r.siZhu.hour.zhi,
    ]).toEqual(["己亥", "丙子", "癸卯", "壬子"]);
    expect(r.note.join("\n")).toContain("早子时");
  });

  it("晚子时 2020-01-01 23:30：日柱进位为 01-02 之 甲辰，年月柱不进位", () => {
    const r = paiPan({ y: 2020, m: 1, d: 1, hourIndex: 0, hour: 23, minute: 30, gender: "m" });
    expect([
      r.siZhu.year.gan + r.siZhu.year.zhi,
      r.siZhu.month.gan + r.siZhu.month.zhi,
      r.siZhu.day.gan + r.siZhu.day.zhi,
      r.siZhu.hour.gan + r.siZhu.hour.zhi,
    ]).toEqual(["己亥", "丙子", "甲辰", "甲子"]);
    expect(r.note.join("\n")).toContain("晚子时");
  });

  it("晚子时与次日早子时的日柱一致", () => {
    const late = paiPan({ y: 2020, m: 1, d: 1, hourIndex: 0, hour: 23, minute: 30, gender: "m" });
    const early = paiPan({ y: 2020, m: 1, d: 2, hourIndex: 0, gender: "m" });
    expect(late.siZhu.day).toEqual(early.siZhu.day);
    expect(late.siZhu.hour).toEqual(early.siZhu.hour);
  });

  it("立春落在 23:00–24:00 之间时：晚子时只进日柱，年柱月柱走 23:xx 的节气状态", () => {
    // 1984 立春 = 1984-02-04 23:18:44
    const r = paiPan({ y: 1984, m: 2, d: 4, hourIndex: 0, hour: 23, minute: 5, gender: "m" });
    expect([
      r.siZhu.year.gan + r.siZhu.year.zhi,
      r.siZhu.month.gan + r.siZhu.month.zhi,
      r.siZhu.day.gan + r.siZhu.day.zhi,
      r.siZhu.hour.gan + r.siZhu.hour.zhi,
    ]).toEqual(["癸亥", "乙丑", "己巳", "甲子"]);
  });

  it("立春已过（23:30 > 23:18）：晚子时年柱为 甲子", () => {
    const r = paiPan({ y: 1984, m: 2, d: 4, hourIndex: 0, hour: 23, minute: 30, gender: "m" });
    expect([
      r.siZhu.year.gan + r.siZhu.year.zhi,
      r.siZhu.month.gan + r.siZhu.month.zhi,
      r.siZhu.day.gan + r.siZhu.day.zhi,
      r.siZhu.hour.gan + r.siZhu.hour.zhi,
    ]).toEqual(["甲子", "丙寅", "己巳", "甲子"]);
  });
});

describe("paiPan 大运", () => {
  it("阳年生男顺排：1990-06-15 午时男，首步 癸未（月柱壬午顺推）", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });
    expect(r.daYun).toHaveLength(10);
    expect(r.daYun[0]).toMatchObject({ ganZhi: "癸未", startAge: 8, endAge: 17, startYear: 1997 });
    expect(r.daYun[1].ganZhi).toBe("甲申");
  });

  it("阴年生男逆排：1991-03-20 辰时男，首步 庚寅（月柱辛卯逆推）", () => {
    const r = paiPan({ y: 1991, m: 3, d: 20, hourIndex: 4, gender: "m" });
    expect(r.daYun).toHaveLength(10);
    expect(r.daYun[0]).toMatchObject({ ganZhi: "庚寅", startAge: 5, endAge: 14, startYear: 1995 });
    expect(r.daYun[1].ganZhi).toBe("己丑");
  });

  it("阳年生女逆排：1990-06-15 午时女，首步 辛巳", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "f" });
    expect(r.daYun[0].ganZhi).toBe("辛巳");
  });

  it("大运十步干支连续（顺排每步前进一位）", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });
    expect(r.daYun.map((s) => s.ganZhi)).toEqual([
      "癸未",
      "甲申",
      "乙酉",
      "丙戌",
      "丁亥",
      "戊子",
      "己丑",
      "庚寅",
      "辛卯",
      "壬辰",
    ]);
    expect(r.daYun.map((s) => s.index)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("起运信息与顺逆写入 note", () => {
    const r = paiPan({ y: 1990, m: 6, d: 15, hourIndex: 6, gender: "m" });
    const text = r.note.join("\n");
    expect(text).toContain("顺排");
    expect(text).toContain("7年");
  });
});

describe("paiPan 输入校验", () => {
  it("hourIndex 超出 0-11 抛错", () => {
    expect(() => paiPan({ y: 1990, m: 6, d: 15, hourIndex: 12, gender: "m" })).toThrow(/hourIndex/);
  });

  it("非法日期抛错", () => {
    expect(() => paiPan({ y: 1990, m: 2, d: 30, hourIndex: 6, gender: "m" })).toThrow();
  });
});
