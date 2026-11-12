/**
 * POST /api/interpret —— AI 解读（服务端代理 + SSE 透传）。
 *
 * 流程：JSON 入参 → zod 校验（400）→ 组装 prompt → 调上游 OpenAI 兼容
 * `/chat/completions`（stream: true，AbortController 20s）→ 把上游 SSE 的
 * `delta.content` 以同样格式转发给浏览器。
 *
 * 上游是推理型模型：`delta` 里同时有 `reasoning_content`（思考过程）与
 * `content`（正式内容）。只转发 `content`，思考过程不出服务端。
 *
 * key 只在服务端：`process.env.ZHIPU_API_KEY`（名称沿用，换成讯飞星火 MaaS 也不改名）。
 */

import { buildPrompt } from "../../../lib/ai/prompt";
import { interpretRequestSchema } from "../../../lib/ai/schema";

export const runtime = "nodejs";

/** 上游首字节超时（毫秒）。 */
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_BASE_URL = "https://api.zhipuai.cn/api/paas/v4";
const DEFAULT_MODEL = "glm-4-flash";

/** 测试注入点：只给单测用小超时/假 fetch，生产走默认。 */
export type InterpretDeps = {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
};

export async function POST(request: Request): Promise<Response> {
  return handleInterpret(request);
}

export async function handleInterpret(
  request: Request,
  deps: InterpretDeps = {},
): Promise<Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorJson(400, "invalid_request", "请求体必须是合法 JSON");
  }

  const parsed = interpretRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return errorJson(400, "invalid_request", message);
  }

  const apiKey = process.env.ZHIPU_API_KEY?.trim();
  if (!apiKey) {
    return errorJson(503, "not_configured", "解读服务未配置（缺少 ZHIPU_API_KEY）");
  }

  const baseUrl = (process.env.AI_BASE_URL?.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.AI_MODEL?.trim() || DEFAULT_MODEL;
  const { system, user } = buildPrompt(parsed.data);

  const controller = new AbortController();
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const fetchImpl = deps.fetchImpl ?? fetch;

  let upstream: Response;
  try {
    upstream = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const aborted = err instanceof Error && err.name === "AbortError";
    return aborted
      ? errorJson(502, "upstream_timeout", "解读服务响应超时，请稍后重试")
      : errorJson(502, "upstream_error", "解读服务暂时不可用，请稍后重试");
  }

  // 拿到响应头即视为「首字节到达」：之后的流式生成不再受 20s 约束，
  // 否则长回答会被拦腰截断（前端已收到 200，无法再降级成 502）。
  clearTimeout(timer);

  if (!upstream.ok) {
    return errorJson(502, "upstream_error", `解读服务返回异常（HTTP ${upstream.status}）`);
  }
  if (!upstream.body) {
    return errorJson(502, "upstream_error", "解读服务未返回流式内容");
  }

  return new Response(upstream.body.pipeThrough(createSseForwarder()), {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // 关掉反代缓冲，保证逐字下发
      "x-accel-buffering": "no",
    },
  });
}

function errorJson(status: number, error: string, message: string): Response {
  return Response.json({ error, message }, { status });
}

const encoder = new TextEncoder();

type UpstreamEvent = { kind: "content"; text: string } | { kind: "done" };

/**
 * 解析一个上游 SSE 事件块，只认 `data:` 行。
 * 返回 content 事件、[DONE]、或 null（心跳/注释/仅有 reasoning_content）。
 */
function parseEvent(rawEvent: string): UpstreamEvent | null {
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
      // reasoning_content 不读即不转发
      if (typeof content === "string" && content.length > 0) {
        return { kind: "content", text: content };
      }
    } catch {
      // 非 JSON 的 data 行（上游心跳等）直接丢弃
    }
  }
  return null;
}

/**
 * 上游 SSE → 客户端 SSE 的转换器。
 *
 * 选择 TransformStream + 逐事件解析（而非直接管道 body）的原因：
 * 直接管道无法剔除 `reasoning_content`；逐事件解析还能在 chunk 边界被任意
 * 切断时靠 buffer 重组完整事件。输出为上游同构的
 * `data: {"choices":[{"delta":{"content":"..."}}]}`，并以 `data: [DONE]` 收尾。
 */
export function createSseForwarder(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  function forward(
    event: UpstreamEvent,
    controller: TransformStreamDefaultController<Uint8Array>,
  ): void {
    if (event.kind === "content") {
      const payload = JSON.stringify({
        choices: [{ index: 0, delta: { content: event.text } }],
      });
      controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      return;
    }

    if (!sawDone) {
      sawDone = true;
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    }
  }

  function drain(controller: TransformStreamDefaultController<Uint8Array>): void {
    let idx = buffer.indexOf("\n\n");
    while (idx !== -1) {
      const rawEvent = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      const event = parseEvent(rawEvent);
      if (event) forward(event, controller);
      idx = buffer.indexOf("\n\n");
    }
  }

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      // 在累积缓冲上归一化 CRLF，避免 chunk 恰好切在 "\r\n" 中间时漏掉空行分隔
      buffer = buffer.replace(/\r\n/g, "\n");
      drain(controller);
    },
    flush(controller) {
      buffer += decoder.decode();
      buffer = buffer.replace(/\r\n/g, "\n");
      const tail = parseEvent(buffer);
      if (tail) forward(tail, controller);
      buffer = "";
      // 上游没发 [DONE] 也要给客户端一个明确结束标记
      forward({ kind: "done" }, controller);
    },
  });
}
