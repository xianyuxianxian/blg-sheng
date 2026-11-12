// default open-next.config.ts file created by @opennextjs/cloudflare
// 精简版：不启用 R2 增量缓存（个人小站，ISR 缓存走默认 noop，避免额外建桶）。
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
