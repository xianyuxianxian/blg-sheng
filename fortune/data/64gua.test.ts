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

/**
 * 京房八宫变爻规则（相对本宫纯卦的变爻位）：
 * 本宫(无变) → 一世(0) → 二世(0,1) → 三世(0,1,2) → 四世(0,1,2,3) → 五世(0,1,2,3,4)
 * → 游魂(五世再变四爻：0,1,2,4) → 归魂(内卦复原、仅四爻变：4)
 */
const MUTATION_MASKS: number[][] = [
  [], [0], [0, 1], [0, 1, 2], [0, 1, 2, 3], [0, 1, 2, 3, 4], [0, 1, 2, 4], [4],
];

/**
 * 宫位次序 → 世应（独立语义表，不引用被测模块的常量）：
 * 本宫世5应2；一世0/3；二世1/4；三世2/5；四世3/0；五世4/1；游魂3/0；归魂2/5
 */
const POSITION_LABELS = ["本宫", "一世", "二世", "三世", "四世", "五世", "游魂", "归魂"];
const EXPECT_SHI_YING: ReadonlyArray<readonly [number, number]> = [
  [5, 2], [0, 3], [1, 4], [2, 5], [3, 0], [4, 1], [3, 0], [2, 5],
];

function derivePalace(xia: TrigramName, shang: TrigramName): { palace: TrigramName; pos: number } {
  const bits = [...TRIGRAM_BITS[xia], ...TRIGRAM_BITS[shang]];
  for (const p of PALACE_ORDER) {
    const pure = [...TRIGRAM_BITS[p], ...TRIGRAM_BITS[p]];
    for (let pos = 0; pos < 8; pos++) {
      const mask = MUTATION_MASKS[pos];
      const mutated = pure.map((b, i) => (mask.includes(i) ? 1 - b : b));
      if (mutated.every((b, i) => b === bits[i])) return { palace: p, pos };
    }
  }
  throw new Error(`无法推导宫位：${xia}下${shang}上`);
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

  it("卦辞抽查：乾/坤/既济/未济（去标点比对通行本文字）", () => {
    expect(stripPunct(byName.get("乾")!.guaCi)).toBe("元亨利贞");
    expect(stripPunct(byName.get("坤")!.guaCi)).toBe(
      "元亨利牝马之贞君子有攸往先迷后得主利西南得朋东北丧朋安贞吉",
    );
    expect(stripPunct(byName.get("既济")!.guaCi)).toBe("亨小利贞初吉终乱");
    expect(stripPunct(byName.get("未济")!.guaCi)).toBe("亨小狐汔济濡其尾无攸利");
  });

  // 世应：按宫位次序语义表独立断言全部 64 卦。
  // 宫位与位次由变爻规则从卦象比特独立推导（不读数据里的 palaceGong/shiYao/PALACE_GUAS 次序）。
  it("世应：全 64 卦符合京房宫位世应（本宫5/2 一世0/3 二世1/4 三世2/5 四世3/0 五世4/1 游魂3/0 归魂2/5）", () => {
    for (const g of GUA64) {
      const { palace, pos } = derivePalace(g.xiaGua, g.shangGua);
      const label = POSITION_LABELS[pos];
      const [shi, ying] = EXPECT_SHI_YING[pos];
      expect(g.palaceGong, `${g.name} 宫位`).toBe(`${palace}宫`);
      expect(g.shiYao, `${g.name}（${label}）世爻`).toBe(shi);
      expect(g.yingYao, `${g.name}（${label}）应爻`).toBe(ying);
      expect(PALACE_GUAS[g.palaceGong][pos], `${g.name} 宫序位次`).toBe(g.name);
      expect(PALACE_GUAS[g.palaceGong]).toHaveLength(8);
    }
  });

  it("世应抽查：乾5/2、坤5/2、既济2/5、未济2/5、游魂需3/0", () => {
    expect([byName.get("乾")!.shiYao, byName.get("乾")!.yingYao]).toEqual([5, 2]);
    expect([byName.get("坤")!.shiYao, byName.get("坤")!.yingYao]).toEqual([5, 2]);
    expect([byName.get("既济")!.shiYao, byName.get("既济")!.yingYao]).toEqual([2, 5]);
    expect([byName.get("未济")!.shiYao, byName.get("未济")!.yingYao]).toEqual([2, 5]);
    // 游魂八卦：世四爻、应初爻
    for (const n of ["需", "讼", "晋", "明夷", "中孚", "大过", "颐", "小过"]) {
      expect([byName.get(n)!.shiYao, byName.get(n)!.yingYao], `${n} 游魂`).toEqual([3, 0]);
    }
  });

  it("八宫各 8 卦、宫序首位为纯卦，且宫序与变爻推导一致", () => {
    const counts: Record<string, number> = {};
    for (const g of GUA64) {
      counts[g.palaceGong] = (counts[g.palaceGong] ?? 0) + 1;
    }
    for (const p of PALACE_ORDER) {
      expect(counts[`${p}宫`], `${p}宫卦数`).toBe(8);
      const pure = getGua(p, p);
      expect(PALACE_GUAS[`${p}宫`][0], `${p}宫首卦`).toBe(pure.name);
      expect(pure.shiYao, `${p}宫本宫卦世爻`).toBe(5);
      expect(pure.yingYao, `${p}宫本宫卦应爻`).toBe(2);
    }
  });

  it("用九/用六仅在乾坤两卦出现", () => {
    const withYong = GUA64.filter((g) => g.yongCi);
    expect(withYong.map((g) => g.name).sort()).toEqual(["乾", "坤"]);
  });

  it("按上下卦取卦：坎上离下既济、离上坎下未济、乾上坤下否", () => {
    expect(getGua("坎", "离").name).toBe("既济");
    expect(getGua("离", "坎").name).toBe("未济");
    expect(getGua("乾", "乾").name).toBe("乾");
    expect(getGua("乾", "坤").name).toBe("否");
    expect(getGua("坤", "乾").name).toBe("泰");
  });
});

