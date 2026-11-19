# Surface brief: app/bazi/page.tsx（八字页，代表三个功能页的共享架构决策）

## Scope & mode

Operate。用户完成任务：输入生辰 → 排盘 → 读结果 → AI 解读。桌面为主场景。

## Audience & job

作者与朋友小圈子，桌面宽屏浏览器使用。任务：输入生辰，看四柱排盘，得 AI 解读。

## Direction contract

THESIS: 桌面端从「竖排文书卷轴」升级为「文房案头」——宣纸横摊，四柱如案上罗列的签筒文书，输入与结果同屏对望，移动端保持竖卷不变。拒绝的类别默认：把宽屏当移动端拉伸（单栏 max-w-2xl 居中留大片空白）。

OWN-WORLD: 延续朱砂+金线基因：宣纸底 `--surface`、墨字 `--fg`、朱砂界行 `--accent`、铜金点缀 `--gold`；竖排大字保留在结果展示，桌面新增横排信息密度层；组件语言 = 朱丝栏表格、方印、鱼尾、签筒 chip。

STORY: 访客明白「输入在左（或上），排盘在右（或下），解读随排而生」，改一次输入即看新盘，无需滚动往返。

FIRST VIEWPORT: 桌面 ≥1024px 时两栏布局——左栏（约 380px）输入表单 + 事项选择，右栏排盘结果（四柱表 + 五行环 + 大运轴），AI 解读横贯两栏下方或右栏下部；移动端维持现有单栏顺序不变。主操作「排盘」按钮在左栏底部。

FORM: 桌面适配走 code-led。断点体系：sm(640) 保持现有语义，新增 lg(1024) 为桌面双栏档位，桌面增强全部挂在 lg:。

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Chosen direction & memorable moment

朱砂案头：宽屏下四柱从竖排卷轴变为横排案头文书，五行环 SVG 放大居右，输入与排盘同屏对望。记忆点 = 双栏对望的「案头」结构。

## Unresolved decisions

- 六爻/塔罗页的桌面布局细节在各自实现时按同套 lg: 体系推导（六爻：起卦与卦象同屏；塔罗：牌阵桌面放大）
- AiInterpret 在桌面双栏中的具体位置按实现时视觉平衡决定
