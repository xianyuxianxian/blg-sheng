# 「blg必胜」命理产品 MVP 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 纯前端静态站（Next.js 静态导出），提供八字排盘、六爻起卦、塔罗牌阵三个功能，所有计算与数据在浏览器本地完成。

**Architecture:** 计算层（`lib/`，纯函数，不 import React）与数据层（`data/`，TS 常量/JSON）严格分离，界面层（`app/` + `components/`）只做渲染与交互。产品名等站点信息单点配置在 `config/site.ts`。lunar-typescript 为全量包，各功能页 `next/dynamic` 懒加载。

**Tech Stack:** Next.js（App Router，`output: 'export'`）、TypeScript、Tailwind CSS、lunar-typescript（历史法引擎）、html-to-image（分享卡）、Vitest（测试）。

**Spec:** `docs/superpowers/specs/2026-11-11-fortune-teller-design.md`

## Global Constraints

- 产品名 **blg必胜**，只能从 `config/site.ts` 的 `SITE_NAME` 读取，任何组件/页面不得硬编码。
- 用户生辰数据不得离开浏览器：无任何网络请求携带用户输入；埋点（如有）不得含生辰字段。
- 计算层 `lib/` 内文件禁止 import React 或任何 `app/`、`components/` 模块。
- 随机源统一用 `crypto.getRandomValues`（封装在 `lib/random.ts`），禁止 `Math.random`。
- 排盘口径页面注明：晚子时换日、朱熹变占法、梅花式时间起卦、北京时间平太阳时。
- 八字/六爻页面必须懒加载 lunar-typescript（`next/dynamic` 或页面级 `import()`），避免其进入首屏 bundle。
- 文案宁可缺不给：没有把握的组合不显示解读，只显示数据。
- 每个结果页页脚放免责声明一行 + `/about` 链接。

## Review Focus

最可能咬人的输入/条件（每条已指定归属任务的测试）：

1. **节气边界出生**：如 1987-02-04 立春当天出生，年柱月柱随节气时刻切换——Task 3 测试 pin。
2. **晚子时（23:00–01:00）**：日柱必须换日，年柱月柱不换——Task 3 测试 pin。
3. **多爻动取占**：朱熹法则各爻数分支（0/1/2/3/4/5/6 爻动）取辞不同——Task 8 测试 pin。
4. **时辰映射**：时辰区间取中点时刻调用历法，避免当日节气时刻边界错排——Task 3 测试 pin。
5. **分享图在无网络字体/图片时不得空白**：系统字体栈 + 牌图为同源资源——Task 10 手动验证步骤 pin（自动测试只验证不抛异常）。

---

## File Structure

```
config/site.ts                  站点单点配置（SITE_NAME 等）
lib/random.ts                   crypto.getRandomValues 封装
lib/bazi/types.ts               八字类型定义
lib/bazi/paiPan.ts              四柱排盘（调 lunar-typescript）
lib/bazi/wuXing.ts              五行统计旺衰
lib/bazi/shiShen.ts             十神（库提供，封装输出结构）
lib/bazi/daYun.ts               大运封装
lib/bazi/interpret.ts           规则式解读文案拼接
lib/liuyao/types.ts             六爻类型
lib/liuyao/najia.ts             纳甲/六亲/世应装卦算法
lib/liuyao/qigua.ts             掷币起卦 + 时间起卦
lib/liuyao/bianZhan.ts          朱熹变占取辞法则
lib/tarot/deck.ts               牌堆、洗牌、抽牌、牌阵
data/64gua.json                 64 卦：卦名/卦辞/爻辞/上下卦/世应爻位
data/najia-tables.ts            纳甲表、六亲基准（八宫五行）
data/tarot-cards.ts             78 张牌 + 正逆位文案
data/bazi-wenan.ts              五行旺衰→文案映射
data/disclaimer.ts              免责声明文案
app/layout.tsx  app/page.tsx    布局与首页
app/bazi/page.tsx  app/liuyao/page.tsx  app/tarot/page.tsx
app/about/page.tsx
components/…                    各功能 UI 与分享卡组件
public/tarot/…                  韦特牌图（78 张）
```

---

### Task 1: 脚手架 + 站点配置 + 随机源

