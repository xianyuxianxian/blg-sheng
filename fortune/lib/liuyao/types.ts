/**
 * 六爻装卦计算层的公共类型。
 *
 * 术语约定：
 * - 爻位索引 0-5 自下而上（0 = 初爻，5 = 上爻），与 `data/64gua.json` 一致。
 * - 六亲以**宫位五行**为「我」：本卦取本宫五行；变卦仍以本卦宫五行为「我」
 *   （传统京房装卦法，不取变卦自身宫、不取日干）。
 * - 本模块为纯计算层：不得 import React / app / components。
 */

import type { PalaceGong, TrigramName } from "../../data/najia-tables";

/** 八经卦标识，与 `data/64gua.json` 的 `shangGua` / `xiaGua` 取值一致。 */
export type Trigram = TrigramName;

/** 五行。 */
export type WuXing = "金" | "木" | "水" | "火" | "土";

/** 六亲。 */
export type LiuQin = "父母" | "兄弟" | "子孙" | "妻财" | "官鬼";

/** 单爻装卦结果。 */
export interface Yao {
  /** 爻位索引 0-5，自下而上（0 = 初爻） */
  index: number;
  /** 纳甲天干，如 "甲" */
  gan: string;
  /** 纳甲地支，如 "子" */
  diZhi: string;
  /** 地支五行（六亲由六亲基准五行与此五行论生克得出） */
  wuXing: WuXing;
  /** 六亲（本卦相对本宫五行；变卦相对本卦宫五行） */
  liuQin: LiuQin;
  /** 动爻标记（由 `zhuangGua` 的 `movingLines` 入参决定） */
  isMoving: boolean;
  /** 是否世爻 */
  isShi: boolean;
  /** 是否应爻 */
  isYing: boolean;
}

/** 本卦卦爻辞引用（变占取辞用）。字段直接来自 `data/64gua.json`。 */
export interface BenGuaText {
  /** 卦名，如 "乾" */
  name: string;
  /** 卦辞原文 */
  guaCi: string;
  /** 六爻爻辞，自下而上，与 `ZhuangResult.yao[i]` 同序号对齐 */
  yaoCi: string[];
  /** 用九 / 用六，仅乾、坤两卦有 */
  yongCi?: string;
}

/** 装卦结果。 */
export interface ZhuangResult {
  /** 本卦卦名 */
  name: string;
  shangGua: Trigram;
  xiaGua: Trigram;
  /** 京房八宫归属，如 "乾宫" */
  palaceGong: PalaceGong;
  /** 该卦自身宫位五行，如乾宫为 "金"；变卦的六亲基准可能另有来源（见 `Yao.liuQin`） */
  palaceWuXing: WuXing;
  /** 世爻索引 0-5 */
  shiYao: number;
  /** 应爻索引 0-5，恒为 (世爻 + 3) % 6 */
  yingYao: number;
  /** 六爻装卦结果，自下而上，长度恒为 6 */
  yao: Yao[];
  /** 动爻索引，升序去重（入参归一化后的结果），自下而上 */
  movingLines: number[];
  /** 本卦卦爻辞引用（Task 8 变占取辞用） */
  benGua: BenGuaText;
}
