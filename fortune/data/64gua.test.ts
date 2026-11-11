import { describe, expect, it } from "vitest";
import {
  GUA64,
  NAJIA,
  PALACE_GUAS,
  PALACE_WUXING,
  ZHI_WUXING,
  getGua,
  type GuaEntry,
  type TrigramName,
} from "./najia-tables";

// 通行本卦序（上经30 + 下经34）
const KING_WEN_ORDER = [
  "乾", "坤", "屯", "蒙", "需", "讼", "师", "比", "小畜", "履", "泰", "否",
  "同人", "大有", "谦", "豫", "随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复",
  "无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒", "遁", "大壮", "晋", "明夷",
  "家人", "睽", "蹇", "解", "损", "益", "夬", "姤", "萃", "升", "困", "井",
  "革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅", "巽", "兑", "涣", "节",
  "中孚", "小过", "既济", "未济",
];

// 八经卦三画（自下而上：1=阳爻，0=阴爻）
const TRIGRAM_BITS: Record<TrigramName, [number, number, number]> = {
  乾: [1, 1, 1], 兑: [1, 1, 0], 离: [1, 0, 1], 震: [1, 0, 0],
  巽: [0, 1, 1], 坎: [0, 1, 0], 艮: [0, 0, 1], 坤: [0, 0, 0],
};

const PALACE_ORDER: TrigramName[] = ["乾", "坎", "艮", "震", "巽", "离", "坤", "兑"];
// 京房八宫变爻规则（相对本宫纯卦的变爻位）：本宫无变爻，一世变初爻……五世变五爻，
// 游魂 = 五世再变第四爻（变 0,1,2,4），归魂 = 内卦复原仅第四爻仍变（变 4）
const MUTATION_MASKS: number[][] = [
  [], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4],
];
// 各宫位次世爻：本宫5（八纯世在上爻），一世0，二世1，三世2，四世3，五世4，游魂4，归魂2
const SHI_BY_POS = [5, 0, 1, 2, 3, 4, 4, 2];

function derivePalace(xia: TrigramName, shang: TrigramName): { palace: TrigramName; pos: number } | null {
  const bits = [...TRIGRAM_BITS[xia], ...TRIGRAM_BITS[shang]];
  for (const p of PALACE_ORDER) {
    const pure = [...TRIGRAM_BITS[p], ...TRIGRAM_BITS[p]];
    for (let pos = 0; pos < 8; pos++) {
      const mask = MUTATION_MASKS[pos];
      const mutated = pure.map((b, i) => (mask.includes(i) ? 1 - b : b));
      if (mutated.every((b, i) => b === bits[i])) return { palace: p, pos };
    }
  }
  return null;
}

const byName = new Map<string, GuaEntry>(GUA64.map((g) => [g.name, g]));
const stripPunct = (s: string) => s.replace(/[，。、：；！？「」『』]/g, "");

