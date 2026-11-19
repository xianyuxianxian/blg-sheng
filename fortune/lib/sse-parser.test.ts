import { describe, expect, it } from "vitest";
import { SseAssembler, parseSseEvent } from "./sse-parser";

describe("parseSseEvent", () => {
  it("解析 content 事件", () => {
    const raw = 'data: {"choices":[{"delta":{"content":"你好"}}]}';
    expect(parseSseEvent(raw)).toEqual({ kind: "content", text: "你好" });
  });

  it("识别 [DONE]", () => {
    expect(parseSseEvent("data: [DONE]")).toEqual({ kind: "done" });
  });

  it("丢弃 reasoning_content 事件（只读 delta.content）", () => {
    const raw = 'data: {"choices":[{"delta":{"reasoning_content":"思考中"}}]}';
    expect(parseSseEvent(raw)).toBeNull();
  });

  it("丢弃非 JSON 的 data 行与注释行", () => {
    expect(parseSseEvent("data: ping\ndata: :keepalive")).toBeNull();
    expect(parseSseEvent(": comment only")).toBeNull();
  });

  it("空 content 不算事件", () => {
    expect(parseSseEvent('data: {"choices":[{"delta":{"content":""}}]}')).toBeNull();
  });
});

describe("SseAssembler", () => {
  function collect(chunks: string[]): { events: ReturnType<SseAssembler["push"]>; flushed: ReturnType<SseAssembler["flush"]> } {
    const assembler = new SseAssembler();
    const events = chunks.flatMap((chunk) => assembler.push(chunk));
    return { events, flushed: assembler.flush() };
  }

  it("完整事件一次到达", () => {
    const { events } = collect([
      'data: {"choices":[{"delta":{"content":"甲"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"乙"}}]}\n\ndata: [DONE]\n\n',
    ]);
    expect(events).toEqual([
      { kind: "content", text: "甲" },
      { kind: "content", text: "乙" },
      { kind: "done" },
    ]);
  });

  it("chunk 切在事件中间也能重组", () => {
    const { events } = collect([
      'data: {"choices":[{"del',
      'ta":{"content":"丙"}}]}\n\ndata: {"choi',
      'ces":[{"delta":{"content":"丁"}}]}\n\n',
    ]);
    expect(events).toEqual([
      { kind: "content", text: "丙" },
      { kind: "content", text: "丁" },
    ]);
  });

  it("chunk 切在 \\r\\n 中间不丢事件分隔", () => {
    const { events } = collect([
      'data: {"choices":[{"delta":{"content":"戊"}}]}\r\n\r',
      "\ndata: [DONE]\r\n\r\n",
    ]);
    expect(events).toEqual([{ kind: "content", text: "戊" }, { kind: "done" }]);
  });

  it("flush 取尾部无终止空行的事件", () => {
    const { events, flushed } = collect([
      'data: {"choices":[{"delta":{"content":"己"}}]}\n\ndata: [DONE]\n',
    ]);
    expect(events).toEqual([{ kind: "content", text: "己" }]);
    expect(flushed).toEqual([{ kind: "done" }]);
  });
});