// 期望原文 fixture：卦辞 + 六爻辞（自下而上），防异文回归
const FIXTURES: Record<string, { guaCi: string; yaoCi: string[]; yongCi?: string }> = {
  乾: {
    guaCi: "元亨。利贞。",
    yaoCi: [
      "潜龙勿用。",
      "见龙在田，利见大人。",
      "君子终日乾乾，夕惕若；厉，无咎。",
      "或跃在渊，无咎。",
      "飞龙在天，利见大人。",
      "亢龙，有悔。",
    ],
    yongCi: "见群龙无首，吉。",
  },
  坤: {
    guaCi: "元亨。利牝马之贞。君子有攸往，先迷后得主。利西南得朋，东北丧朋。安贞，吉。",
    yaoCi: [
      "履霜，坚冰至。",
      "直方大，不习无不利。",
      "含章，可贞。或从王事，无成有终。",
      "括囊，无咎无誉。",
      "黄裳，元吉。",
      "龙战于野，其血玄黄。",
    ],
    yongCi: "利永贞。",
  },
  泰: {
    guaCi: "小往大来，吉亨。",
    yaoCi: [
      "拔茅茹以其汇，征吉。",
      "包荒。用冯河，不遐遗；朋亡。得尚于中行。",
      "无平不陂，无往不复，艰贞无咎。勿恤其孚，于食有福。",
      "翩翩，不富以其邻；不戒以孚。",
      "帝乙归妹，以祉，元吉。",
      "城复于隍，勿用师，自邑告命，贞吝。",
    ],
  },
  否: {
    guaCi: "否之匪人，不利君子贞，大往小来。",
    yaoCi: [
      "拔茅茹以其汇，贞吉。亨。",
      "包承，小人吉，大人否。亨。",
      "包羞。",
      "有命，无咎，畴离祉。",
      "休否，大人吉。其亡其亡，系于苞桑。",
      "倾否，先否后喜。",
    ],
  },
  既济: {
    guaCi: "亨小。利贞。初吉终乱。",
    yaoCi: [
      "曳其轮，濡其尾，无咎。",
      "妇丧其茀，勿逐，七日得。",
      "高宗伐鬼方，三年克之，小人勿用。",
      "𦈡有衣袽，终日戒。",
      "东邻杀牛，不如西邻之禴祭，实受其福。",
      "濡其首，厉。",
    ],
  },
  未济: {
    guaCi: "亨。小狐汔济，濡其尾，无攸利。",
    yaoCi: [
      "濡其尾，吝。",
      "曳其轮，贞吉。",
      "未济，征凶，利涉大川。",
      "贞吉，悔亡，震用伐鬼方，三年有赏于大国。",
      "贞吉，无悔，君子之光，有孚，吉。",
      "有孚于饮酒，无咎，濡其首，有孚失是。",
    ],
  },
};

