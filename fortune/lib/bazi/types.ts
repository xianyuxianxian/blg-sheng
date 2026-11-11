/**
 * 八字排盘计算层的公共类型。
 *
 * 术语约定：
 * - 四柱（年/月/日/时）各含天干（gan）、地支（zhi）、地支藏干（hideGan）、
 *   纳音（naYin）、天干十神（shiShenGan）、地支藏干十神（shiShenZhi）。
 * - 十神以「日干」为参照：`shiShenGan` 为日干时固定为 `"日主"`。
 */

/** 五行。顺序即展示顺序（金木水火土）。 */
export type WuXing = "金" | "木" | "水" | "火" | "土";

/** 展示/遍历用固定顺序。 */
export const WU_XING_ORDER: readonly WuXing[] = ["金", "木", "水", "火", "土"] as const;

/**
 * 五行计数。
 *
 * 口径（**重要**）：按四柱八字「天干 4 个 + 地支 4 个」各计 1，**不计藏干加权**，
 * 因此 `金 + 木 + 水 + 火 + 土 === 8`。藏干已在 `SiZhu.hideGan` 中单独暴露，
 * 需要更高阶的加权统计时由上层自行按藏干计算，避免同一份数据出现两种口径。
 */
export type WuXingStat = {
  金: number;
  木: number;
  水: number;
  火: number;
  土: number;
};

/** 单柱。 */
export type SiZhu = {
  /** 天干，如 "庚" */
  gan: string;
  /** 地支，如 "午" */
  zhi: string;
  /** 地支藏干（本气在前），如 ["丁", "己"]；子/卯/酉 为单藏 */
  hideGan: string[];
  /** 纳音，如 "路旁土" */
  naYin: string;
  /** 天干十神（相对日干），日柱固定为 "日主" */
  shiShenGan: string;
  /** 地支藏干各自的十神（相对日干），与 hideGan 一一对应 */
  shiShenZhi: string[];
};

/** 四柱。 */
export type SiZhuSet = {
  year: SiZhu;
  month: SiZhu;
  day: SiZhu;
  hour: SiZhu;
};

/** 一步大运（起运后每十年一步，共 10 步）。 */
export type DaYunStep = {
  /** 第几步，从 1 开始（不含起运前的童限） */
  index: number;
  /** 大运干支，如 "癸未" */
  ganZhi: string;
  gan: string;
  zhi: string;
  /** 虚岁起止（含端点，沿用 lunar-typescript 口径） */
  startAge: number;
  endAge: number;
  /** 公历起止年份（含端点） */
  startYear: number;
  endYear: number;
};

/** 起运信息。 */
export type QiYun = {
  /** true = 顺排，false = 逆排 */
  isForward: boolean;
  /** 出生后经过的年/月/天 */
  startYear: number;
  startMonth: number;
  startDay: number;
  /** 起运时刻，本地时间字符串，如 "1997-11-15 12:30:00" */
  startSolar: string;
};

/** 排盘结果。 */
export type PaiPanResult = {
  siZhu: SiZhuSet;
  /** 五行计数，sum 恒为 8，口径见 {@link WuXingStat} */
  wuXing: WuXingStat;
  /** 大运 10 步（起运前童限不计入） */
  daYun: DaYunStep[];
  /** 起运信息（顺逆、起运年月日、起运时刻） */
  qiYun: QiYun;
  /**
   * 本次排盘采用的口径说明，供 UI 直接展示或调试使用。
   * 至少包含：子时换日口径、节气口径、起运顺逆、五行统计口径。
   */
  note: string[];
};

/** 排盘输入。 */
export type PaiPanInput = {
  /** 公历年 */
  y: number;
  /** 公历月 1-12 */
  m: number;
  /** 公历日 */
  d: number;
  /** 时辰序号，子 = 0 ... 亥 = 11 */
  hourIndex: number;
  gender: "m" | "f";
  /**
   * 可选：出生小时 0-23。仅在需要区分早/晚子时或需要精确到时刻时传入。
   * - 不传时，`hourIndex` 按窗口中点取时刻（子时取 00:30，午时取 12:30 ...）。
   * - 传了就必须落在 `hourIndex` 对应的时辰窗口内，否则抛错。
   */
  hour?: number;
  /** 可选：出生分钟 0-59，缺省 0。仅在传入 hour 时有效。 */
  minute?: number;
};
