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
import { SseAssembler, type SseEvent } from "../../../lib/sse-parser";

export const runtime = "nodejs";

/** 上游首字节超时（毫秒）。 */
const DEFAULT_TIMEOUT_MS = 20_000;
/**
 * 默认端点 = 讯飞星火 MaaS（OpenAI 兼容 SSE）。
 * controller 裁决（2026-11-12）覆盖设计文档里过时的 glm-4-flash 口径；
 * `AI_BASE_URL` / `AI_MODEL` 仍可用环境变量整体替换（如换 DeepSeek 兼容端点）。
 */
const DEFAULT_BASE_URL = "https://maas-api.cn-huabei-1.xf-yun.com/v2";
const DEFAULT_MODEL = "spark-x2.5-1.7b";

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
    // 不依赖 instanceof Error：跨 realm 的 DOMException / 被包装过的错误也要认
    const aborted = (err as { name?: unknown } | null | undefined)?.name === "AbortError";
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
  // 200 但不是 SSE（如网关把错误包成 JSON）→ 不能当流读，转成 502 让前端走降级
  const upstreamType = upstream.headers.get("content-type") ?? "";
  if (!upstreamType.includes("text/event-stream")) {
    return errorJson(502, "upstream_error", "解读服务返回了非流式响应");
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

/**
 * 上游 SSE → 客户端 SSE 的转换器。
 *
 * 选择 TransformStream + 逐事件解析（而非直接管道 body）的原因：
 * 直接管道无法剔除 `reasoning_content`；逐事件解析还能在 chunk 边界被任意
 * 切断时靠 buffer 重组完整事件。输出为上游同构的
 * `data: {"choices":[{"delta":{"content":"..."}}]}`，并以 `data: [DONE]` 收尾。
 *
 * 事件解析与 chunk 重组逻辑在 lib/sse-parser.ts（与前端共用）。
 */
export function createSseForwarder(): TransformStream<Uint8Array, Uint8Array> {
  const decoder = new TextDecoder();
  const assembler = new SseAssembler();
  let sawDone = false;

  function forward(
    event: SseEvent,
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

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      for (const event of assembler.push(decoder.decode(chunk, { stream: true }))) {
        forward(event, controller);
      }
    },
    flush(controller) {
      assembler.flush().forEach((event) => forward(event, controller));
      // 上游没发 [DONE] 也要给客户端一个明确结束标记
      forward({ kind: "done" }, controller);
    },
  });
}
