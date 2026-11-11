/**
 * 78 张塔罗牌数据（韦特塔罗 / Rider-Waite-Smith, 1909，已进入公有领域）。
 *
 * 牌图出处：Wikimedia Commons 上的 1909 年 RWS 扫描件（Pamela Colman Smith 绘）。
 * - 大阿尔卡那：https://commons.wikimedia.org/wiki/File:RWS_Tarot_00_Fool.jpg
 *   （同目录下 RWS_Tarot_01_Magician.jpg … RWS_Tarot_21_World.jpg，共 22 张）
 * - 小阿尔卡那：https://commons.wikimedia.org/wiki/File:Wands01.jpg
 *   （Wands01–Wands14 / Cups01–Cups14 / Swords01–Swords14 / Pents01–Pents14，共 56 张；
 *    11–14 依次为 Page / Knight / Queen / King）
 * - 分类页：https://commons.wikimedia.org/wiki/Category:Rider-Waite_tarot_deck
 * 本地文件位于 public/tarot/，文件名为牌 id + .jpg。
 * 为控制页面体积，下载后统一缩放为宽 500px、JPEG 质量 85（原图 1144px 宽）；
 * 未做其它裁剪或调色。
 *
 * 文案：按通行韦特牌义撰写，仅供参考与自我觉察，不作为决策依据。
 */

export type TarotArcana = "major" | "minor";
export type TarotSuit = "wands" | "cups" | "swords" | "pentacles";

export type TarotCard = {
  id: string;
  name: string;
  arcana: TarotArcana;
  suit?: TarotSuit;
  /** public 路径，形如 /tarot/major-00-fool.jpg */
  image: string;
  upright: string;
  reversed: string;
};

