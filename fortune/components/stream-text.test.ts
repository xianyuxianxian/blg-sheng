import { describe, expect, it } from "vitest";
import { appendStripped, plainText } from "./stream-text";

/** 模拟流式：raw 是累计原文，segments 是界面渲染的已剥分段。 */
function stream(deltas: string[]): string[] {
  let raw = "";
  let segments: string[] = [];
  for (const delta of deltas) {
    raw += delta;
    segments = appendStripped(segments, raw);
  }
  return segments;
}

describe("plainText", () => {
  it("去掉加粗标记、标题符号与行内代码", () => {
    expect(plainText("**重点**看这里")).toBe("重点看这里");
    expect(plainText("## 小标题\n正文")).toBe("小标题\n正文");
    expect(plainText("用 `scrollTo` 只滚横轴")).toBe("用 scrollTo 只滚横轴");
  });
});

describe("appendStripped：跨 delta 的 Markdown 也要剥干净", () => {
  it("加粗标记被 delta 切开时不漏裸星号", () => {
    const segments = stream(["**加", "粗**文字", "继续"]);
    expect(segments.join("")).toBe("加粗文字继续");
    expect(segments.join("")).not.toContain("*");
  });

  it("行内代码的反引号被切开时不漏反引号", () => {
    const segments = stream(["调用 `scroll", "To` 即可"]);
    expect(segments.join("")).toBe("调用 scrollTo 即可");
    expect(segments.join("")).not.toContain("`");
  });

  it("标题符号先单独到达：前缀变化时重切，最终文本仍正确", () => {
    expect(stream(["#", " 标题正文"])).toEqual(["标题正文"]);
  });

  it("纯文本逐段追加：每段独立保留，便于逐段动画", () => {
    expect(stream(["第一段。", "第二段。", "第三段。"])).toEqual([
      "第一段。",
      "第二段。",
      "第三段。",
    ]);
  });
});
