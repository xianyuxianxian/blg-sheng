"use client";

import { useCallback, useState, type RefObject } from "react";
import { SITE_NAME } from "@/config/site";
import { DISCLAIMER_LINE } from "@/data/disclaimer";

/**
 * 分享图：把结果区渲染成 PNG 长图下载。
 *
 * 实现要点：
 * - `html-to-image` 只在点击时动态引入，不进首屏 bundle。
 * - 全程系统字体栈 + `skipFonts`：避免内嵌 webfont 的兼容问题（分享图不得空白）。
 * - 不克隆页面节点直接截图，而是克隆到离屏容器里加「水印头 + 免责尾」，
 *   顺便在克隆上做脱敏——页面本体完全不受影响。
 * - 无网络上传：牌图是同源静态资源，会被内联成 data URL。
 */

/** 正文系统字体栈（禁 webfont）。 */
const SANS_STACK =
  'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
/** 标题/干支用衬线系统字体栈。 */
const SERIF_STACK = 'ui-serif, Georgia, "Songti SC", "SimSun", serif';

const PAPER = "#f7f2e7";
const INK = "#26221b";
const MUTED = "#6f6451";
const ACCENT = "#a63a2c";
const RULE = "#ddd2bb";

/** 卡片逻辑宽度（CSS px）。导出按 2 倍像素密度，得到 1440px 宽的长图。 */
const CARD_WIDTH = 720;
const PIXEL_RATIO = 2;

/** 分享图里出生年份的占位符。 */
const REDACTED_YEAR = "××××";
/** 由生辰推算出来的起运时刻替换成的占位文案。 */
const REDACTED_DATE = "年份略";
/** `YYYY-MM-DD` 形式的日期（排盘口径里的起运日期）。 */
const REDACTED_DATE_PATTERN = /\d{4}-\d{2}-\d{2}/g;
const REDACTED_DATE_PLACEHOLDER = "××××-××-××";

/** 单张图的生成上限：超过就报错，避免按钮永久 disabled。 */
const CAPTURE_TIMEOUT_MS = 20_000;

/** 给 Promise 加超时；超时和失败走同一条错误路径。 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}超时（${Math.round(ms / 1000)} 秒）`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export type ShareImageOptions = {
  /** 卡片右上角的场景标签，如「八字排盘」。 */
  label?: string;
  /** 隐去出生年份与由生辰推算的日期；只影响分享图。 */
  hideBirthYear?: boolean;
};

/**
 * 遍历文本节点做替换，保留元素结构（颜色、字号都在子元素上）。
 */
function replaceInTextNodes(root: Node, replace: (text: string) => string): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push(node as Text);
  }
  for (const node of nodes) {
    const next = replace(node.data);
    if (next !== node.data) node.data = next;
  }
}

/**
 * 在克隆上脱敏：结果组件用 `data-share-redact` 标出需要处理的位置。
 * - `year`：元素内容整段换成 `××××`（出生年份本身）。
 * - `derived`：整段换成占位文案（起运公历时刻；大运年份区间按裁决保留）。
 * - `dates`：只把 `YYYY-MM-DD` 换成 `××××-××-××`（排盘口径里的起运日期）。
 *
 * 说明：年份单独包成元素而不是靠正则匹配，因为 JSX 里数字与「年」常分属不同文本节点。
 */
function applyBirthPrivacy(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-share-redact="year"]').forEach((el) => {
    el.textContent = REDACTED_YEAR;
  });
  root.querySelectorAll<HTMLElement>('[data-share-redact="derived"]').forEach((el) => {
    el.textContent = REDACTED_DATE;
  });
  root.querySelectorAll<HTMLElement>('[data-share-redact="dates"]').forEach((el) => {
    replaceInTextNodes(el, (text) => text.replace(REDACTED_DATE_PATTERN, REDACTED_DATE_PLACEHOLDER));
  });
}

