import { describe, expect, it } from "vitest";
import { GUA64, NAJIA, getGua, type TrigramName } from "../../data/najia-tables";
import { liuQinOf, zhuangGua } from "./najia";
import type { WuXing } from "./types";

/** 六亲 pin 用例：手工按「同我兄弟、生我父母、我生子孙、克我官鬼、我克妻财」推导 */
interface Pin {
  shangGua: TrigramName;
  xiaGua: TrigramName;
  name: string;
  palaceGong: string;
  palaceWuXing: WuXing;
  shiYao: number;
  yingYao: number;
  gan: string[];
  diZhi: string[];
  liuQin: string[];
}

const PINS: Pin[] = [
  // 乾宫本宫（八纯）：内甲子寅辰、外壬午申戌
  {
    shangGua: "乾",
    xiaGua: "乾",
    name: "乾",
    palaceGong: "乾宫",
    palaceWuXing: "金",
    shiYao: 5,
    yingYao: 2,
    gan: ["甲", "甲", "甲", "壬", "壬", "壬"],
    diZhi: ["子", "寅", "辰", "午", "申", "戌"],
    // 子水（金生水）=子孙、寅木（金克木）=妻财、辰土（土生金）=父母、
    // 午火（火克金）=官鬼、申金（同）=兄弟、戌土=父母
    liuQin: ["子孙", "妻财", "父母", "官鬼", "兄弟", "父母"],
  },
  // 坤宫本宫：内乙未巳卯、外癸丑亥酉
  {
    shangGua: "坤",
    xiaGua: "坤",
    name: "坤",
    palaceGong: "坤宫",
    palaceWuXing: "土",
    shiYao: 5,
    yingYao: 2,
    gan: ["乙", "乙", "乙", "癸", "癸", "癸"],
    diZhi: ["未", "巳", "卯", "丑", "亥", "酉"],
    // 未土兄弟、巳火（火生土）=父母、卯木（木克土）=官鬼、
    // 丑土兄弟、亥水（土克水）=妻财、酉金（土生金）=子孙
    liuQin: ["兄弟", "父母", "官鬼", "兄弟", "妻财", "子孙"],
  },
  // 坎宫三世 既济（坎上离下）：内己卯丑亥、外戊申戌子
  {
    shangGua: "坎",
    xiaGua: "离",
    name: "既济",
    palaceGong: "坎宫",
    palaceWuXing: "水",
    shiYao: 2,
    yingYao: 5,
    gan: ["己", "己", "己", "戊", "戊", "戊"],
    diZhi: ["卯", "丑", "亥", "申", "戌", "子"],
    // 卯木（水生木）=子孙、丑土（土克水）=官鬼、亥水兄弟、
    // 申金（金生水）=父母、戌土官鬼、子水兄弟
    liuQin: ["子孙", "官鬼", "兄弟", "父母", "官鬼", "兄弟"],
  },
  // 坤宫三世 泰（坤上乾下）：内甲子寅辰、外癸丑亥酉
  {
    shangGua: "坤",
    xiaGua: "乾",
    name: "泰",
    palaceGong: "坤宫",
    palaceWuXing: "土",
    shiYao: 2,
    yingYao: 5,
    gan: ["甲", "甲", "甲", "癸", "癸", "癸"],
    diZhi: ["子", "寅", "辰", "丑", "亥", "酉"],
    // 子水（土克水）=妻财、寅木（木克土）=官鬼、辰土兄弟、
    // 丑土兄弟、亥水妻财、酉金（土生金）=子孙
    liuQin: ["妻财", "官鬼", "兄弟", "兄弟", "妻财", "子孙"],
  },
  // 坤宫游魂 需（坎上乾下）：世四爻/应初爻
  {
    shangGua: "坎",
    xiaGua: "乾",
    name: "需",
    palaceGong: "坤宫",
    palaceWuXing: "土",
    shiYao: 3,
    yingYao: 0,
    gan: ["甲", "甲", "甲", "戊", "戊", "戊"],
    diZhi: ["子", "寅", "辰", "申", "戌", "子"],
    liuQin: ["妻财", "官鬼", "兄弟", "子孙", "兄弟", "妻财"],
  },
  // 乾宫一世 姤（乾上巽下）：世初爻/应四爻
  {
    shangGua: "乾",
    xiaGua: "巽",
    name: "姤",
    palaceGong: "乾宫",
    palaceWuXing: "金",
    shiYao: 0,
    yingYao: 3,
    gan: ["辛", "辛", "辛", "壬", "壬", "壬"],
    diZhi: ["丑", "亥", "酉", "午", "申", "戌"],
    liuQin: ["父母", "子孙", "兄弟", "官鬼", "兄弟", "父母"],
  },
];