**Files:**
- Create: Next.js 项目脚手架（本仓库根目录下 `fortune/` 子目录或按仓库现状定，见 Step 1）、`config/site.ts`、`lib/random.ts`
- Test: `lib/random.test.ts`

**Interfaces:**
- Produces: `SITE_NAME: string`（值为 `"blg必胜"`）、`randomInt(maxExclusive: number): number`、`pick<T>(arr: T[]): T`

- [ ] **Step 1: 脚手架** — `create-next-app`（TS + Tailwind + App Router），配置 `output: 'export'`，安装 `lunar-typescript`、`html-to-image`、`vitest`。
- [ ] **Step 2: 写失败测试** — `randomInt(1)` 恒返回 0；`randomInt` 10000 次采样全部落在 `[0, max)`；`pick` 返回数组元素之一。
- [ ] **Step 3: 验证失败** → `Step 4: 实现` → **Step 5: 验证通过**
- [ ] **Step 6: Commit** `feat: scaffold + site config + crypto random`

### Task 2: 64 卦数据文件

**Files:**
- Create: `data/64gua.json`、`data/najia-tables.ts`
- Test: `data/64gua.test.ts`

**Interfaces:**
- Produces: `GUA64`：按上卦/下卦索引取卦对象 `{ name, guaCi, yaoCi: string[6], shiYao: 0-5, palaces }`；纳甲表：八宫每爻地支+天干映射；六亲基准表（本宫五行）。
- 数据来源：调研 GitHub 开源京房纳甲数据集转换（评审已确认可行），来源 URL 写入文件头注释。

- [ ] **Step 1: 写失败测试** — 64 卦齐全；抽查《乾》《坤》《既济》《未济》卦辞原文正确（比对通行本）；每卦爻辞恰 6 条；世应爻位抽查 3 卦正确（乾世 5 应 2、坤世 3 应 0、既济世 2 应 5）。
- [ ] **Step 2: 验证失败** → **Step 3: 整理数据文件** → **Step 4: 验证通过** → **Step 5: Commit** `feat: 64gua + najia data`

### Task 3: 八字排盘计算层

**Files:**
- Create: `lib/bazi/types.ts`、`lib/bazi/paiPan.ts`、`lib/bazi/wuXing.ts`、`lib/bazi/daYun.ts`
- Test: `lib/bazi/paiPan.test.ts`、`lib/bazi/wuXing.test.ts`

**Interfaces:**
- Produces:
  - `paiPan(input: { y: number; m: number; d: number; hourIndex: number; gender: 'm' | 'f' }): PaiPanResult`
    - `hourIndex`: 0-11（子=0），内部映射为时辰中点时刻（如子时取 00:30 或按晚子时规则取次日 00:30）调 lunar-typescript。
    - `PaiPanResult = { siZhu: { year: SiZhu; month: SiZhu; day: SiZhu; hour: SiZhu }; wuXing: WuXingStat; shiShen: …; daYun: DaYunStep[10]; note: string[] }`
  - `SiZhu = { gan: string; zhi: string; hideGan: string[]; naYin: string; shiShenGan: string; shiShenZhi: string[] }`
  - 晚子时规则：`hourIndex === 0` 且输入时刻 ≥ 23:00（即用户选"23:00–01:00"时）日柱进位一天，年柱月柱不进位；`note` 中注明口径。

- [ ] **Step 1: 写失败测试**（值全部来自已验证事实）：
  - 节气边界：1987-02-04 立春当日，02-04（立春时刻后）年柱丁卯、02-03 前年柱丙寅（用 lunar-typescript 实际节气时刻取边界两侧各一例）。
  - 晚子时：2020-01-01 23:30 → 日柱为 01-02 之日柱，年月柱仍为 01-01 之柱。
  - 稳定已知盘：如 1990-06-15 午时男，四柱与公开排盘网站结果一致（实现时核对一次后把值 pin 进测试）。
  - 大运：阳年生男顺排、阴年生男逆排，各测一例；步数 = 10。
  - 五行：金木水火土计数之和 = 8（四柱干支各算一）。