export const TAROT_CARDS: TarotCard[] = [
  // ───────────── 大阿尔卡那 22 张 ─────────────
  {
    id: "major-00-fool",
    name: "愚者",
    arcana: "major",
    image: "/tarot/major-00-fool.jpg",
    upright:
      "一段全新的旅程正等着你，带着好奇与轻装上阵的勇气出发。此刻不必样样计划周全，信任直觉、允许自己犯点小错，反而更容易遇见意外的机遇。",
    reversed:
      "冲动与不设边界容易被误当成自由，你可能在没看清方向时就跳了出去。先停下来确认脚下是否踏实，再决定要不要迈出这一步。",
  },
  {
    id: "major-01-magician",
    name: "魔术师",
    arcana: "major",
    image: "/tarot/major-01-magician.jpg",
    upright:
      "你手里的资源比想象中更齐全，意志、口才与行动力正当其时。把想法落成具体的第一步，事情就会开始运转。",
    reversed:
      "想法停留在口头，或把能力用在了操控与取巧上。回到真实的目标，先补上缺失的那块技能或诚意。",
  },
  {
    id: "major-02-high-priestess",
    name: "女祭司",
    arcana: "major",
    image: "/tarot/major-02-high-priestess.jpg",
    upright:
      "答案不在喧闹处，而在你尚未说出口的直觉里。适合静观、记录梦境与细节，让信息自己沉淀成形。",
    reversed:
      "你在忽视内心的声音，或被表象与秘密牵着走。停止过度分析，给直觉留出一点安静的空间。",
  },
  {
    id: "major-03-empress",
    name: "皇后",
    arcana: "major",
    image: "/tarot/major-03-empress.jpg",
    upright:
      "丰盛、滋养与创造力流动的时期，适合照料关系、身体与作品。你给予的温柔会以看得见的方式回到你身上。",
    reversed:
      "过度付出让你耗尽自己，或创造力被琐事淤塞。先把滋养留一部分给自己，再谈照顾别人。",
  },
  {
    id: "major-04-emperor",
    name: "皇帝",
    arcana: "major",
    image: "/tarot/major-04-emperor.jpg",
    upright:
      "结构、责任与边界带来安全感，现在是建立秩序与长期规划的时候。用清晰的规则代替临时的强硬。",
    reversed:
      "控制欲过强或秩序僵化，让关系与工作都失去弹性。适度放权、允许试错，权威才立得住。",
  },
  {
    id: "major-05-hierophant",
    name: "教皇",
    arcana: "major",
    image: "/tarot/major-05-hierophant.jpg",
    upright:
      "传统、师承与共同的价值观在此发挥作用，向有经验的人请教会有收获。遵循经过验证的方法，比另辟蹊径更稳。",
    reversed:
      "你在质疑既定的规矩，或被困在形式里失去了本意。可以离开旧框架，但要清楚自己真正相信什么。",
  },
  {
    id: "major-06-lovers",
    name: "恋人",
    arcana: "major",
    image: "/tarot/major-06-lovers.jpg",
    upright:
      "一段关系或一次选择要求你诚实面对自己的价值观。跟随真正在意的东西做决定，心与行动就会一致。",
    reversed:
      "选择困难或关系失衡，可能有人在回避该说的话。先厘清自己的立场，再谈要不要继续。",
  },
  {
    id: "major-07-chariot",
    name: "战车",
    arcana: "major",
    image: "/tarot/major-07-chariot.jpg",
    upright:
      "明确的目标加上自控力，让你能把相互拉扯的力量收拢成一个方向。保持专注，胜利属于坚持推进的人。",
    reversed:
      "用力过猛却方向不明，或内外力量彼此抵消。先停下来重新校准目标，再踩油门。",
  },
  {
    id: "major-08-strength",
    name: "力量",
    arcana: "major",
    image: "/tarot/major-08-strength.jpg",
    upright:
      "真正的强大是温柔而坚定地面对本能与情绪。以耐心驯服而非压制，你会赢得长久的掌控感。",
    reversed:
      "自我怀疑或情绪失控在消耗你，也可能用强硬掩盖脆弱。承认害怕，反而能取回力量。",
  },
  {
    id: "major-09-hermit",
    name: "隐士",
    arcana: "major",
    image: "/tarot/major-09-hermit.jpg",
    upright:
      "需要独处与内省的时期，答案要靠自己一步步照亮。放慢节奏，审视真正想要的是什么。",
    reversed:
      "孤立过头变成了逃避，或拒绝听取任何外来的声音。适度回到人群中，检验你的思考。",
  },
  {
    id: "major-10-wheel-of-fortune",
    name: "命运之轮",
    arcana: "major",
    image: "/tarot/major-10-wheel-of-fortune.jpg",
    upright:
      "局势正在转动，时机比努力更关键。顺势而为，接受变化带来的新位置。",
    reversed:
      "循环卡在原地，或你在抵抗不可避免的转变。看清哪些是运气、哪些是自己可以改变的。",
  },
  {
    id: "major-11-justice",
    name: "正义",
    arcana: "major",
    image: "/tarot/major-11-justice.jpg",
    upright:
      "因果与平衡正在显影，诚实与公平会带来应有的结果。做决定时以事实和原则为准。",
    reversed:
      "偏见、推诿或失衡的责任让人难以信服。先承认自己那一份，再要求公正。",
  },
  {
    id: "major-12-hanged-man",
    name: "倒吊人",
    arcana: "major",
    image: "/tarot/major-12-hanged-man.jpg",
    upright:
      "暂停不是停滞，换个角度看，困局会显出另一条路。此刻的等待与牺牲有其意义。",
    reversed:
      "你在无谓地拖延，或牺牲已经不再值得。该结束的悬置就结束，回到行动。",
  },
  {
    id: "major-13-death",
    name: "死神",
    arcana: "major",
    image: "/tarot/major-13-death.jpg",
    upright:
      "一个阶段真正结束了，腾出的空间才有新东西进来。允许告别发生，别抓着已经枯竭的部分。",
    reversed:
      "你抗拒结束，让该翻篇的事反复消耗你。慢慢放手也可以，但方向要清楚。",
  },
  {
    id: "major-14-temperance",
    name: "节制",
    arcana: "major",
    image: "/tarot/major-14-temperance.jpg",
    upright:
      "调和、节奏与耐心的艺术，让对立的部分找到共处的方式。适度与持续比猛烈更有效。",
    reversed:
      "失衡与过度，可能在某件事上走极端来填补空洞。回到中间地带，重新配比时间与精力。",
  },
  {
    id: "major-15-devil",
    name: "恶魔",
    arcana: "major",
    image: "/tarot/major-15-devil.jpg",
    upright:
      "欲望、依赖或某种交换关系正绑住你，而锁链往往是自己扣上的。看清代价，才谈得上选择。",
    reversed:
      "你开始意识到束缚并尝试挣脱，过程会有反复。承认诱惑的存在，比假装没有更有用。",
  },
  {
    id: "major-16-tower",
    name: "塔",
    arcana: "major",
    image: "/tarot/major-16-tower.jpg",
    upright:
      "突如其来的崩塌拆掉了不牢靠的结构，痛苦但必要。别急着重建，先看清什么本就不该存在。",
    reversed:
      "你在勉强支撑一座早已裂开的塔，或把危机拖成了慢性消耗。主动拆除比等着倒塌好。",
  },
  {
    id: "major-17-star",
    name: "星星",
    arcana: "major",
    image: "/tarot/major-17-star.jpg",
    upright:
      "风暴之后重新看见希望，疗愈与信任正在缓慢恢复。保持朴素的信念，愿望会找到落地的路径。",
    reversed:
      "期待落空让你不敢再相信，或希望被悬在半空。允许失望存在，再找一个够得着的小目标。",
  },
  {
    id: "major-18-moon",
    name: "月亮",
    arcana: "major",
    image: "/tarot/major-18-moon.jpg",
    upright:
      "情绪、潜意识与不确定感笼罩当下，看到的不一定是全貌。别在雾里做重大决定，先辨认恐惧的来源。",
    reversed:
      "迷雾开始散去，被压抑的情绪浮出水面。真相未必舒服，但它能让你停止自我欺骗。",
  },
  {
    id: "major-19-sun",
    name: "太阳",
    arcana: "major",
    image: "/tarot/major-19-sun.jpg",
    upright:
      "明朗、活力与被看见的喜悦，事情朝好的方向摊开。大方地享受成果，也把光分给身边的人。",
    reversed:
      "快乐被过度期待或自我怀疑遮住，光芒暂时打了折扣。别把满足感押在别人的认可上。",
  },
  {
    id: "major-20-judgement",
    name: "审判",
    arcana: "major",
    image: "/tarot/major-20-judgement.jpg",
    upright:
      "一次清算与召唤，过去的事被重新审视后给出结论。听从内心真正的呼唤，做出那个迟来的决定。",
    reversed:
      "你在回避自我审视，或困在旧事的自责里。承认过去，但不必用它定义接下来的路。",
  },
  {
    id: "major-21-world",
    name: "世界",
    arcana: "major",
    image: "/tarot/major-21-world.jpg",
    upright:
      "一个循环完整闭合，成果被确认，你有资格为自己庆祝。带着这份完成感，走向下一个起点。",
    reversed:
      "收尾差一步，或完成之后反而空虚。补上未了的部分，再问自己真正想开启什么。",
  },

  // ───────────── 权杖（火：行动、热情、创造） ─────────────
  {
    id: "wands-01",
    name: "权杖一",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-01.jpg",
    upright: "新的灵感与冲动被点燃，值得立刻迈出第一步。这股热情现在最充沛，别让它在想象里烧完。",
    reversed: "热情起得快也灭得快，或时机尚未成熟。先把火苗护住，再谈扩张。",
  },
  {
    id: "wands-02",
    name: "权杖二",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-02.jpg",
    upright: "站在已有的基础上眺望更远，计划下一步的扩张。手里有底牌，可以从容布局。",
    reversed: "计划停留在纸面，或对未知的恐惧让你不敢出发。先迈一小步，比继续盘算更有用。",
  },
  {
    id: "wands-03",
    name: "权杖三",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-03.jpg",
    upright: "前期投入开始显现回报，视野打开，适合等待与布局。船已在海上，接下来是耐心。",
    reversed: "进展比预期慢，或你把希望寄托在不会来的船。回头检查合作与方向是否还成立。",
  },
  {
    id: "wands-04",
    name: "权杖四",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-04.jpg",
    upright: "阶段性安定与庆祝，家园或团队氛围稳固。该为已经得到的东西好好高兴一下。",
    reversed: "表面的安稳下有不协调，归属感尚未真正建立。别为了维持画面而压下真实感受。",
  },
  {
    id: "wands-05",
    name: "权杖五",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-05.jpg",
    upright: "竞争与摩擦带来磨合，意见冲突中藏着改进的空间。别怕乱，乱里才有新秩序。",
    reversed: "无谓的争执消耗精力，或你在回避必要的正面交锋。分清哪些架值得打。",
  },
  {
    id: "wands-06",
    name: "权杖六",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-06.jpg",
    upright: "努力被看见，胜利与认可来到你这边。大方接受掌声，也承担随之而来的期待。",
    reversed: "荣耀打了折扣，或过度依赖外界的肯定。真正的成就感应来自你自己。",
  },
  {
    id: "wands-07",
    name: "权杖七",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-07.jpg",
    upright: "你站在有利位置守住自己的立场，值得坚持。压力虽大，但你并非没有胜算。",
    reversed: "长期防御让你疲惫，分清哪些阵地真的需要守。放手一处，是为了守住更要紧的。",
  },
  {
    id: "wands-08",
    name: "权杖八",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-08.jpg",
    upright: "事情快速推进，消息与机会接连而至。保持反应速度，别让节奏拖住你。",
    reversed: "节奏被打乱，或信息混乱导致误判。慢半拍，先把事实核对清楚。",
  },
  {
    id: "wands-09",
    name: "权杖九",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-09.jpg",
    upright: "疲惫但仍在坚持，最后的防线需要韧性。你已经扛过很多，再撑一段就能看到结果。",
    reversed: "戒备过度让你难以放松，或已到该放手的时候。警惕是护甲，不是生活方式。",
  },
  {
    id: "wands-10",
    name: "权杖十",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-10.jpg",
    upright: "责任压身，你扛得动但已接近上限。现在最需要的是分派，而不是更用力。",
    reversed: "该卸下的负担还在肩上，学会拒绝也是一种能力。压垮你的往往是不肯说不。",
  },
  {
    id: "wands-page",
    name: "权杖侍从",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-page.jpg",
    upright: "跃跃欲试的新鲜热情，适合尝试与探索。还没到精通，但好奇心正是最好的入场券。",
    reversed: "三分钟热度，或方向不明就开始行动。给热情一个具体的小目标。",
  },
  {
    id: "wands-knight",
    name: "权杖骑士",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-knight.jpg",
    upright: "行动力强、敢于冒险，推进速度快。趁势而上，但记得给冲动留一点余地。",
    reversed: "急躁鲁莽，冲劲用错了地方。踩刹车不是怯懦，是为了走得更远。",
  },
  {
    id: "wands-queen",
    name: "权杖王后",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-queen.jpg",
    upright: "自信、热情与感染力，你能带动周围的人。做自己，就是最好的领导方式。",
    reversed: "自我怀疑或情绪化，热情变成了压力。先照顾好自己的状态，再向外发光。",
  },
  {
    id: "wands-king",
    name: "权杖国王",
    arcana: "minor",
    suit: "wands",
    image: "/tarot/wands-king.jpg",
    upright: "有远见且能落地，领导力与决断力俱佳。敢于拍板，也敢于为结果负责。",
    reversed: "独断专行，或用权威掩盖不愿面对的问题。听一听反对意见，会省下很多弯路。",
  },

  // ───────────── 圣杯（水：情感、关系、直觉） ─────────────
  {
    id: "cups-01",
    name: "圣杯一",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-01.jpg",
    upright: "情感的新开始，爱、灵感或共情之心被打开。允许自己被触动，那是滋养的来源。",
    reversed: "情感被压抑或枯竭，难以接收也难给出。先补满自己的杯子。",
  },
  {
    id: "cups-02",
    name: "圣杯二",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-02.jpg",
    upright: "双向的连接与信任，关系处于对等状态。坦诚交换，比单方面付出更走得远。",
    reversed: "关系失衡或误解累积，需要把话摊开。沉默不会让裂缝自动愈合。",
  },
  {
    id: "cups-03",
    name: "圣杯三",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-03.jpg",
    upright: "与朋友共享的喜悦，社群与庆祝带来滋养。别独自消化，找人一起分享。",
    reversed: "社交变得浮于表面，或小圈子的流言消耗你。热闹不等于被理解。",
  },
  {
    id: "cups-04",
    name: "圣杯四",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-04.jpg",
    upright: "倦怠与不满足，眼前的机会因心不在焉被错过。先问自己到底在等什么。",
    reversed: "从停滞中醒来，开始愿意接受新的可能。伸出手，第四个杯子就在那里。",
  },
  {
    id: "cups-05",
    name: "圣杯五",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-05.jpg",
    upright: "失落与遗憾占据视线，注意力都在失去的部分。悲伤需要时间，但别把身后的两只杯子忘了。",
    reversed: "慢慢从悲伤中回身，看见仍留在手边的资源。复原是缓慢的，别催自己。",
  },
  {
    id: "cups-06",
    name: "圣杯六",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-06.jpg",
    upright: "怀旧与温柔的回忆，旧人或纯真之心带来安慰。过去的温暖可以成为现在的支撑。",
    reversed: "沉溺过去而回避现在，或旧关系已成负担。回忆是用来看的，不是用来住的。",
  },
  {
    id: "cups-07",
    name: "圣杯七",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-07.jpg",
    upright: "选项繁多却真假难辨，幻想多过实际。把愿望具体化，才分得清哪些能落地。",
    reversed: "迷雾散去，你开始分辨哪些愿望值得追。做出选择，哪怕会舍弃一些想象。",
  },
  {
    id: "cups-08",
    name: "圣杯八",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-08.jpg",
    upright: "主动离开已不能满足你的地方，为更深的追寻留出空间。走不是因为不好，而是因为不对。",
    reversed: "明知该走却反复回头，或害怕未知而留下。承认自己在犹豫，也是一种诚实。",
  },
  {
    id: "cups-09",
    name: "圣杯九",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-09.jpg",
    upright: "心愿达成的满足感，享受当下拥有的。这份惬意是你应得的。",
    reversed: "满足流于物质或自我陶醉，真正的空缺仍在。问问自己还想要什么。",
  },
  {
    id: "cups-10",
    name: "圣杯十",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-10.jpg",
    upright: "家庭与关系的和谐圆满，归属感踏实。这份温暖值得用心维护。",
    reversed: "理想化的幸福与真实之间落差，需要修的不是画面而是沟通。真实的家人比完美的图景重要。",
  },
  {
    id: "cups-page",
    name: "圣杯侍从",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-page.jpg",
    upright: "敏感而富有想象力，情感表达带着天真。别小看那句笨拙的真心话。",
    reversed: "逃避现实或情绪不成熟，用幻想替代沟通。把感受说出来，比暗示更有效。",
  },
  {
    id: "cups-knight",
    name: "圣杯骑士",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-knight.jpg",
    upright: "浪漫与诚意推动关系，愿意为所爱付出。带着心意去行动，别人感受得到。",
    reversed: "承诺难以兑现，情感表达流于姿态。比起漂亮的话，更该看持续的行动。",
  },
  {
    id: "cups-queen",
    name: "圣杯王后",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-queen.jpg",
    upright: "共情与包容，你能照顾好自己与别人的情绪。温柔里也要有边界。",
    reversed: "情绪泛滥或过度付出，边界模糊。先分清哪些情绪其实不属于你。",
  },
  {
    id: "cups-king",
    name: "圣杯国王",
    arcana: "minor",
    suit: "cups",
    image: "/tarot/cups-king.jpg",
    upright: "情绪成熟而稳定，能在感受与理性间取得平衡。沉住气，你的从容会影响整个局面。",
    reversed: "压抑或操控情绪，表面平静内里暗涌。情绪需要一个安全的出口。",
  },

  // ───────────── 宝剑（风：思维、言语、冲突） ─────────────
  {
    id: "swords-01",
    name: "宝剑一",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-01.jpg",
    upright: "清晰的洞见与果断的决定，真相让你如释重负。把想法说清楚，问题就解决了一半。",
    reversed: "思维混乱或被偏见带偏，话说得比想得快。先理清事实，再下判断。",
  },
  {
    id: "swords-02",
    name: "宝剑二",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-02.jpg",
    upright: "暂时回避选择，用平衡维持局面。有些决定需要更多信息，等一等也合理。",
    reversed: "逃避已不可持续，你必须面对那个决定。摘下蒙眼布，答案没你想的那么可怕。",
  },
  {
    id: "swords-03",
    name: "宝剑三",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-03.jpg",
    upright: "心痛与分离的真相摆在眼前，允许自己感受它。痛过之后，判断会重新清晰。",
    reversed: "伤口开始愈合，或你正用忙碌掩盖未处理的痛。慢一点，别跳过该有的难过。",
  },
  {
    id: "swords-04",
    name: "宝剑四",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-04.jpg",
    upright: "主动的休息与修复，暂停是为了恢复判断力。现在最该做的是什么都不做。",
    reversed: "休息不足或强撑，身心都在发出警告。再撑下去，代价会比停下来更高。",
  },
  {
    id: "swords-05",
    name: "宝剑五",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-05.jpg",
    upright: "赢了争论却输了关系，代价值得掂量。想清楚你要的是对，还是要这段关系。",
    reversed: "冲突的余波仍在，或你准备放下争胜的心。和解需要有人先松手。",
  },
  {
    id: "swords-06",
    name: "宝剑六",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-06.jpg",
    upright: "离开混乱、驶向平稳的过渡期，带着伤但方向明确。往前走，情绪会慢慢跟上。",
    reversed: "旧问题随你一起上了船，或拖延着不肯离开。换地方不一定能换掉模式。",
  },
  {
    id: "swords-07",
    name: "宝剑七",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-07.jpg",
    upright: "策略与迂回，或有人不愿光明正大地面对问题。聪明要用在正地方。",
    reversed: "隐瞒难以维持，该说的实话终将出口。早点摊开，比被戳破好。",
  },
  {
    id: "swords-08",
    name: "宝剑八",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-08.jpg",
    upright: "被自我设限困住，绳索比看上去松。限制多半来自「我不行」这个念头。",
    reversed: "你开始意识到出口一直存在，试着迈出一步。自由需要一点勇气去验证。",
  },
  {
    id: "swords-09",
    name: "宝剑九",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-09.jpg",
    upright: "焦虑与失眠，担忧在夜里被放大。把害怕的事写下来，它通常没那么大。",
    reversed: "恐惧开始缓解，或你终于愿意求助。说出来，比独自熬着有效。",
  },
  {
    id: "swords-10",
    name: "宝剑十",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-10.jpg",
    upright: "一个局面彻底走到尽头，痛苦也意味着不再继续。天亮了，这次是真的结束。",
    reversed: "最坏的时刻过去，正在缓慢复原。别急着证明自己没事，慢慢来。",
  },
  {
    id: "swords-page",
    name: "宝剑侍从",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-page.jpg",
    upright: "好奇心与敏锐的观察力，适合学习与求证。多问一句，能省掉很多误会。",
    reversed: "言语轻率或搬弄是非，信息未经核实。管住嘴，也管住转发的手。",
  },
  {
    id: "swords-knight",
    name: "宝剑骑士",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-knight.jpg",
    upright: "雷厉风行，观点鲜明且敢于直言。速度是你的优势，方向要对。",
    reversed: "急躁好辩，冲撞了不该冲撞的人。直率不等于可以不顾后果。",
  },
  {
    id: "swords-queen",
    name: "宝剑王后",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-queen.jpg",
    upright: "理性、独立且洞察力强，能切中要害。诚实是善意的一种形式。",
    reversed: "言语过于锋利，或冷静变成了冷漠。真话也可以说得有人味。",
  },
  {
    id: "swords-king",
    name: "宝剑国王",
    arcana: "minor",
    suit: "swords",
    image: "/tarot/swords-king.jpg",
    upright: "以原则与逻辑掌舵，判断公正而清晰。就事论事，你会赢得信任。",
    reversed: "权威被滥用，或以理服人变成了压制。别把正确当成唯一的武器。",
  },

  // ───────────── 星币（土：物质、工作、身体） ─────────────
  {
    id: "pentacles-01",
    name: "星币一",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-01.jpg",
    upright: "踏实的开端，一个可落地的机会或收入来源出现。把它种下去，别只在心里想。",
    reversed: "机会尚未成形，或投入没有换来应有回报。检查地基，而不是加码。",
  },
  {
    id: "pentacles-02",
    name: "星币二",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-02.jpg",
    upright: "在多件事之间保持弹性与平衡，节奏感很重要。灵活比死守计划更管用。",
    reversed: "事务失衡，顾此失彼让你手忙脚乱。该砍掉的先砍掉。",
  },
  {
    id: "pentacles-03",
    name: "星币三",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-03.jpg",
    upright: "协作与专业被认可，分工明确的团队能做出好东西。把你的手艺亮出来。",
    reversed: "配合不畅或标准不齐，需要重新对齐。先把话讲明白，再谈进度。",
  },
  {
    id: "pentacles-04",
    name: "星币四",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-04.jpg",
    upright: "守住已有资源，谨慎对待金钱与安全感。稳一点没错，但别把门关死。",
    reversed: "过度紧握反而僵化，或该松手的地方松不开。安全感不全是钱给的。",
  },
  {
    id: "pentacles-05",
    name: "星币五",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-05.jpg",
    upright: "匮乏感与被排除在外的处境，别独自硬撑。门是开着的，只是你没抬头看。",
    reversed: "困境开始好转，愿意接受帮助是关键。求助不是失败。",
  },
  {
    id: "pentacles-06",
    name: "星币六",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-06.jpg",
    upright: "给予与接受的流动，资源分配相对公平。付出时留意，别把善意变成控制。",
    reversed: "施与受失衡，或帮助带着条件。看清这段关系的真实交换。",
  },
  {
    id: "pentacles-07",
    name: "星币七",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-07.jpg",
    upright: "耐心等待收成，评估投入是否值得继续。成长有滞后期，别提前拔苗。",
    reversed: "回报不如预期，或急于求成而拔苗助长。该调整方法，不是加倍硬撑。",
  },
  {
    id: "pentacles-08",
    name: "星币八",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-08.jpg",
    upright: "专注打磨技艺，重复的练习正在积累真实的实力。把一件小事做到熟。",
    reversed: "敷衍应付或陷入机械劳动，失去了精进的动力。问问自己还想不想做好。",
  },
  {
    id: "pentacles-09",
    name: "星币九",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-09.jpg",
    upright: "独立与自足的成果，享受自己挣来的一切。你有资格过得舒服。",
    reversed: "依赖外在的体面，或努力没有带来应有的自在。富足感先从心里来。",
  },
  {
    id: "pentacles-10",
    name: "星币十",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-10.jpg",
    upright: "长期的稳定与家族式的丰足，根基牢固。把眼光放到比这一代人更远的地方。",
    reversed: "物质背后有家庭或结构的隐忧，表面的富足不牢。先处理关系的裂痕。",
  },
  {
    id: "pentacles-page",
    name: "星币侍从",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-page.jpg",
    upright: "务实的学习态度，为长远目标打基础。慢一点没关系，方向对就行。",
    reversed: "计划多而行动少，学习流于形式。先做完一件小事。",
  },
  {
    id: "pentacles-knight",
    name: "星币骑士",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-knight.jpg",
    upright: "稳扎稳打，可靠地把事情推进到底。可靠本身就是稀缺品质。",
    reversed: "过于保守或陷入惯性，进展慢到近乎停滞。偶尔需要一点冒险。",
  },
  {
    id: "pentacles-queen",
    name: "星币王后",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-queen.jpg",
    upright: "务实而温暖，把生活照料得井井有条。照顾好日常，就是最扎实的修行。",
    reversed: "过度操劳或把价值感绑在付出上。你也需要被照顾。",
  },
  {
    id: "pentacles-king",
    name: "星币国王",
    arcana: "minor",
    suit: "pentacles",
    image: "/tarot/pentacles-king.jpg",
    upright: "成熟的资源管理能力，稳健且值得信赖。长期主义会让你赢在最后。",
    reversed: "固执于掌控，或以物质衡量一切。别让成果反过来定义你。",
  },
];