describe("zhuangGua 装卦 pin（乾/坤/既济/泰/需/姤）", () => {
  for (const p of PINS) {
    it(`${p.name}：纳甲干支、六亲、世应、宫位`, () => {
      const r = zhuangGua(p.shangGua, p.xiaGua, []);

      expect(r.name).toBe(p.name);
      expect(r.shangGua).toBe(p.shangGua);
      expect(r.xiaGua).toBe(p.xiaGua);
      expect(r.palaceGong).toBe(p.palaceGong);
      expect(r.palaceWuXing).toBe(p.palaceWuXing);
      expect(r.shiYao).toBe(p.shiYao);
      expect(r.yingYao).toBe(p.yingYao);

      expect(r.yao).toHaveLength(6);
      expect(r.yao.map((y) => y.index)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(r.yao.map((y) => y.gan)).toEqual(p.gan);
      expect(r.yao.map((y) => y.diZhi)).toEqual(p.diZhi);
      expect(r.yao.map((y) => y.liuQin)).toEqual(p.liuQin);

      expect(r.yao.flatMap((y) => (y.isShi ? [y.index] : []))).toEqual([p.shiYao]);
      expect(r.yao.flatMap((y) => (y.isYing ? [y.index] : []))).toEqual([p.yingYao]);
      expect(r.yao.flatMap((y) => (y.isYing ? [y.index] : []))).toEqual([p.yingYao]);
      expect(r.yao.some((y) => y.isMoving)).toBe(false);
      expect(r.movingLines).toEqual([]);
    });
  }
});

describe("zhuangGua 的 liuQinBasis：变卦六亲以本卦宫五行论", () => {
  // 天火同人（乾上离下）：离宫归魂（世在三爻、应在六爻），纳甲 己卯己丑己亥 / 壬午壬申壬戌。
  // 以本卦乾宫金为「我」推导：卯木我克=妻财、丑土生我=父母、亥水我生=子孙、
  // 午火克我=官鬼、申金同我=兄弟、戌土生我=父母。
  it("传入金：六亲按金论，宫位/世应/纳甲仍取同人自身数据", () => {
    const r = zhuangGua("乾", "离", [0], "金");

    expect(r.name).toBe("同人");
    expect(r.palaceGong).toBe("离宫");
    // 自身宫位五行不随六亲基准改变
    expect(r.palaceWuXing).toBe("火");
    // 世应取同人自身（归魂世在三爻），不是乾宫遁的世应
    expect(r.shiYao).toBe(2);
    expect(r.yingYao).toBe(5);

    expect(r.yao.map((y) => y.gan)).toEqual(["己", "己", "己", "壬", "壬", "壬"]);
    expect(r.yao.map((y) => y.diZhi)).toEqual(["卯", "丑", "亥", "午", "申", "戌"]);
    expect(r.yao.map((y) => y.liuQin)).toEqual([
      "妻财",
      "父母",
      "子孙",
      "官鬼",
      "兄弟",
      "父母",
    ]);
    expect(r.yao.flatMap((y) => (y.isShi ? [y.index] : []))).toEqual([2]);
    expect(r.yao.flatMap((y) => (y.isYing ? [y.index] : []))).toEqual([5]);
  });

  it("缺省不传基准：仍按该卦自身宫五行（火）论，既有调用不受影响", () => {
    const r = zhuangGua("乾", "离", [0]);
    expect(r.yao.map((y) => y.liuQin)).toEqual([
      "父母",
      "子孙",
      "官鬼",
      "兄弟",
      "妻财",
      "子孙",
    ]);
  });
});

describe("六亲规则（以本宫五行为我）", () => {
  it("以金为我：同兄弟、生我父母、我生子孙、克我官鬼、我克妻财", () => {
    expect(liuQinOf("金", "金")).toBe("兄弟");
    expect(liuQinOf("金", "土")).toBe("父母"); // 土生金
    expect(liuQinOf("金", "水")).toBe("子孙"); // 金生水
    expect(liuQinOf("金", "火")).toBe("官鬼"); // 火克金
    expect(liuQinOf("金", "木")).toBe("妻财"); // 金克木
  });

  it("以水为我：同兄弟、生我父母、我生子孙、克我官鬼、我克妻财", () => {
    expect(liuQinOf("水", "水")).toBe("兄弟");
    expect(liuQinOf("水", "金")).toBe("父母");
    expect(liuQinOf("水", "木")).toBe("子孙");
    expect(liuQinOf("水", "土")).toBe("官鬼");
    expect(liuQinOf("水", "火")).toBe("妻财");
  });

  it("五行两两组合唯一定义：25 组恰好覆盖五类且每类 5 组", () => {
    const WX: WuXing[] = ["金", "木", "水", "火", "土"];
    const count: Record<string, number> = {};
    for (const me of WX) {
      for (const other of WX) {
        const r = liuQinOf(me, other);
        count[r] = (count[r] ?? 0) + 1;
      }
    }
    expect(count).toEqual({ 兄弟: 5, 父母: 5, 子孙: 5, 官鬼: 5, 妻财: 5 });
  });
});

describe("动爻标记", () => {
  it("传入的爻位索引被标记为 isMoving，其余不动", () => {
    const r = zhuangGua("坎", "离", [0, 2, 5]);
    expect(r.yao.map((y) => y.isMoving)).toEqual([true, false, true, false, false, true]);
    expect(r.movingLines).toEqual([0, 2, 5]);
  });

  it("动爻索引乱序/重复时归一化为升序去重", () => {
    const r = zhuangGua("乾", "乾", [5, 0, 0]);
    expect(r.movingLines).toEqual([0, 5]);
    expect(r.yao.map((y) => y.isMoving)).toEqual([true, false, false, false, false, true]);
  });

  it("六爻全动合法", () => {
    const r = zhuangGua("乾", "乾", [0, 1, 2, 3, 4, 5]);
    expect(r.yao.every((y) => y.isMoving)).toBe(true);
    expect(r.movingLines).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it.each([[-1], [6], [1.5], [Number.NaN]])("非法动爻索引 %s 抛 RangeError", (bad) => {
    expect(() => zhuangGua("乾", "乾", [bad])).toThrow(RangeError);
  });
});

describe("结果携带本卦卦爻辞引用（供 Task 8 变占取辞）", () => {
  it("benGua 与 64gua 数据同源，卦辞爻辞逐条一致", () => {
    for (const p of PINS) {
      const entry = getGua(p.shangGua, p.xiaGua);
      const r = zhuangGua(p.shangGua, p.xiaGua, [1]);
      expect(r.benGua.name).toBe(entry.name);
      expect(r.benGua.guaCi).toBe(entry.guaCi);
      expect(r.benGua.yaoCi).toEqual(entry.yaoCi);
      expect(r.benGua.yongCi).toBe(entry.yongCi);
      // 爻辞与 yao 数组同序号对齐
      expect(r.benGua.yaoCi).toHaveLength(r.yao.length);
    }
  });

  it("不修改共享数据（重复调用结果稳定）", () => {
    const snapshot = JSON.stringify(GUA64);
    const a = zhuangGua("坤", "乾", [0, 1]);
    const b = zhuangGua("坤", "乾", [0, 1]);
    expect(a).toEqual(b);
    expect(JSON.stringify(GUA64)).toBe(snapshot);
  });
});

describe("全 64 卦交叉验证（以数据为真值）", () => {
  // 独立于实现的生克表，用于复算六亲
  const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
  const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
  const ZHI_WX: Record<string, WuXing> = {
    子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
    午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
  };
  const PALACE_WX: Record<string, WuXing> = {
    乾宫: "金", 坎宫: "水", 艮宫: "土", 震宫: "木",
    巽宫: "木", 离宫: "火", 坤宫: "土", 兑宫: "金",
  };
  function relRaw(me: WuXing, other: WuXing): string {
    if (me === other) return "兄弟";
    if (SHENG[other] === me) return "父母";
    if (SHENG[me] === other) return "子孙";
    if (KE[other] === me) return "官鬼";
    if (KE[me] === other) return "妻财";
    throw new Error(`${me}/${other} 无生克关系`);
  }

  it("64 卦的卦名/宫位/世应/纳甲/六亲均与 64gua 数据及纳甲表一致", () => {
    expect(GUA64).toHaveLength(64);
    for (const g of GUA64) {
      const r = zhuangGua(g.shangGua, g.xiaGua, []);

      expect(r.name, g.name).toBe(g.name);
      expect(r.palaceGong, g.name).toBe(g.palaceGong);
      expect(r.shiYao, g.name).toBe(g.shiYao);
      expect(r.yingYao, g.name).toBe(g.yingYao);
      expect(r.palaceWuXing, g.name).toBe(PALACE_WX[g.palaceGong]);

      // 纳甲：内卦取前 3 位、外卦取后 3 位
      const inner = NAJIA[g.xiaGua];
      const outer = NAJIA[g.shangGua];
      expect(r.yao.map((y) => y.diZhi), g.name).toEqual([...inner.zhi.slice(0, 3), ...outer.zhi.slice(3)]);
      expect(r.yao.map((y) => y.gan), g.name).toEqual([...inner.gan.slice(0, 3), ...outer.gan.slice(3)]);

      for (const y of r.yao) {
        expect(y.wuXing, `${g.name} ${y.diZhi}`).toBe(ZHI_WX[y.diZhi]);
        expect(y.liuQin, `${g.name} 第${y.index + 1}爻`).toBe(relRaw(PALACE_WX[g.palaceGong], ZHI_WX[y.diZhi]));
      }
    }
  });
});
