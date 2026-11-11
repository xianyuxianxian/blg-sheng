/**
 * 京房纳甲表 + 64 卦数据装载。
 *
 * 数据来源：
 * - 卦辞爻辞（64gua.json）：维基文库《周易》各卦页通行本原文提取
 *   https://zh.wikisource.org/wiki/周易/乾 … 周易/未济
 * - 八宫卦序、世应、纳甲干支、五行：按通行京房八宫表手工整理，
 *   经变爻规则程序化验证及坤宫/乾宫六亲世应图图像核对
 *   （https://2743.com/archives/12923、https://2743.com/archives/12926）
 *
 * 约定：
 * - 爻位索引 0-5 自下而上（0=初爻，5=上爻）
 * - 纳甲表按内卦（下卦）/外卦（上卦）取用：内卦取 zhi/gan 前 3 位，外卦取后 3 位
 */

export type TrigramName = "乾" | "兑" | "离" | "震" | "巽" | "坎" | "艮" | "坤";
export type PalaceGong = "乾宫" | "坎宫" | "艮宫" | "震宫" | "巽宫" | "离宫" | "坤宫" | "兑宫";

export interface GuaEntry {
  name: string;
  guaCi: string;
  /** 六爻爻辞，自下而上（[0]=初爻） */
  yaoCi: string[];
  /** 用九/用六，仅乾坤两卦有 */
  yongCi?: string;
  xiaGua: TrigramName;
  shangGua: TrigramName;
  /** 世爻索引 0-5 */
  shiYao: number;
  /** 应爻索引 0-5，恒为 (世爻+3)%6 */
  yingYao: number;
  /** 京房八宫归属 */
  palaceGong: PalaceGong;
}

import guaDoc from "./64gua.json";

export const GUA64 = guaDoc.gua64 as GuaEntry[];

/** 八宫卦序：本宫→一世→二世→三世→四世→五世→游魂→归魂 */
export const PALACE_GUAS: Record<PalaceGong, string[]> = {
  乾宫: ["乾", "姤", "遁", "否", "观", "剥", "晋", "大有"],
  坎宫: ["坎", "节", "屯", "既济", "革", "丰", "明夷", "师"],
  艮宫: ["艮", "贲", "大畜", "损", "睽", "履", "中孚", "渐"],
  震宫: ["震", "豫", "解", "恒", "升", "井", "大过", "随"],
  巽宫: ["巽", "小畜", "家人", "益", "无妄", "噬嗑", "颐", "蛊"],
  离宫: ["离", "旅", "鼎", "未济", "蒙", "涣", "讼", "同人"],
  坤宫: ["坤", "复", "临", "泰", "大壮", "夬", "需", "比"],
  兑宫: ["兑", "困", "萃", "咸", "蹇", "谦", "小过", "归妹"],
};

/**
 * 八经卦纳甲：六爻天干与地支（自下而上）。
 * 用法：给定重卦后，内卦（下卦）取 [0..2]，外卦（上卦）取 [3..5]。
 */
export interface NajiaEntry {
  /** 六爻天干，自下而上（乾：甲甲甲壬壬壬） */
  gan: string[];
  /** 六爻地支，自下而上（乾：子寅辰午申戌） */
  zhi: string[];
}

export const NAJIA: Record<TrigramName, NajiaEntry> = {
  乾: { gan: ["甲", "甲", "甲", "壬", "壬", "壬"], zhi: ["子", "寅", "辰", "午", "申", "戌"] },
  坤: { gan: ["乙", "乙", "乙", "癸", "癸", "癸"], zhi: ["未", "巳", "卯", "丑", "亥", "酉"] },
  震: { gan: ["庚", "庚", "庚", "庚", "庚", "庚"], zhi: ["子", "寅", "辰", "午", "申", "戌"] },
  巽: { gan: ["辛", "辛", "辛", "辛", "辛", "辛"], zhi: ["丑", "亥", "酉", "未", "巳", "卯"] },
  坎: { gan: ["戊", "戊", "戊", "戊", "戊", "戊"], zhi: ["寅", "辰", "午", "申", "戌", "子"] },
  离: { gan: ["己", "己", "己", "己", "己", "己"], zhi: ["卯", "丑", "亥", "酉", "未", "巳"] },
  艮: { gan: ["丙", "丙", "丙", "丙", "丙", "丙"], zhi: ["辰", "午", "申", "戌", "子", "寅"] },
  兑: { gan: ["丁", "丁", "丁", "丁", "丁", "丁"], zhi: ["巳", "卯", "丑", "亥", "酉", "未"] },
};

/** 八宫五行（六亲基准：与本宫五行论生克） */
export const PALACE_WUXING: Record<PalaceGong, string> = {
  乾宫: "金", 坎宫: "水", 艮宫: "土", 震宫: "木",
  巽宫: "木", 离宫: "火", 坤宫: "土", 兑宫: "金",
};

/** 十二地支五行 */
export const ZHI_WUXING: Record<string, string> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

/** 十天干五行（Task 7 装卦时可能需要） */
export const GAN_WUXING: Record<string, string> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

const byKey = new Map<string, GuaEntry>(GUA64.map((g) => [`${g.shangGua}|${g.xiaGua}`, g]));

/** 按上卦/下卦取卦（brief 接口：按上卦/下卦索引取卦对象） */
export function getGua(shangGua: TrigramName, xiaGua: TrigramName): GuaEntry {
  const g = byKey.get(`${shangGua}|${xiaGua}`);
  if (!g) throw new Error(`未知卦组合：上${shangGua}下${xiaGua}`);
  return g;
}
