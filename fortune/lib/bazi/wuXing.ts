import type { WuXing, WuXingStat } from "./types";
import { WU_XING_ORDER } from "./types";

/**
 * 天干五行。
 *
 * 手写而不复用 LunarUtil.WU_XING_GAN：后者同时含 i18n 占位键（"{tg.jia}"），
 * 依赖库内部键名，硬编码十天干更稳定。
 */
const GAN_WU_XING: Record<string, WuXing> = {
  甲: "木",
  乙: "木",
  丙: "火",
  丁: "火",
  戊: "土",
  己: "土",
  庚: "金",
  辛: "金",
  壬: "水",
  癸: "水",
};

/** 地支五行（子午卯酉为本气，辰戌丑未为土）。 */
const ZHI_WU_XING: Record<string, WuXing> = {
  子: "水",
  丑: "土",
  寅: "木",
  卯: "木",
  辰: "土",
  巳: "火",
  午: "火",
  未: "土",
  申: "金",
  酉: "金",
  戌: "土",
  亥: "水",
};

/** 天干 → 五行。未知天干抛错（防止上游传错字导致计数静默偏移）。 */
export function wuXingOfGan(gan: string): WuXing {
  const wx = GAN_WU_XING[gan];
  if (!wx) throw new Error(`未知天干：${gan}`);
  return wx;
}

/** 地支 → 五行。未知地支抛错。 */
export function wuXingOfZhi(zhi: string): WuXing {
  const wx = ZHI_WU_XING[zhi];
  if (!wx) throw new Error(`未知地支：${zhi}`);
  return wx;
}

/**
 * 统计四柱五行。
 *
 * 口径：每个天干计 1、每个地支只按本气计 1，四柱合计 8，**不计藏干**。
 * 藏干加权属于另一套口径，留给上层按 `SiZhu.hideGan` 自行计算。
 */
export function countWuXing(pillars: ReadonlyArray<{ gan: string; zhi: string }>): WuXingStat {
  const stat: WuXingStat = { 金: 0, 木: 0, 水: 0, 火: 0, 土: 0 };
  for (const p of pillars) {
    stat[wuXingOfGan(p.gan)] += 1;
    stat[wuXingOfZhi(p.zhi)] += 1;
  }
  return stat;
}

/** 便于 UI 遍历的 `[五行, 计数]` 数组，顺序固定为金木水火土。 */
export function wuXingEntries(stat: WuXingStat): Array<[WuXing, number]> {
  return WU_XING_ORDER.map((wx) => [wx, stat[wx]]);
}
