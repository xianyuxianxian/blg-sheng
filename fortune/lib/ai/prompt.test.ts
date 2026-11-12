import { describe, it, expect } from "vitest";
import { buildPrompt } from "./prompt";
import { EXTRA_MAX, TOPICS } from "./schema";
import type { BaziData, InterpretRequest, LiuyaoData, TarotData } from "./schema";

/** 系统提示里必须原样出现的免责句。 */
const DISCLAIMER = "以上解读仅供传统文化参考与娱乐";

const bazi: BaziData = {
  siZhu: { year: "庚午", month: "辛巳", day: "甲子", hour: "丙寅" },
  wuXing: { 金: 2, 木: 1, 水: 3, 火: 1, 土: 1 },
  daYun: ["壬午", "癸未", "甲申"],
};

const liuyao: LiuyaoData = {
  benGua: "乾为天",
  bianGua: "天风姤",
  movingLines: [0, 2],
  lines: [
    { ganzhi: "甲子", liuQin: "子孙", shiYing: "世" },
    { ganzhi: "甲寅", liuQin: "妻财", shiYing: "" },
    { ganzhi: "甲辰", liuQin: "父母", shiYing: "" },
    { ganzhi: "壬午", liuQin: "官鬼", shiYing: "" },
    { ganzhi: "壬申", liuQin: "兄弟", shiYing: "" },
    { ganzhi: "壬戌", liuQin: "父母", shiYing: "应" },
  ],
};

const tarot: TarotData = {
  spread: "三张牌",
  cards: [
    { name: "愚者", position: "过去", reversed: false },
    { name: "宝剑三", position: "现在", reversed: true },
    { name: "太阳", position: "未来", reversed: false },
  ],
};

describe("buildPrompt - 系统提示护栏", () => {
  const cases: { req: InterpretRequest; method: string }[] = [
    { req: { type: "bazi", topic: "事业", data: bazi }, method: "大运" },
    { req: { type: "liuyao", topic: "感情", data: liuyao }, method: "世应" },
    { req: { type: "tarot", topic: "决策", data: tarot }, method: "逆位" },
  ];

  for (const c of cases) {
    it(`${c.req.type}：system 含角色设定、三条护栏与末尾免责句`, () => {
      const { system } = buildPrompt(c.req);

      // 角色设定
      expect(system).toContain("命理文化解读助手");
      // 三条护栏：医疗诊断 / 投资建议 / 法律意见
      expect(system).toContain("医疗诊断");
      expect(system).toContain("投资建议");
      expect(system).toContain("法律意见");
      // 免责句必须落在 system 末尾
      expect(system.trim().endsWith(DISCLAIMER)).toBe(true);
      // 各 type 的解读要点
      expect(system).toContain(c.method);
    });
  }
});

describe("buildPrompt - user 段排盘数据序列化", () => {
  it("八字：四柱、五行、大运与事项均出现在 user 段", () => {
    const { user } = buildPrompt({ type: "bazi", topic: "事业", data: bazi });

    expect(user).toContain("庚午");
    expect(user).toContain("辛巳");
    expect(user).toContain("年 庚午");
    expect(user).toContain("金 2");
    expect(user).toContain("土 1");
    expect(user).toContain("壬午");
    expect(user).toContain("事业");
    expect(user).toContain("解读类型");
  });

  it("六爻：本卦、变卦、动爻与六亲世应均出现在 user 段", () => {
    const { user } = buildPrompt({ type: "liuyao", topic: "感情", data: liuyao });

    expect(user).toContain("本卦：乾为天");
    expect(user).toContain("变卦：天风姤");
    expect(user).toContain("初爻");
    expect(user).toContain("三爻");
    expect(user).toContain("子孙");
    expect(user).toContain("妻财");
    expect(user).toContain("世");
    expect(user).toContain("应");
    expect(user).toContain("感情");
  });

  it("塔罗：牌阵、牌名、位置与正逆位均出现在 user 段", () => {
    const { user } = buildPrompt({ type: "tarot", topic: "决策", data: tarot });

    expect(user).toContain("三张牌");
    expect(user).toContain("愚者");
    expect(user).toContain("过去");
    expect(user).toContain("正位");
    expect(user).toContain("逆位");
    expect(user).toContain("决策");
  });
});

describe("buildPrompt - 补充语", () => {
  it("100 字以内的补充语原文保留，且只出现在 user 段", () => {
    const extra = "最近在考虑换工作，想问问时机是否合适。";
    const { system, user } = buildPrompt({ type: "bazi", topic: "事业", data: bazi, extra });

    expect(user).toContain(extra);
    expect(system).not.toContain(extra);
  });

  it("超长补充语被截断为 100 字，多余部分不进入 prompt", () => {
    // 前 100 字用「甲」+「乙」标记，之后用「丙」填充，便于断言截断位置
    const head = "甲".repeat(EXTRA_MAX - 1) + "乙";
    const tail = "丙".repeat(50);
    const extra = head + tail;
    expect(extra.length).toBeGreaterThan(EXTRA_MAX);

    const { system, user } = buildPrompt({ type: "bazi", topic: "健康", data: bazi, extra });

    expect(user).toContain(head);
    // 只比对重复片段：排盘数据里本来就有单个「丙」（丙寅时柱），不能按单字断言
    expect(user).not.toContain(tail);
    expect(system).not.toContain(tail);
  });

  it("补充语为空时不留「用户补充」空段", () => {
    const { user } = buildPrompt({ type: "bazi", topic: "其他", data: bazi, extra: "   " });
    expect(user).not.toContain("用户补充");
  });

  it("按 code point 截断：emoji（代理对）不会被截成半个字符", () => {
    const extra = "😀".repeat(150);
    const { user } = buildPrompt({ type: "bazi", topic: "其他", data: bazi, extra });

    expect(user).toContain("😀".repeat(EXTRA_MAX));
    expect(user).not.toContain("😀".repeat(EXTRA_MAX + 1));
    // 截断后不应残留孤立代理项（U+FFFD 是 TextEncoder 解不出来的替身）
    expect(user).not.toContain("\uFFFD");
  });
});

describe("buildPrompt - 生辰数字不入 prompt（隐私口径固化）", () => {
  it("八字：data 里混入的生辰/起运年份不会被序列化进 prompt", () => {
    // 前端可能把整份排盘结果（含 PaiPanInput / qiYun / daYun.startYear）传上来，
    // 服务端必须白名单重建；这里用 any 注入明文年份，断言 prompt 中不出现。
    const polluted = {
      ...bazi,
      y: 1990,
      m: 7,
      d: 15,
      birth: "1990-07-15 10:30",
      qiYun: { startSolar: "1997-11-15 12:30:00", startYear: 1997 },
      daYunDetail: [{ ganZhi: "壬午", startYear: 1990, endYear: 1999 }],
    } as unknown as BaziData;

    const { system, user } = buildPrompt({ type: "bazi", topic: "事业", data: polluted });

    expect(`${system}\n${user}`).not.toContain("1990");
    expect(user).not.toContain("1997");
    // 干支字符串本身仍在
    expect(user).toContain("庚午");
  });
});

describe("TOPICS", () => {
  it("事项类别为定死的八项且顺序固定", () => {
    expect(TOPICS).toEqual(["事业", "感情", "财运", "健康", "学业", "出行", "决策", "其他"]);
  });
});