/**
 * 冻结动画：克隆节点上的 CSS 动画会从头播放，`both` 填充的入场动画会让文字
 * 停在 opacity:0 —— 截出来就是空白。分享图要的是终态，所以全部关掉。
 */
function freezeAnimations(root: HTMLElement): void {
  root.style.animation = "none";
  root.style.transition = "none";
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.animation = "none";
    el.style.transition = "none";
  });
}

/**
 * 横向滚动条在大运时间轴上会截断后几步：克隆时改成换行，保证分享图信息完整。
 */
function expandScrollStrips(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.scrollWidth - el.clientWidth <= 8) return;
    const style = window.getComputedStyle(el);
    if (style.overflowX !== "auto" && style.overflowX !== "scroll") return;
    el.style.overflowX = "visible";
    el.style.overflowY = "visible";
    el.style.height = "auto";
    if (style.display.includes("flex")) el.style.flexWrap = "wrap";
  });
}

/** 卡片外框：顶部 SITE_NAME 水印 + 正文 + 底部免责与隐私说明。返回的节点即截图目标。 */
function buildCard(body: HTMLElement, label: string | undefined): HTMLElement {
  const card = document.createElement("div");
  card.setAttribute("aria-hidden", "true");
  Object.assign(card.style, {
    width: `${CARD_WIDTH}px`,
    padding: "36px 36px 28px",
    boxSizing: "border-box",
    backgroundColor: PAPER,
    color: INK,
    fontFamily: SANS_STACK,
    fontSize: "14px",
    lineHeight: "1.6",
  });

  const header = document.createElement("div");
  Object.assign(header.style, {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "16px",
    paddingBottom: "14px",
    marginBottom: "28px",
    borderBottom: `1px solid ${RULE}`,
  });

  const brand = document.createElement("span");
  brand.textContent = SITE_NAME;
  Object.assign(brand.style, {
    fontFamily: SERIF_STACK,
    fontSize: "20px",
    letterSpacing: "0.16em",
    color: ACCENT,
  });

  const tag = document.createElement("span");
  tag.textContent = label ?? "命理排盘";
  Object.assign(tag.style, {
    fontSize: "11px",
    letterSpacing: "0.2em",
    color: MUTED,
  });

  header.append(brand, tag);

  Object.assign(body.style, { width: "100%" });

  const footer = document.createElement("div");
  Object.assign(footer.style, {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: "8px 16px",
    paddingTop: "14px",
    marginTop: "32px",
    borderTop: `1px solid ${RULE}`,
    fontSize: "11px",
    lineHeight: "1.7",
    color: MUTED,
  });

  const disclaimer = document.createElement("span");
  disclaimer.textContent = `${SITE_NAME} · ${DISCLAIMER_LINE}`;
  const privacy = document.createElement("span");
  privacy.textContent = "生辰本地计算 · 不上传";
  footer.append(disclaimer, privacy);

  card.append(header, body, footer);
  return card;
}

/**
 * 把目标节点渲染成 PNG data URL。
 *
 * 目标节点只需是可截图的 DOM；`data-share-hide` 的子节点、脱敏标记都在克隆上处理，
 * 页面本体保持原样。
 */