describe("64gua 数据", () => {
  it("共 64 卦，名称与通行本卦序一致", () => {
    expect(GUA64).toHaveLength(64);
    expect(GUA64.map((g) => g.name)).toEqual(KING_WEN_ORDER);
    expect(new Set(GUA64.map((g) => g.name)).size).toBe(64);
  });

  it("上下卦组合唯一，覆盖全部 64 种组合", () => {
    const keys = GUA64.map((g) => `${g.xiaGua}-${g.shangGua}`);
    expect(new Set(keys).size).toBe(64);
  });

  it("每卦爻辞恰 6 条且自下而上非空", () => {
    for (const g of GUA64) {
      expect(g.yaoCi, g.name).toHaveLength(6);
      for (const y of g.yaoCi) expect(y.trim().length, `${g.name} 爻辞为空`).toBeGreaterThan(0);
    }
  });

  it("卦辞抽查：乾/坤（通行本原文）", () => {
    expect(byName.get("乾")!.guaCi).toBe("元亨。利贞。");
    expect(byName.get("坤")!.guaCi.startsWith("元亨。利牝马之贞。")).toBe(true);
  });

  it("卦辞抽查：既济/未济（去标点比对通行本文字）", () => {
    expect(stripPunct(byName.get("既济")!.guaCi)).toBe("亨小利贞初吉终乱");
    expect(stripPunct(byName.get("未济")!.guaCi)).toBe("亨小狐汔济濡其尾无攸利");
  });

  it("爻辞抽查：乾卦六爻自下而上（通行本原文）", () => {
    const q = byName.get("乾")!;
    expect(q.yaoCi[0]).toBe("潜龙勿用。");
    expect(q.yaoCi[1]).toBe("见龙在田，利见大人。");
    expect(q.yaoCi[5]).toBe("亢龙，有悔。");
    expect(q.yongCi).toBe("见群龙无首，吉。");
    expect(byName.get("坤")!.yongCi).toBe("利永贞。");
  });

  // 注：计划 pin 的"坤世3应0"与京房八宫制不符——八纯卦世爻在上爻（世5应2）；
  // 计划 pin 的"未济世5应2"同样不符——未济是离宫三世卦，世三爻（世2应5），与既济同。
  // 本测试按核对的正确值 pin（坤宫/离宫世应图及变爻规则双重验证），
  // 乾世5应2、坤世5/2、既济世2应5 与计划一致（未济按京房应为 2/5）。
  it("世应抽查：乾5/2、坤5/2、既济2/5、未济2/5；应爻恒为世爻+3", () => {
    expect(byName.get("乾")!.shiYao).toBe(5);
    expect(byName.get("乾")!.yingYao).toBe(2);
    expect(byName.get("坤")!.shiYao).toBe(5);
    expect(byName.get("坤")!.yingYao).toBe(2);
    expect(byName.get("既济")!.shiYao).toBe(2);
    expect(byName.get("既济")!.yingYao).toBe(5);
    expect(byName.get("未济")!.shiYao).toBe(2);
    expect(byName.get("未济")!.yingYao).toBe(5);
    for (const g of GUA64) expect(g.yingYao, g.name).toBe((g.shiYao + 3) % 6);
  });

  it("八宫归属与京房变爻规则一致，八宫各 8 卦且与宫序表相符", () => {
    const counts: Record<string, number> = {};
    for (const g of GUA64) {
      const d = derivePalace(g.xiaGua, g.shangGua);
      expect(d, `${g.name} 无法推导宫位`).not.toBeNull();
      expect(g.palaceGong, g.name).toBe(`${d!.palace}宫`);
      const pos = PALACE_GUAS[g.palaceGong].indexOf(g.name);
      expect(pos, `${g.name} 不在宫序表中`).toBeGreaterThanOrEqual(0);
      expect(pos, `${g.name} 宫内位次与变爻规则不符`).toBe(d!.pos);
      counts[g.palaceGong] = (counts[g.palaceGong] ?? 0) + 1;
    }
    for (const p of PALACE_ORDER) expect(counts[`${p}宫`], `${p}宫卦数`).toBe(8);
    for (const g of GUA64) {
      const pos = PALACE_GUAS[g.palaceGong].indexOf(g.name);
      expect(g.shiYao, `${g.name} 世爻`).toBe(SHI_BY_POS[pos]);
    }
  });

  it("用九/用六仅在乾坤两卦出现", () => {
    const withYong = GUA64.filter((g) => g.yongCi);
    expect(withYong.map((g) => g.name).sort()).toEqual(["乾", "坤"]);
  });

  it("按上下卦取卦：坎上离下既济、离上坎下未济、乾上乾下乾", () => {
    expect(getGua("坎", "离").name).toBe("既济");
    expect(getGua("离", "坎").name).toBe("未济");
    expect(getGua("乾", "乾").name).toBe("乾");
    expect(() => getGua("乾", "坤")).not.toThrow();
    expect(getGua("乾", "坤").name).toBe("否");
  });
});