- [ ] **Step 2: 验证失败** → **Step 3: 实现三个模块**（lunar-typescript `getEightChar` API 已实测具备所需能力；`DaYun` 用 `getYun(gender)` 取起运岁数与顺逆）→ **Step 4: 验证通过** → **Step 5: Commit** `feat: bazi calc layer`

### Task 4: 八字解读 + 八字页面

**Files:**
- Create: `lib/bazi/interpret.ts`、`data/bazi-wenan.ts`、`app/bazi/page.tsx`、`components/BaziResult.tsx`
- Test: `lib/bazi/interpret.test.ts`

**Interfaces:**
- Consumes: Task 3 的 `paiPan`。
- Produces: `interpretWuXing(stat: WuXingStat): string[]` — 仅对把握足的组合（如"某行 ≥4 偏枯""五行俱全且均衡"）给文案，其余返回空数组（页面显示"暂无解读"）。

- [ ] **Step 1: 失败测试** — 极端分布给文案、均衡分布给文案、中间分布返回空数组。
- [ ] **Step 2: 验证失败** → **Step 3: 实现文案映射与页面**（页面：生辰输入 → 排盘表 + 内联 SVG 五行图 + 大运时间轴 + 解读区 + 注明口径；lunar-typescript 仅经 `paiPan` 间接引用，页面 `dynamic` 引入结果组件）→ **Step 4: 验证通过** → **Step 5: `next build` 通过静态导出** → **Step 6: Commit** `feat: bazi page`

### Task 5: 塔罗数据 + 抽牌逻辑

**Files:**
- Create: `data/tarot-cards.ts`、`lib/tarot/deck.ts`、`public/tarot/`（78 张公版韦特图，见 Step 3）
- Test: `lib/tarot/deck.test.ts`

**Interfaces:**
- Consumes: `lib/random.ts`。
- Produces: `TAROT_CARDS: TarotCard[]`（78 张，`{ id, name, arcana: 'major' | 'minor', suit?, image: string, upright: string, reversed: string }`）；`drawSpread(count: number): DrawnCard[]`（Fisher-Yates，正逆位各 50%）；`SPREADS: { three: SpreadDef }`（一期三张阵，结构预留扩展）。

- [ ] **Step 1: 失败测试** — 78 张齐全、无重复 id；抽 3 张互不重复；正/逆位分布 10000 次采样比例在 45–55%；洗牌结果仍为原集合。
- [ ] **Step 2: 验证失败** → **Step 3: 整理 78 张牌数据与文案**（正逆位各一段，宁缺毋滥可先短后长；牌图下载公版韦特源，文件头注明出处）→ **Step 4: 验证通过** → **Step 5: Commit** `feat: tarot data + deck`

### Task 6: 塔罗页面

**Files:**
- Create: `app/tarot/page.tsx`、`components/TarotSpread.tsx`

**Interfaces:**
- Consumes: Task 5 全部输出。

- [ ] **Step 1: 实现页面** — 洗牌动画（CSS transition）→ 翻牌交互 → 牌位含义 + 解读；牌图 `loading="lazy"`。
- [ ] **Step 2: 验证** — `next build` 通过；手动走通"洗牌→抽牌→看解读"流程 → **Step 3: Commit** `feat: tarot page`

### Task 7: 六爻装卦算法

**Files:**
- Create: `lib/liuyao/types.ts`、`lib/liuyao/najia.ts`
- Test: `lib/liuyao/najia.test.ts`

**Interfaces:**
- Consumes: Task 2 的纳甲表与 64 卦数据。
- Produces: `zhuangGua(shangGua: Trigram, xiaGua: Trigram, movingLines: number[]): ZhuangResult`，`ZhuangResult` 含每爻 `{ diZhi, gan, liuQin, isMoving, isShi, isYing }` 与卦名。

- [ ] **Step 1: 失败测试** — 抽查 4 卦装卦正确（乾宫乾卦：六爻地支子寅辰午申戌、六亲全部兄弟；坤卦等按京房八宫表）；世应爻位与数据一致；动爻标记正确传递。
- [ ] **Step 2: 验证失败** → **Step 3: 实现装卦**（纯查表 + 本宫五行定六亲：同我为兄弟、生我为父母、我生为子孙、克我为官鬼、我克为妻财）→ **Step 4: 验证通过** → **Step 5: Commit** `feat: najia algorithm`

