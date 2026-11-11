/**
 * 六爻装卦：把 64 卦数据装成可直接展示/断卦的结构。
 *
 * 纯查表 + 规则计算，无副作用：
 * - 纳甲干支：内卦（下卦）取纳甲表前 3 位，外卦（上卦）取后 3 位。
 * - 六亲：以本宫五行为「我」——同我兄弟、生我父母、我生子孙、克我官鬼、我克妻财。
 * - 世应、宫位：直接取 `data/64gua.json`（已经过数据评审）。
 * - 动爻：入参 `movingLines` 只做标记，不决定哪些爻动（起卦在 Task 8）。
 */

import {
  NAJIA,
  PALACE_WUXING,
  ZHI_WUXING,
  getGua,
} from "../../data/najia-tables";
import type { LiuQin, Trigram, WuXing, Yao, ZhuangResult } from "./types";

/** 五行相生：木→火→土→金→水→木 */
const SHENG: Record<WuXing, WuXing> = {
  木: "火", 火: "土", 土: "金", 金: "水", 水: "木",
};

/** 五行相克：木→土→水→火→金→木 */
const KE: Record<WuXing, WuXing> = {
  木: "土", 土: "水", 水: "火", 火: "金", 金: "木",
};

/**
 * 六亲推导：以 `palaceWuXing` 为「我」，论与 `other` 的生克。
 *
 * - 同我 → 兄弟
 * - 生我 → 父母
 * - 我生 → 子孙
 * - 克我 → 官鬼
 * - 我克 → 妻财
 */
export function liuQinOf(palaceWuXing: WuXing, other: WuXing): LiuQin {
  if (palaceWuXing === other) return "兄弟";
  if (SHENG[other] === palaceWuXing) return "父母";
  if (SHENG[palaceWuXing] === other) return "子孙";
  if (KE[other] === palaceWuXing) return "官鬼";
  if (KE[palaceWuXing] === other) return "妻财";
  // 五行生克闭合，走到这里说明表被改坏了
  throw new Error(`五行生克关系缺失：${palaceWuXing} / ${other}`);
}

/** 归一化动爻索引：校验 0-5 整数，去重后升序。 */
function normalizeMovingLines(movingLines: number[]): number[] {
  const set = new Set<number>();
  for (const n of movingLines) {
    if (!Number.isInteger(n) || n < 0 || n > 5) {
      throw new RangeError(`动爻索引必须是 0-5 的整数，收到：${n}`);
    }
    set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * 装卦。
 *
 * @param shangGua 上卦（外卦）
 * @param xiaGua 下卦（内卦）
 * @param movingLines 动爻索引数组（0-5，自下而上）；乱序/重复会被归一化
 */
export function zhuangGua(
  shangGua: Trigram,
  xiaGua: Trigram,
  movingLines: number[],
): ZhuangResult {
  const entry = getGua(shangGua, xiaGua);
  const inner = NAJIA[xiaGua];
  const outer = NAJIA[shangGua];
  const palaceWuXing = PALACE_WUXING[entry.palaceGong] as WuXing;
  const moving = new Set(normalizeMovingLines(movingLines));

  const yao: Yao[] = Array.from({ length: 6 }, (_, i) => {
    const isInner = i < 3;
    const diZhi = isInner ? inner.zhi[i] : outer.zhi[i];
    const wuXing = ZHI_WUXING[diZhi] as WuXing;
    return {
      index: i,
      gan: isInner ? inner.gan[i] : outer.gan[i],
      diZhi,
      wuXing,
      liuQin: liuQinOf(palaceWuXing, wuXing),
      isMoving: moving.has(i),
      isShi: entry.shiYao === i,
      isYing: entry.yingYao === i,
    };
  });

  return {
    name: entry.name,
    shangGua,
    xiaGua,
    palaceGong: entry.palaceGong,
    palaceWuXing,
    shiYao: entry.shiYao,
    yingYao: entry.yingYao,
    yao,
    movingLines: [...moving].sort((a, b) => a - b),
    benGua: {
      name: entry.name,
      guaCi: entry.guaCi,
      yaoCi: [...entry.yaoCi],
      ...(entry.yongCi !== undefined ? { yongCi: entry.yongCi } : {}),
    },
  };
}
