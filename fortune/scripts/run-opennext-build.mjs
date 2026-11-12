/**
 * cf:build 包装器：注入 cpSync 补丁后再跑 opennextjs-cloudflare build。
 * 原因见 scripts/patch-cpsync.cjs —— 本机 Node 24 的 fs.cpSync 递归跨盘复制
 * 静默失败，OpenNext 的 initOutputDir 依赖它（Cloudflare 构建机为 Linux，
 * 不受影响，但本地 preview/验证需要）。
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const patch = path.join(here, "patch-cpsync.cjs");
const existing = process.env.NODE_OPTIONS ? `${process.env.NODE_OPTIONS} ` : "";
const env = { ...process.env, NODE_OPTIONS: `${existing}--require ${JSON.stringify(patch)}` };

const cli = path.join(here, "..", "node_modules", "@opennextjs", "cloudflare", "dist", "cli", "index.js");
const result = spawnSync(process.execPath, [cli, "build"], { stdio: "inherit", env });
process.exit(result.status ?? 1);
