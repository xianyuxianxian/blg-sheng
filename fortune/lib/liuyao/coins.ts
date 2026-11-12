/**
 * 铜钱面值编码 —— 全站唯一来源。
 *
 * 口径（Controller 裁决）：
 * - 3 = 字
 * - 2 = 背
 *
 * 计算层（`qigua.ts` 掷币映射）与界面层（掷币台的字/背显示）共用本模块，
 * 避免两处各写一份常量、将来任一侧改动导致显示与卦象反向。
 *
 * 本模块零依赖：不得引入 lunar-typescript / React / 其它计算模块，
 * 以便界面层可以静态引入而不破坏 lunar 隔离。
 */

/** 铜钱字面 */
export const ZI_FACE = 3;

/** 铜钱背面 */
export const BEI_FACE = 2;

/** 一枚铜钱的面值 */
export type CoinFace = typeof ZI_FACE | typeof BEI_FACE;
