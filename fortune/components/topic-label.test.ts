import { describe, expect, it } from "vitest";
import { topicActionLabel } from "./topic-label";

describe("topicActionLabel：按钮文案随手选事项联动", () => {
  it("三页动词与量词各不相同", () => {
    expect(topicActionLabel("bazi", "事业")).toBe("求事业签");
    expect(topicActionLabel("liuyao", "事业")).toBe("占事业卦");
    expect(topicActionLabel("tarot", "事业")).toBe("问事业牌");
  });

  it("未选事项时返回 null，交给页面用默认文案", () => {
    expect(topicActionLabel("bazi", null)).toBeNull();
    expect(topicActionLabel("liuyao", null)).toBeNull();
    expect(topicActionLabel("tarot", null)).toBeNull();
  });

  it("八项事项都能拼出完整文案", () => {
    const topics = ["事业", "感情", "财运", "健康", "学业", "出行", "决策", "其他"] as const;
    for (const topic of topics) {
      expect(topicActionLabel("tarot", topic)).toBe(`问${topic}牌`);
    }
  });
});
