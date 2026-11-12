# fortune

八字排盘、六爻起卦与塔罗牌阵。所有计算（四柱、装卦、洗牌抽牌）都在浏览器本地完成，
无账号、无统计脚本、无上传。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000 。

## 测试与构建

```bash
npm test        # vitest
npm run build   # next build（含 /api/interpret 服务端路由，产物在 .next/）
```

`npm run build` 产出常规 Next 应用：页面在构建期预渲染为静态内容，另有一个
服务端 Route Handler（`/api/interpret`，AI 解读代理）。不再使用 `output: "export"`。

## 部署说明（Vercel）

本仓库是 monorepo 结构，Next.js 应用在 `fortune/` 子目录，**不在仓库根**。
用 Vercel 导入本仓库时：

1. **Root Directory 必须设为 `fortune/`**（不设会找不到 `package.json`，构建失败）。
2. Framework Preset 选 **Next.js**（自动识别）。
3. 构建命令与输出目录保持默认（`next build`，产物 `.next/` 由 Next.js 自动处理）；
   Install Command 保持默认 `npm install`。
4. 环境变量（服务端）：`ZHIPU_API_KEY` **必填**（未配置时 `/api/interpret` 返回 503，
   页面排盘功能不受影响）；`AI_BASE_URL`、`AI_MODEL` 可选，用于切换 OpenAI 兼容端点与模型。

`app/sitemap.ts` 与 `app/robots.ts` 在构建期生成 `/sitemap.xml`、`/robots.txt`，
其中的绝对地址由 `config/site.ts` 的 `SITE_URL` 拼接。**上线前必须把 `SITE_URL`
从占位域名 `https://example.com` 改成真实域名**，否则 sitemap / robots 指向占位地址。

## 目录

```
app/          路由（/、/bazi、/liuyao、/tarot、/about）、metadata route 与 /api/interpret
components/   展示组件（六爻/八字/塔罗结果、分享图）
lib/          纯计算层（bazi / liuyao / tarot / ai），禁止 import React
data/         64 卦数据、纳甲表、全站文案与免责声明
config/       站点常量（SITE_NAME、SITE_URL）
```