describe("纳甲表", () => {
  it("乾卦六爻纳甲地支：子寅辰午申戌（自下而上），内甲外壬", () => {
    const q = NAJIA["乾"];
    expect(q.zhi).toEqual(["子", "寅", "辰", "午", "申", "戌"]);
    expect(q.gan).toEqual(["甲", "甲", "甲", "壬", "壬", "壬"]);
  });

  it("坤卦纳甲：内乙未巳卯、外癸丑亥酉", () => {
    const k = NAJIA["坤"];
    expect(k.zhi.slice(0, 3)).toEqual(["未", "巳", "卯"]);
    expect(k.zhi.slice(3)).toEqual(["丑", "亥", "酉"]);
    expect(k.gan.slice(0, 3)).toEqual(["乙", "乙", "乙"]);
    expect(k.gan.slice(3)).toEqual(["癸", "癸", "癸"]);
  });

  it("其余六经卦纳甲地支（阳卦顺行、阴卦逆行）", () => {
    expect(NAJIA["震"].zhi).toEqual(["子", "寅", "辰", "午", "申", "戌"]);
    expect(NAJIA["坎"].zhi).toEqual(["寅", "辰", "午", "申", "戌", "子"]);
    expect(NAJIA["艮"].zhi).toEqual(["辰", "午", "申", "戌", "子", "寅"]);
    expect(NAJIA["巽"].zhi).toEqual(["丑", "亥", "酉", "未", "巳", "卯"]);
    expect(NAJIA["离"].zhi).toEqual(["卯", "丑", "亥", "酉", "未", "巳"]);
    expect(NAJIA["兑"].zhi).toEqual(["巳", "卯", "丑", "亥", "酉", "未"]);
    expect(NAJIA["震"].gan.every((x) => x === "庚")).toBe(true);
    expect(NAJIA["坎"].gan.every((x) => x === "戊")).toBe(true);
    expect(NAJIA["艮"].gan.every((x) => x === "丙")).toBe(true);
    expect(NAJIA["巽"].gan.every((x) => x === "辛")).toBe(true);
    expect(NAJIA["离"].gan.every((x) => x === "己")).toBe(true);
    expect(NAJIA["兑"].gan.every((x) => x === "丁")).toBe(true);
  });

  it("八宫五行（六亲基准表）正确", () => {
    expect(PALACE_WUXING).toEqual({
      乾宫: "金", 坎宫: "水", 艮宫: "土", 震宫: "木",
      巽宫: "木", 离宫: "火", 坤宫: "土", 兑宫: "金",
    });
  });

  it("地支五行完整且抽查正确", () => {
    expect(Object.keys(ZHI_WUXING)).toHaveLength(12);
    expect(ZHI_WUXING["子"]).toBe("水");
    expect(ZHI_WUXING["午"]).toBe("火");
    expect(ZHI_WUXING["辰"]).toBe("土");
    expect(ZHI_WUXING["申"]).toBe("金");
  });

  it("六亲推导抽查：乾宫金（初九子水=子孙、九二寅木=妻财）、坤宫土（上六酉金=子孙、六三卯木=官鬼）", () => {
    const rel = (palace: string, zhi: string) => {
      // 生克序：木火土金水相生；木土水火金相克
      const WX: Record<string, number> = { 木: 0, 火: 1, 土: 2, 金: 3, 水: 4 };
      const p = PALACE_WUXING[palace as keyof typeof PALACE_WUXING];
      const d = (WX[ZHI_WUXING[zhi]] - WX[p] + 5) % 5;
      return ["兄弟", "子孙", "妻财", "官鬼", "父母"][d];
    };
    expect(rel("乾宫", "子")).toBe("子孙");
    expect(rel("乾宫", "寅")).toBe("妻财");
    expect(rel("坤宫", "酉")).toBe("子孙");
    expect(rel("坤宫", "卯")).toBe("官鬼");
    expect(rel("坤宫", "巳")).toBe("父母");
  });

  it("八宫卦序各 8 卦且本宫为首（纯卦）", () => {
    for (const p of PALACE_ORDER) {
      const seq = PALACE_GUAS[`${p}宫`];
      expect(seq, `${p}宫`).toHaveLength(8);
      expect(seq[0], `${p}宫首卦`).toBe(getGua(p, p).name);
    }
  });
});
