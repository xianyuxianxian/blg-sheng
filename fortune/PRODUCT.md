# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

作者本人 + 朋友小圈子。对八字、六爻、塔罗感兴趣，在桌面浏览器里使用（自家 Windows 电脑，宽屏）。不追求大众化运营，重体验与准确度。

## Product Purpose

中文命理工具「卜也」：八字排盘、六爻起卦、塔罗牌阵三大功能。输入生辰/摇卦/选牌，得到排盘结果与 AI 解读（流式输出）。成功 = 排盘准确、解读可读、体验流畅。

## Positioning

排盘计算完全在前端本地完成（无需联网即可排出），AI 解读走后端流式接口。相比同类产品：本地排盘引擎 + 流式 AI 解读 + 无广告无追踪的小圈子工具。

## Operating Context

- 桌面快捷方式一键启动（launch-buye.ps1，dev server 固定 3210 端口）
- 国内直连可用是硬需求（朋友不翻墙），部署走 EdgeOne Pages
- 产品名「卜也」全站读 `config/site.ts` 的 `SITE_NAME`，不硬编码

## Capabilities and Constraints

- Next.js 16 + TypeScript + Tailwind 4
- AI 解读：讯飞 API（`.env.local`），流式输出；系统里杂牌 `ZHIPU_API_KEY` 环境变量会遮蔽讯飞 key，启动器已处理
- 排盘计算引擎在前端/共享层，AI 解读是 API route
- 3000 端口被 WorkBuddy 占用，dev 固定 3210

## Brand Commitments

- 产品名「卜也」，图标为朱砂底 + 白宋体「卜」+ 金线双框（favicon.ico / icon.svg / apple-touch-icon.png 已交付）
- 视觉基因：朱砂红 + 金线，用户确认延续这套基因重新设计界面

## Evidence on Hand

- 图标三件套：`fortune/public/favicon.ico`、`icon.svg`、`apple-touch-icon.png`
- 站点配置：`fortune/config/site.ts`

## Product Principles

1. 排盘准确第一：命理计算不允许出错
2. 桌面优先：用户主要在宽屏桌面浏览器使用，输入与结果同屏是核心体验
3. 静水深流：命理工具的仪式感来自克制与精确，不靠花哨动效

## Accessibility & Inclusion

键盘焦点可见、reduced motion 尊重、对比度达标。
