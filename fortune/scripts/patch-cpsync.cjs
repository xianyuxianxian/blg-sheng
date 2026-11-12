/**
 * cpSync 跨盘递归复制失效的补丁（本机 Node 24.14 + Windows：C:→E: 递归 cpSync
 * 静默复制 0 个文件，OpenNext 的 initOutputDir 依赖它）。
 * 用法：NODE_OPTIONS="--require ./scripts/patch-cpsync.cjs" npm run cf:build
 * shortcut: 只修这一台构建机的环境问题；Node 修复后删除本文件与 NODE_OPTIONS。
 */
const fs = require("node:fs");
const orig = fs.cpSync;
fs.cpSync = function patchedCpSync(src, dest, options) {
  const opts = { ...options };
  const recursive = Boolean(opts.recursive);
  let srcStat;
  try {
    srcStat = fs.statSync(src);
  } catch {
    return orig.call(this, src, dest, options);
  }
  if (!recursive || !srcStat.isDirectory()) {
    return orig.call(this, src, dest, options);
  }
  // 自实现递归复制：单文件 cpSync 在本机是好的，只有 recursive 有问题
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = pathJoin(src, entry.name);
    const d = pathJoin(dest, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(s, d, opts);
    } else if (entry.isFile()) {
      orig.call(this, s, d, { ...opts, recursive: false });
    }
  }
};
function pathJoin(a, b) {
  return require("node:path").join(String(a), b);
}