### Task 8: 起卦 + 变占法则

**Files:**
- Create: `lib/liuyao/qigua.ts`、`lib/liuyao/bianZhan.ts`
- Test: `lib/liuyao/qigua.test.ts`、`lib/liuyao/bianZhan.test.ts`

**Interfaces:**
- Consumes: `lib/random.ts`、Task 7 装卦、Task 2 卦辞爻辞。
- Produces:
  - `qiGuaByCoin(tosses: number[][]): QiGuaResult`（每掷三枚：3 正=老阴 ⚋ 动、2 正=少阳、1 正=少阴、0 正=老阳 ⚋ 动；`tosses` 为注入值便于测试）
  - `qiGuaByTime(date: Date): QiGuaResult`（农历年支数、月数、日数取上卦，加时辰数取下卦与动爻）
  - `bianZhan(benGua: string, bianGua: string, movingCount: number): QuZhanResult` — 朱熹《易学启蒙》法则七种情况（0 爻动取本卦卦辞；1 爻动取本卦动爻爻辞；2 爻动取本卦二动爻，上爻为主；3 爻动取本卦及变卦卦辞，本卦为贞变卦为悔；4 爻动取变卦二不动爻，下爻为主；5 爻动取变卦不动爻；6 爻动乾坤占二用、余卦占变卦卦辞）。

- [ ] **Step 1: 失败测试** — 掷币注入全正/全反序列得确定卦象；时间起卦固定日期值 pin（实现时与梅花易数通行算法核对一次）；变占七种情况各一例（6 爻动乾坤用二用特殊分支单独测）。
- [ ] **Step 2: 验证失败** → **Step 3: 实现** → **Step 4: 验证通过** → **Step 5: Commit** `feat: qigua + bianzhan`

### Task 9: 六爻页面

**Files:**
- Create: `app/liuyao/page.tsx`、`components/LiuyaoResult.tsx`

**Interfaces:**
- Consumes: Task 7、8 全部输出。

- [ ] **Step 1: 实现页面** — 两种起卦入口（手动掷币六次动画 / 时间起卦）→ 卦象图示（六爻自下而上，动爻标 O/×）→ 装卦标注（六亲世应纳甲）→ 取辞结果；页脚注明"采用朱熹变占法/梅花式时间起卦"。
- [ ] **Step 2: 验证** — `next build` 通过；手动掷币与时间起卦各走通一次 → **Step 3: Commit** `feat: liuyao page`

### Task 10: 分享卡片

**Files:**
- Create: `components/ShareCard.tsx`
- Modify: 三个结果页引入

**Interfaces:**
- Consumes: 各结果容器 DOM 节点。

- [ ] **Step 1: 实现** — `html-to-image` 把结果区渲染为 PNG 下载；卡片顶部 `SITE_NAME` 水印（从 config 读取）；生辰默认隐去年份，开关控制（仅影响图片，口径文案见 spec）；全系统字体栈。
- [ ] **Step 2: 验证** — 三页各生成一次图片成功且非空白；`next build` 通过 → **Step 3: Commit** `feat: share card`

### Task 11: 首页 + 关于页 + 部署

**Files:**
- Create: `app/page.tsx`、`app/about/page.tsx`、`data/disclaimer.ts`、`components/DisclaimerFooter.tsx`
- Modify: 三个结果页页脚接入

- [ ] **Step 1: 实现** — 首页三入口卡 + 一句定位 + 隐私承诺（"生辰只在你的浏览器中计算"）；about 页免责声明（娱乐与传统文化参考/不构成决策建议/不收集数据）；全站名称仅引用 `SITE_NAME`；grep 校验 `blg必胜` 只出现在 `config/site.ts`。
- [ ] **Step 2: 全量验证** — `npm test` 全绿 + `next build` 通过。
- [ ] **Step 3: 部署** — Vercel 导入仓库，预览域名验证三个功能页可用。
- [ ] **Step 4: Commit** `feat: home + about + deploy`

---

## 里程碑对照

Task 1–2（第 0.5 周）→ Task 3–4（八字，1 周）→ Task 5–6（塔罗，0.5 周）→ Task 7–9（六爻，1~1.5 周）→ Task 10–11（分享卡与上线，0.5 周）
