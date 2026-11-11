import { randomInt } from "../random";
import { TAROT_CARDS } from "../../data/tarot-cards";
import type { TarotCard } from "../../data/tarot-cards";

export type { TarotArcana, TarotCard, TarotSuit } from "../../data/tarot-cards";
export { TAROT_CARDS };

/** 抽到的一张牌：牌面数据 + 是否逆位 */
export type DrawnCard = {
  card: TarotCard;
  reversed: boolean;
};

/** 牌阵中的单个位置 */
export type SpreadPosition = {
  label: string;
  meaning: string;
};

/** 一种牌阵定义 */
export type SpreadDef = {
  id: string;
  name: string;
  positions: SpreadPosition[];
};

/**
 * 一期牌阵集合。按 id 索引，后续要加新牌阵（如十字阵）只需在这里追加一项。
 */
export const SPREADS = {
  three: {
    id: "three",
    name: "三张阵",
    positions: [
      { label: "过去", meaning: "促成眼下局面的来路与已发生的影响。" },
      { label: "现在", meaning: "当下最需要被看见的处境与能量。" },
      { label: "未来", meaning: "顺着当前方向可能走向的趋势，而非定数。" },
    ],
  },
} satisfies Record<string, SpreadDef>;

/**
 * 洗牌并用 Fisher-Yates 抽取 count 张牌。
 * 随机源统一走 lib/random 的 crypto 实现，禁止 Math.random。
 * 逆位概率固定 50%，每张牌独立判定。
 */
export function drawSpread(count: number): DrawnCard[] {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError(`count 必须为正整数，收到: ${count}`);
  }
  if (count > TAROT_CARDS.length) {
    throw new RangeError(`count 不能超过牌库数量 ${TAROT_CARDS.length}，收到: ${count}`);
  }

  const deck = TAROT_CARDS.slice();
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = deck[i];
    deck[i] = deck[j];
    deck[j] = tmp;
  }

  return deck.slice(0, count).map((card) => ({
    card,
    reversed: randomInt(2) === 1,
  }));
}
