<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 构建与类型检查（已实测，2026-11-17）

- **`next.config.ts` 里 `typescript.ignoreBuildErrors: true` 是有意的**，背后是 13 个已知的 `TS7006` / `TS2366`（zod v4 推断产物，见该文件 `shortcut:` 注释）。
- 因此 `npx.cmd tsc --noEmit` **必然报 13 个错**，这不是回归。判断有没有引入新错，看**错误总数是否仍是 13**、以及报错文件里有没有你刚改的那个。
- `npm.cmd run build` 通过 = 真通过（`Compiled successfully` + 11 个静态页）。`npm.cmd test` 当前基线是 **14 files / 264 tests**。