describe("卦爻辞原文 fixtures（乾坤泰否既济未济，防异文回归）", () => {
  for (const [name, fx] of Object.entries(FIXTURES)) {
    it(`${name}：卦辞 + 六爻辞整句一致`, () => {
      const g = byName.get(name)!;
      expect(stripPunct(g.guaCi)).toBe(stripPunct(fx.guaCi));
      expect(g.yaoCi.map(stripPunct)).toEqual(fx.yaoCi.map(stripPunct));
      if (fx.yongCi) expect(stripPunct(g.yongCi!)).toBe(stripPunct(fx.yongCi));
    });
  }
});

describe("异文取字回归（通行本侧）", () => {
  // [卦, 爻索引(0=初爻), 必须包含的通行本片段, 不得出现的旧异文片段]
  const CASES: Array<[string, number, string, string]> = [
    ["蛊", 0, "干父之蛊", "乾父之蛊"],
    ["蛊", 1, "干母之蛊", "乾母之蛊"],
    ["蛊", 2, "干父之蛊", "乾父之蛊"],
    ["蛊", 4, "干父之蛊", "乾父之蛊"],
    ["渐", 0, "鸿渐于干", "鸿渐于乾"],
    ["噬嗑", 2, "噬腊肉", "噬昔肉"],
    ["艮", 2, "厉薰心", "厉阍心"],
    ["艮", 2, "列其夤", "裂其夤"],
    ["艮", 4, "言有序", "言有孚"],
    ["离", 2, "大耋之嗟", "大耋之差"],
    ["恒", 5, "振恒", "震恒"],
    ["晋", 4, "失得勿恤", "矢得勿恤"],
    ["损", 0, "已事遄往", "祀事遄往"],
    ["中孚", 3, "月几望", "月既望"],
    ["剥", 5, "君子得舆", "君子德车"],
    ["大壮", 3, "壮于大舆之輹", "壮于大轝之腹"],
    ["否", 4, "系于苞桑", "系于包桑"],
    ["萃", 5, "赍咨涕洟", "赍资涕洟"],
    ["小畜", 2, "舆说辐", "车说輹"],
    ["小畜", 5, "尚德载", "尚得载"],
    ["履", 5, "视履考祥", "视履考详"],
    ["比", 4, "王用三驱", "王用三敺"],
    ["同人", 3, "乘其墉", "乘其庸"],
    ["大有", 1, "大车以载", "大轝以载"],
    ["大有", 3, "匪其彭", "匪其尫"],
    ["豫", 3, "朋盍簪", "朋盍戠"],
    ["大畜", 3, "童牛之牿", "童牛之告"],
    ["坎", 4, "祗既平", "禔既平"],
    ["睽", 2, "其牛掣", "其牛𧤊"],
    ["解", 4, "君子维有解", "君子惟有解"],
    ["困", 2, "据于蒺藜", "据于蒺蔾"],
    ["困", 3, "来徐徐", "来荼荼"],
    ["困", 3, "困于金车", "困于金轝"],
    ["鼎", 3, "其形渥", "其刑渥"],
    ["升", 3, "王用亨于岐山", "王用享于岐山"],
    ["旅", 1, "得童仆贞", "得僮仆贞"],
    ["旅", 2, "丧其童仆", "丧其僮仆"],
  ];

  for (const [name, idx, want, forbid] of CASES) {
    it(`${name} ${idx + 1}爻含「${want}」`, () => {
      const text = byName.get(name)!.yaoCi[idx];
      expect(text).toContain(want);
      expect(text).not.toContain(forbid);
    });
  }
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
});