export async function createShareImage(
  target: HTMLElement,
  options: ShareImageOptions,
): Promise<string> {
  if (typeof document === "undefined") {
    throw new Error("分享图只能在浏览器中生成。");
  }

  // 动态引入：html-to-image 只在点击「保存分享图」时需要。
  const { toPng } = await import("html-to-image");

  const clone = target.cloneNode(true) as HTMLElement;
  // 副本与页面同时在文档里，去掉重复 id 免得 aria-labelledby 指向错节点。
  clone.removeAttribute("id");
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  clone.querySelectorAll("[data-share-hide]").forEach((el) => el.remove());

  if (options.hideBirthYear) applyBirthPrivacy(clone);

  // 截图节点本身不能带 position/left 偏移：html-to-image 会把内联样式原样搬进
  // foreignObject，带偏移会渲染成空白。离屏只放在外层 holder 上。
  const card = buildCard(clone, options.label);
  const holder = document.createElement("div");
  Object.assign(holder.style, {
    position: "fixed",
    left: "-100000px",
    top: "0",
    zIndex: "-1",
    pointerEvents: "none",
  });
  holder.appendChild(card);
  document.body.appendChild(holder);

  try {
    // 必须先入文档再量：脱离文档的节点 scrollWidth/clientWidth 全是 0。
    expandScrollStrips(card);
    freezeAnimations(card);

    return await withTimeout(
      toPng(card, {
        pixelRatio: PIXEL_RATIO,
        backgroundColor: PAPER,
        // 只用系统字体：webfont 不内嵌，规避 html-to-image 的字体兼容问题。
        skipFonts: true,
      }),
      CAPTURE_TIMEOUT_MS,
      "生成分享图",
    );
  } finally {
    holder.remove();
  }
}

/** 触发浏览器下载（同源 data URL，不上传）。 */
export function downloadShareImage(dataUrl: string, fileName: string): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function dateStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export type ShareButtonProps = {
  /** 要截图的结果容器。 */
  targetRef: RefObject<HTMLElement | null>;
  /** 下载文件名前缀，如 `bazi`。 */
  fileName: string;
  /** 卡片右上角的场景标签。 */
  label?: string;
  /** 显示「分享图显示完整出生日期」开关（含生辰的页面传 true）。 */
  birthPrivacy?: boolean;
  className?: string;
};

export function ShareButton({
  targetRef,
  fileName,
  label,
  birthPrivacy = false,
  className = "",
}: ShareButtonProps) {
  // 默认隐去年份：开关只影响分享图，页面本体始终显示完整日期。
  const [showFullDate, setShowFullDate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    const target = targetRef.current;
    if (!target) {
      setMessage("还没有可分享的结果，请先完成排盘。");
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const dataUrl = await createShareImage(target, {
        label,
        hideBirthYear: birthPrivacy && !showFullDate,
      });
      downloadShareImage(dataUrl, `${fileName}-${dateStamp()}.png`);
      setMessage("分享图已生成，请查看浏览器下载。");
    } catch (error) {
      // 库的原始错误（含 DOM/canvas 细节）只留给控制台，界面给固定中文文案。
      console.error("[share]", error);
      const detail =
        process.env.NODE_ENV !== "production" && error instanceof Error
          ? `（${error.message}）`
          : "";
      setMessage(`生成失败，请重试${detail}`);
    } finally {
      setBusy(false);
    }
  }, [targetRef, fileName, label, birthPrivacy, showFullDate]);

  return (
    <div data-share-hide className={`flex flex-col gap-3 ${className}`.trim()}>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="h-10 w-full rounded-[2px] border border-[#a63a2c] px-6 text-sm tracking-[0.2em] text-[#a63a2c] transition-colors hover:bg-[#fbf2ec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a63a2c] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {busy ? "生成中…" : "保存分享图"}
      </button>

      {birthPrivacy ? (
        <label className="flex items-start gap-2 text-[11px] leading-5 text-[#6f6451]">
          <input
            type="checkbox"
            checked={showFullDate}
            onChange={(e) => setShowFullDate(e.currentTarget.checked)}
            className="mt-[3px] h-3.5 w-3.5 accent-[#a63a2c]"
          />
          <span>
            在分享图中显示完整出生日期
            <span className="mt-0.5 block text-[#786c57]">
              默认隐去出生年份；开关只影响分享图，页面显示不变。生辰仅在本地处理，不会上传。
            </span>
          </span>
        </label>
      ) : null}

      <p role="status" aria-live="polite" className="min-h-4 text-[11px] leading-5 text-[#786c57]">
        {message}
      </p>
    </div>
  );
}
