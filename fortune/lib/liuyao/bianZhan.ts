/**
 * 朱熹《易学启蒙》变占取辞法则。
 *
 * 七种情况（Controller 裁决口径）：
 * - 0 爻动：占本卦卦辞
 * - 1 爻动：占本卦动爻爻辞
 * - 2 爻动：占本卦两动爻爻辞，以上爻为主
 * - 3 爻动：占本卦及变卦卦辞，本卦为贞、变卦为悔
 * - 4 爻动：占变卦两不动爻爻辞，以下爻为主
 * - 5 爻动：占变卦不动爻爻辞
 * - 6 爻动：乾坤占二用（乾用九、坤用六），其余卦占变卦卦辞
 *
 * 纯计算层（查表 + 规则），本模块禁止 import React / app / components。
 */

import { linesOfTrigram } from "./guaShape";
import type { ZhuangResult } from "./types";

/** 取辞类型 */
export type QuZhanKind = "卦辞" | "爻辞" | "用九" | "用六";

/** 取辞主次：主 = 主占之辞，辅 = 兼看之辞，贞 = 本卦（主），悔 = 变卦（从） */
export type QuZhanRole = "主" | "辅" | "贞" | "悔";

/** 一条取辞引用 */
export interface QuZhanItem {
  /** 取自本卦还是变卦 */
  gua: "本卦" | "变卦";
  /** 卦名，如 "乾" */
  guaName: string;
  kind: QuZhanKind;
  /** 爻位索引 0-5；卦辞与用九/用六为 null */
  yaoIndex: number | null;
  /** 爻位名，如 "九三"、"初六"；非爻辞为 null */
  yaoName: string | null;
  /** 原文 */
  text: string;
  role: QuZhanRole;
}

/** 变占结果 */
export interface QuZhanResult {
  /** 动爻数 0-6 */
  movingCount: number;
  /** 法则说明（页面直接展示） */
  rule: string;
  /** 取辞清单，按主次排序（主辞在前） */
  items: QuZhanItem[];
}

const YAO_POS = ["初", "二", "三", "四", "五", "上"] as const;

