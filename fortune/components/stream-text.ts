/**
 * 流式解读的纯文本处理。
 *
 * 模型偶尔仍会吐 Markdown（**加粗**、# 标题、行内代码），界面不做完整渲染，
 * 只剥掉标记字符。剥离必须作用在「累计文本」上：SSE delta 可能切在 `**` 或
 * 反引号中间，逐块剥离会漏出裸标记。
 */

/** 去掉 Markdown 标记字符，保持纯文本段落。 */
export function plainText(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/`{1,3}/g, "");
}

/**
 * 把「累计原文」剥完 Markdown 后，只保留相对上一段的新增文本。
 *
 * 正常情况下新增文本就是前缀差，作为新的一段返回（每段独立播 fade-in）；
 * 后到的 delta 补全标记时（例如先到 `#`、再到 `# 标题`），前缀会变化，
 * 此时回退到「最长公共前缀 + 重切最后一段」，保证渲染结果始终等于
 * `plainText(累计原文)`。
 */
export function appendStripped(segments: string[], raw: string): string[] {
  const stripped = plainText(raw);
  const previous = segments.join("");

  if (stripped.startsWith(previous)) {
    const addition = stripped.slice(previous.length);
    return addition ? [...segments, addition] : segments;
  }

  let common = 0;
  const max = Math.min(stripped.length, previous.length);
  while (common < max && stripped[common] === previous[common]) common += 1;

  const kept: string[] = [];
  let pos = 0;
  for (const segment of segments) {
    if (pos + segment.length > common) break;
    kept.push(segment);
    pos += segment.length;
  }

  const tail = stripped.slice(pos);
  if (tail) kept.push(tail);
  return kept;
}
