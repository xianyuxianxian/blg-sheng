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
npm run build   # next build（output: "export"，产物在 out/）
```

`npm run build` 直接产出纯静态站：`out/` 下含 `index.html`、`about.html`、`bazi.html`、
`liuyao.html`、`tarot.html`、`404.html`，以及 `sitemap.xml`、`robots.txt`。

## 部署说明（Vercel）

本仓库是 monorepo 结构，Next.js 应用在 `fortune/` 子目录，**不在仓库根**。
用 Vercel 导入本仓库时：

1. **Root Directory 必须设为 `fortune/`**（不设会找不到 `package.json`，构建失败）。
2. Framework Preset 选 **Next.js**（自动识别）。
3. 构建命令与输出目录保持默认（`next build`，`output: "export"` 由 `next.config.ts` 决定，
   构建产物 `out/` 由 Next.js 自动处理）；Install Command 保持默认 `npm install`。
4. 环境变量无需配置——没有服务端运行时依赖。

`app/sitemap.ts` 与 `app/robots.ts` 在构建期生成 `out/sitemap.xml`、`out/robots.txt`，
其中的绝对地址由 `config/site.ts` 的 `SITE_URL` 拼接。**上线前必须把 `SITE_URL`
从占位域名 `https://example.com` 改成真实域名**，否则 sitemap / robots 指向占位地址。

## 目录

```
app/          路由（/、/bazi、/liuyao、/tarot、/about）与 metadata route
components/   展示组件（六爻/八字/塔罗结果、分享图）
lib/          纯计算层（bazi / liuyao / tarot），禁止 import React
data/         64 卦数据、纳甲表、全站文案与免责声明
config/       站点常量（SITE_NAME、SITE_URL）
```