/** 归一化动爻索引：校验 0-5 整数，去重后升序（与 `zhuangGua` 同口径） */
function normalizeMovingLines(movingLines: number[]): number[] {
  if (!Array.isArray(movingLines)) {
    throw new RangeError("movingLines 必须是数组");
  }
  const set = new Set<number>();
  for (const n of movingLines) {
    if (!Number.isInteger(n) || n < 0 || n > 5) {
      throw new RangeError(`动爻索引必须是 0-5 的整数，收到：${n}`);
    }
    set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

/** 取某卦第 index 爻的阴阳（自下而上，true = 阳） */
function lineIsYang(gua: ZhuangResult, index: number): boolean {
  const xia = linesOfTrigram(gua.xiaGua);
  const shang = linesOfTrigram(gua.shangGua);
  return index < 3 ? xia[index] : shang[index - 3];
}

/** 爻位名：初九 / 九二 / … / 上六 */
function yaoNameOf(gua: ZhuangResult, index: number): string {
  const num = lineIsYang(gua, index) ? "九" : "六";
  if (index === 0) return `初${num}`;
  if (index === 5) return `上${num}`;
  return `${num}${YAO_POS[index]}`;
}

/** 卦辞引用 */
function guaCiItem(gua: ZhuangResult, side: QuZhanItem["gua"], role: QuZhanRole): QuZhanItem {
  return {
    gua: side,
    guaName: gua.benGua.name,
    kind: "卦辞",
    yaoIndex: null,
    yaoName: null,
    text: gua.benGua.guaCi,
    role,
  };
}

/** 爻辞引用 */
function yaoCiItem(gua: ZhuangResult, side: QuZhanItem["gua"], index: number, role: QuZhanRole): QuZhanItem {
  const text = gua.benGua.yaoCi[index];
  if (text === undefined) {
    throw new Error(`${gua.benGua.name}卦缺第 ${index + 1} 爻爻辞`);
  }
  return {
    gua: side,
    guaName: gua.benGua.name,
    kind: "爻辞",
    yaoIndex: index,
    yaoName: yaoNameOf(gua, index),
    text,
    role,
  };
}

/** 用九 / 用六引用（仅乾、坤） */
function yongItem(gua: ZhuangResult): QuZhanItem {
  const kind = gua.benGua.name === "乾" ? "用九" : "用六";
  const text = gua.benGua.yongCi;
  if (text === undefined) {
    throw new Error(`${gua.benGua.name}卦缺${kind}辞`);
  }
  return {
    gua: "本卦",
    guaName: gua.benGua.name,
    kind,
    yaoIndex: null,
    yaoName: null,
    text,
    role: "主",
  };
}

function requireBianGua(bianGua: ZhuangResult | null, movingCount: number): ZhuangResult {
  if (!bianGua) {
    throw new RangeError(`${movingCount} 爻动必须提供变卦`);
  }
  return bianGua;
}

/**
 * 依动爻数取辞。
 *
 * @param benGua 本卦装卦结果（`zhuangGua` 产出，含卦爻辞引用与上下卦）
 * @param bianGua 变卦装卦结果；3 爻动及以上必传，0-2 爻动可传 null（不参与取辞）
 * @param movingLines 动爻索引（0-5，自下而上），应与本卦装卦时一致；乱序/重复会被归一化
 */
export function bianZhan(
  benGua: ZhuangResult,
  bianGua: ZhuangResult | null,
  movingLines: number[],
): QuZhanResult {
  const moving = normalizeMovingLines(movingLines);
  const movingCount = moving.length;

  switch (movingCount) {
    case 0:
      return {
        movingCount,
        rule: "0 爻动：占本卦卦辞。",
        items: [guaCiItem(benGua, "本卦", "主")],
      };

    case 1:
      return {
        movingCount,
        rule: "1 爻动：占本卦动爻爻辞。",
        items: [yaoCiItem(benGua, "本卦", moving[0], "主")],
      };

    case 2: {
      // 两个动爻：上爻（索引大者）为主，下爻为辅
      const [low, high] = moving;
      return {
        movingCount,
        rule: "2 爻动：占本卦两动爻爻辞，以上爻为主。",
        items: [
          yaoCiItem(benGua, "本卦", high, "主"),
          yaoCiItem(benGua, "本卦", low, "辅"),
        ],
      };
    }

    case 3: {
      const bian = requireBianGua(bianGua, movingCount);
      return {
        movingCount,
        rule: "3 爻动：占本卦及变卦卦辞，本卦为贞、变卦为悔。",
        items: [
          guaCiItem(benGua, "本卦", "贞"),
          guaCiItem(bian, "变卦", "悔"),
        ],
      };
    }

    case 4: {
      const bian = requireBianGua(bianGua, movingCount);
      const still = [0, 1, 2, 3, 4, 5].filter((i) => !moving.includes(i));
      // 两个不动爻：下爻（索引小者）为主，上爻为辅
      return {
        movingCount,
        rule: "4 爻动：占变卦两不动爻爻辞，以下爻为主。",
        items: [
          yaoCiItem(bian, "变卦", still[0], "主"),
          yaoCiItem(bian, "变卦", still[1], "辅"),
        ],
      };
    }

    case 5: {
      const bian = requireBianGua(bianGua, movingCount);
      const still = [0, 1, 2, 3, 4, 5].filter((i) => !moving.includes(i));
      return {
        movingCount,
        rule: "5 爻动：占变卦不动爻爻辞。",
        items: [yaoCiItem(bian, "变卦", still[0], "主")],
      };
    }

    case 6: {
      // 乾坤六爻皆动占用九/用六，其余卦占变卦卦辞
      if (benGua.benGua.name === "乾" || benGua.benGua.name === "坤") {
        const item = yongItem(benGua);
        return {
          movingCount,
          rule: `6 爻动：乾坤占二用——${item.guaName}卦六爻皆动，占${item.kind}。`,
          items: [item],
        };
      }
      const bian = requireBianGua(bianGua, movingCount);
      return {
        movingCount,
        rule: "6 爻动：六爻皆动，占变卦卦辞。",
        items: [guaCiItem(bian, "变卦", "主")],
      };
    }

    default:
      // 索引去重后最多 6 个，走不到这里
      throw new RangeError(`动爻数不合法：${movingCount}`);
  }
}
