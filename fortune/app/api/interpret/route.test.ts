import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST, handleInterpret } from "./route";
import type { BaziData } from "../../../lib/ai/schema";

const baziData: BaziData = {
  siZhu: { year: "庚午", month: "辛巳", day: "甲子", hour: "丙寅" },
  wuXing: { 金: 2, 木: 1, 水: 3, 火: 1, 土: 1 },
  daYun: ["壬午", "癸未"],
};

const ENV_KEYS = ["ZHIPU_API_KEY", "AI_BASE_URL", "AI_MODEL"] as const;
const savedEnv: Record<string, string | undefined> = {};

const encoder = new TextEncoder();

/** 构造一个上游 SSE 响应（推理型模型：delta 里同时有 reasoning_content 与 content）。 */
function upstreamSse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/interpret", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** 从转发给客户端的 SSE 文本里取出所有 delta.content。 */
function clientContents(sse: string): string[] {
  return sse
    .split("\n\n")
    .map((e) => e.trim())
    .filter((e) => e.startsWith("data:") && !e.includes("[DONE]"))
    .map((e) => JSON.parse(e.slice(5).trim()))
    .map((j) => j.choices?.[0]?.delta?.content)
    .filter((c): c is string => typeof c === "string");
}

beforeEach(() => {
  for (const k of ENV_KEYS) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
  process.env.ZHIPU_API_KEY = "test-key";
  process.env.AI_BASE_URL = "https://unit.test/v2";
  process.env.AI_MODEL = "test-model";
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("POST /api/interpret - 成功路径（SSE 透传）", () => {
  it("转发 delta.content、过滤 reasoning_content，并以上游同格式 SSE 返回", async () => {
    const fetchMock = vi.fn(async () =>
      upstreamSse([
        'data: {"choices":[{"delta":{"role":"assistant","reasoning_content":"我在思考"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"你的"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"事业"}}]}\n\ndata: {"choices":[{"delta":{"content":"可期"}}]}\n\n',
        "data: [DONE]\n\n",
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(jsonRequest({ type: "bazi", topic: "事业", data: baziData }));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toContain("no-cache");

    const text = await res.text();
    expect(clientContents(text)).toEqual(["你的", "事业", "可期"]);
    expect(text).not.toContain("我在思考");
    expect(text).toContain("data: [DONE]");

    // 上游请求形状
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://unit.test/v2/chat/completions");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-key");
    expect(init.signal).toBeInstanceOf(AbortSignal);

    const sent = JSON.parse(String(init.body));
    expect(sent.model).toBe("test-model");
    expect(sent.stream).toBe(true);
    expect(sent.messages).toHaveLength(2);
    expect(sent.messages[0].role).toBe("system");
    expect(sent.messages[0].content).toContain("命理文化解读助手");
    expect(sent.messages[0].content).toContain("以上解读仅供传统文化参考与娱乐");
    expect(sent.messages[1].role).toBe("user");
    expect(sent.messages[1].content).toContain("庚午");
    expect(sent.messages[1].content).toContain("事业");
  });

  it("上游任意切块位置（跨 chunk 的半行）也能正确解析", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        upstreamSse([
          'data: {"choices":[{"delta":{"cont',
          'ent":"跨块"}}]}\n\ndata: {"choices":[{"delta":{"content":"成功"}}]}\n\n',
        ]),
      ),
    );

    const res = await POST(jsonRequest({ type: "tarot", topic: "决策", data: { spread: "三张牌", cards: [{ name: "愚者", position: "现在", reversed: false }] } }));
    expect(res.status).toBe(200);
    expect(clientContents(await res.text())).toEqual(["跨块", "成功"]);
  });

  it("补充语会被截断后再发给上游", async () => {
    let sentBody = "";
    let sentUrl = "";
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      sentUrl = url;
      sentBody = String(init.body);
      return upstreamSse(["data: [DONE]\n\n"]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const extra = "丁".repeat(150);
    await POST(jsonRequest({ type: "bazi", topic: "财运", data: baziData, extra }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(sentUrl).toBe("https://unit.test/v2/chat/completions");
    const user = JSON.parse(sentBody).messages[1].content as string;
    expect(user).toContain("丁".repeat(100));
    expect(user).not.toContain("丁".repeat(101));
  });
});

describe("POST /api/interpret - 校验失败 400", () => {
  it("type 不在枚举内", async () => {
    const res = await POST(jsonRequest({ type: "zodiac", topic: "事业", data: baziData }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    expect(body.message).toContain("type");
  });

  it("topic 不在 TOPICS 内", async () => {
    const res = await POST(jsonRequest({ type: "bazi", topic: "升职", data: baziData }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    expect(body.message).toContain("topic");
  });

  it("data 形状不合法（八字缺 daYun）", async () => {
    const res = await POST(
      jsonRequest({ type: "bazi", topic: "事业", data: { siZhu: baziData.siZhu, wuXing: baziData.wuXing } }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("invalid_request");
    expect(body.message).toContain("daYun");
  });

  it("无请求体 / 非 JSON 请求体", async () => {
    const res = await POST(jsonRequest("not-json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_request");
  });

  it("校验失败时不调用上游（不浪费额度）", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await POST(jsonRequest({ type: "bazi", topic: "升职", data: baziData }));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/interpret - 无 key 503", () => {
  it("缺少 ZHIPU_API_KEY 时返回 503 且不调用上游", async () => {
    delete process.env.ZHIPU_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const res = await POST(jsonRequest({ type: "bazi", topic: "事业", data: baziData }));
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe("not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/interpret - 上游异常 502", () => {
  it("超时（AbortController）→ 502 upstream_timeout", async () => {
    const fetchImpl = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
          });
        }),
    );

    const res = await handleInterpret(jsonRequest({ type: "bazi", topic: "事业", data: baziData }), {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      timeoutMs: 20,
    });

    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_timeout");
  });

  it("上游 4xx → 502 upstream_error，状态码写进 message", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("bad request", { status: 401 })));
    const res = await POST(jsonRequest({ type: "bazi", topic: "事业", data: baziData }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_error");
    expect(body.message).toContain("401");
  });

  it("上游 5xx → 502 upstream_error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 503 })));
    const res = await POST(jsonRequest({ type: "bazi", topic: "事业", data: baziData }));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("upstream_error");
    expect(body.message).toContain("503");
  });

  it("网络层抛错 → 502 upstream_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const res = await POST(jsonRequest({ type: "bazi", topic: "事业", data: baziData }));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toBe("upstream_error");
  });
});
