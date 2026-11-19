/**
 * 共享 SSE 解析：服务端转发器（app/api/interpret/route.ts）与前端读取循环
 * （components/AiInterpret.tsx）原本各写一份逐字相同的 parseEvent / 缓冲重组，
 * 现在统一到这里。协议：POST /api/interpret 返回 text/event-stream，
 * 事件 `data: {"choices":[{"delta":{"content":"..."}}]}`，以 `data: [DONE]` 结束。
 */

export type SseEvent = { kind: "content"; text: string } | { kind: "done" };

/**
 * 解析一个 SSE 事件块，只认 `data:` 行。
 * 返回 content 事件、[DONE]、或 null（心跳/注释/仅有 reasoning_content 的块）。
 */
export function parseSseEvent(rawEvent: string): SseEvent | null {
  for (const line of rawEvent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const payload = trimmed.slice("data:".length).trim();
    if (!payload) continue;
    if (payload === "[DONE]") return { kind: "done" };

    try {
      const json = JSON.parse(payload) as {
        choices?: { delta?: { content?: unknown } }[];
      };
      const content = json.choices?.[0]?.delta?.content;
      // reasoning_content 不读即不转发；非 JSON 的 data 行（心跳等）直接丢弃
      if (typeof content === "string" && content.length > 0) {
        return { kind: "content", text: content };
      }
    } catch {
      // 忽略
    }
  }
  return null;
}

/**
 * chunk 边界重组器：网络分片可能把事件切在任意位置（甚至切在 "\r\n" 中间），
 * push 累积文本并在完整事件（以空行分隔）到达时产出。
 * 用法：`assembler.push(decoder.decode(chunk, { stream: true }))` 逐片喂入，
 * 流结束后调 `flush()` 取尾部残余。
 */
export class SseAssembler {
  private buffer = "";

  push(chunk: string): SseEvent[] {
    this.buffer += chunk;
    // 在累积缓冲上归一化 CRLF，避免 chunk 恰好切在 "\r\n" 中间时漏掉空行分隔
    this.buffer = this.buffer.replace(/\r\n/g, "\n");
    return this.drain();
  }

  flush(): SseEvent[] {
    this.buffer += "";
    this.buffer = this.buffer.replace(/\r\n/g, "\n");
    const events = this.drain();
    // 尾部残余（无终止空行的最后一个事件）也要尝试解析
    if (this.buffer.length > 0) {
      const tail = parseSseEvent(this.buffer);
      this.buffer = "";
      if (tail) events.push(tail);
    }
    return events;
  }

  private drain(): SseEvent[] {
    const events: SseEvent[] = [];
    let idx = this.buffer.indexOf("\n\n");
    while (idx !== -1) {
      const rawEvent = this.buffer.slice(0, idx);
      this.buffer = this.buffer.slice(idx + 2);
      const event = parseSseEvent(rawEvent);
      if (event) events.push(event);
      idx = this.buffer.indexOf("\n\n");
    }
    return events;
  }
}
