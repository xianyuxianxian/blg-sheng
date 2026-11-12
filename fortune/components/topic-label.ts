import type { Topic } from "../lib/ai/schema";

/** 三个功能页的皮肤标识（与 skin class 同名）。 */
export type SkinKind = "bazi" | "liuyao" | "tarot";

/** 各页动词：求（八字）/ 占（六爻）/ 问（塔罗）。 */
const VERB: Record<SkinKind, string> = {
  bazi: "求",
  liuyao: "占",
  tarot: "问",
};

/** 各页量词：签 / 卦 / 牌。 */
const UNIT: Record<SkinKind, string> = {
  bazi: "签",
  liuyao: "卦",
  tarot: "牌",
};

/**
 * 主按钮文案联动：选中事项后变成「求事业签 / 占事业卦 / 问事业牌」。
 * 未选（或该页允许跳过）时返回 null，由调用方给回默认文案。
 */
export function topicActionLabel(kind: SkinKind, topic: Topic | null): string | null {
  return topic ? `${VERB[kind]}${topic}${UNIT[kind]}` : null;
}
