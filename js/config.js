/* ==========================================================
   水果吃货 - 游戏配置
   画布尺寸 + 5大主题 + 50关 + 水果/炸弹/道具/人物定义
   ========================================================== */

// ---- 画布尺寸（由 game.js 的 resizeCanvas 动态设置） ----
let W = window.innerWidth - 32, H = window.innerHeight - 32;
let CX = W / 2, CY = H / 2;

// ==================== 五大主题定义 ====================

const THEMES = [
  // ---- 主题一：核果园（第1-10关）----
  {
    id: 'stone_fruit',
    name: '核果园',
    emoji: '🍑',
    startLevel: 0,
    endLevel: 9,
    story: '在核果大陆的中心，有一座传说中的果园——核果园。每一颗核果都蕴含着大地的记忆与力量。苹果小丑从老果树爷爷那里得知：只有集齐所有核果的祝福，才能获得前往水果圣殿的资格。为了寻找失散的父母，苹果小丑踏上了这片神秘的土地...',
    player: {
      name: '苹果小丑',
      desc: '红扑扑的苹果脑袋，头戴彩色小丑帽，性格活泼可爱。传说他是落入凡间的快乐果精灵。',
      bodyColor1: '#ff6b6b', bodyColor2: '#cc3333',
      headColor1: '#ffcccc', headColor2: '#ff8888',
      accentColor: '#ffd700',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'clown_hat',
    },
    bg: {
      colors: ['#2d1b3d', '#1a0a2e', '#3d2060'],
      accentHue: 320,
      particles: 'petal',
      ringColor: 'rgba(255,180,200,0.04)',
    },
    fruits: [
      { name: '李子',   emoji: '💜', weight: 0.4, score: 10, radius: 14, speedMult: 2.8 },
      { name: '西梅',   emoji: '🟣', weight: 0.5, score: 11, radius: 15, speedMult: 2.6 },
      { name: '杏',     emoji: '🟠', weight: 0.6, score: 12, radius: 16, speedMult: 2.4 },
      { name: '水蜜桃', emoji: '🍑', weight: 1.0, score: 14, radius: 22, speedMult: 1.8 },
      { name: '油桃',   emoji: '🔴', weight: 0.9, score: 15, radius: 19, speedMult: 2.1 },
      { name: '蟠桃',   emoji: '🌸', weight: 0.8, score: 16, radius: 20, speedMult: 2.0 },
      { name: '黄桃',   emoji: '🍯', weight: 0.7, score: 18, radius: 21, speedMult: 2.2 },
      { name: '乌梅',   emoji: '🖤', weight: 0.3, score: 20, radius: 13, speedMult: 3.0 },
    ],
    soundStyle: 'sweet',
    bgmStyle: 'pastoral',
  },

  // ---- 主题二：柑橘岛（第11-20关）----
  {
    id: 'citrus',
    name: '柑橘岛',
    emoji: '🍊',
    startLevel: 10,
    endLevel: 19,
    story: '穿越无尽汪洋，苹果小丑来到了传说中的柑橘岛。这里是所有柑橘类水果的诞生地，据说岛上的"黄金柑橘"蕴含着太阳的力量。但通往黄金果园的道路布满了重重障碍——只有真正勇敢的探险者才能摘取那最耀眼的果实...',
    player: {
      name: '苹果小丑',
      desc: '海风吹拂下，苹果小丑戴上了宽边草帽，眼神中闪烁着对未知的渴望。海洋的旅程让他变得更加坚强。',
      bodyColor1: '#ff6b6b', bodyColor2: '#cc3333',
      headColor1: '#ffccaa', headColor2: '#ff9966',
      accentColor: '#3388cc',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'clown_hat',
    },
    bg: {
      colors: ['#0a2a4a', '#061a30', '#1a3a5a'],
      accentHue: 35,
      particles: 'sparkle',
      ringColor: 'rgba(255,200,100,0.04)',
    },
    fruits: [
      { name: '柚子', emoji: '🍈', weight: 2.0, score: 12, radius: 30, speedMult: 0.8 },
      { name: '橙子', emoji: '🍊', weight: 1.2, score: 15, radius: 24, speedMult: 1.5 },
      { name: '橘子', emoji: '🍊', weight: 1.0, score: 18, radius: 22, speedMult: 1.7 },
      { name: '小番茄', emoji: '🍅', weight: 0.8, score: 20, radius: 18, speedMult: 1.9 },
      { name: '柠檬', emoji: '🍋', weight: 0.6, score: 22, radius: 18, speedMult: 2.3 },
      { name: '金桔', emoji: '🫒', weight: 0.3, score: 25, radius: 12, speedMult: 3.0 },
      { name: '血橙', emoji: '🔴', weight: 0.5, score: 28, radius: 18, speedMult: 2.4 },
      { name: '西柚', emoji: '🍊', weight: 0.4, score: 30, radius: 20, speedMult: 2.6 },
    ],
    soundStyle: 'fresh',
    bgmStyle: 'ocean',
    mechanic: '海风系统',
    mechanicDesc: '🌊 海风来袭！四向风力（东南西北）随机吹袭水果轨迹，强度分三级：微风/中风/强风。观察右上角风向指示，预判走位精准捕获！',
  },

  // ---- 主题三：浆果谷（第21-30关）----
  {
    id: 'berry',
    name: '浆果谷',
    emoji: '🍇',
    startLevel: 20,
    endLevel: 29,
    story: '传说在遥远的北方，有一片被薄雾笼罩的神秘山谷——浆果谷。这里住着掌管时间的精灵一族，他们培育的浆果蕴含着神奇的力量。蓝莓能让人看清未来的道路，草莓能治愈一切伤痛。精灵女王告诉苹果小丑：要获得前往最终圣地的资格，必须先通过浆果谷的考验...',
    player: {
      name: '苹果小丑',
      desc: '背生晶莹羽翼，眼神中闪烁着智慧的光芒。在精灵的祝福下，苹果小丑获得了窥探时间的能力。',
      bodyColor1: '#ff6b6b', bodyColor2: '#cc3333',
      headColor1: '#dd88cc', headColor2: '#aa55aa',
      accentColor: '#60d0ff',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'clown_hat',
    },
    bg: {
      colors: ['#1a0a30', '#0a0520', '#2a1040'],
      accentHue: 270,
      particles: 'firefly',
      ringColor: 'rgba(150,100,255,0.04)',
    },
    fruits: [
      { name: '葡萄',   emoji: '🍇', weight: 0.8, score: 15, radius: 18, speedMult: 2.0 },
      { name: '猕猴桃', emoji: '🥝', weight: 1.0, score: 18, radius: 20, speedMult: 1.8 },
      { name: '草莓',   emoji: '🍓', weight: 0.6, score: 22, radius: 17, speedMult: 2.3 },
      { name: '树莓',   emoji: '🍓', weight: 0.4, score: 26, radius: 14, speedMult: 2.6 },
      { name: '桑葚',   emoji: '🍇', weight: 0.3, score: 28, radius: 12, speedMult: 3.0 },
      { name: '蓝莓',   emoji: '🥝', weight: 0.2, score: 30, radius: 11, speedMult: 3.2 },
      { name: '黑莓',   emoji: '🍇', weight: 0.25, score: 32, radius: 12, speedMult: 3.0 },
      { name: '蔓越莓', emoji: '🍓', weight: 0.35, score: 35, radius: 13, speedMult: 2.8 },
    ],
    soundStyle: 'magic',
    bgmStyle: 'mystic',
    mechanic: '传送门系统',
    mechanicDesc: '🌀 传送门开启！水果进入一扇门会从另一扇门飞出，预判传送轨迹，精准捕获！',
  },

  // ---- 主题四：冰霜王国（第31-40关）----
  {
    id: 'frozen',
    name: '冰霜王国',
    emoji: '🧊',
    startLevel: 30,
    endLevel: 39,
    story: '穿越浆果谷的时空结界，苹果小丑来到了永恒冰封的领域——冰霜王国。这里的一切都被晶莹的冰霜覆盖，时间仿佛凝固。冰霜女王守护着传说中的"时光之果"，据说吃下它便能看见未来的轨迹。但王国的试炼并非易事——只有能在冰封世界中保持清醒的人，才能获得女王的认可...',
    player: {
      name: '苹果小丑',
      desc: '身披冰晶披风，散发着淡淡的寒气。在冰雪的洗礼中，苹果小丑学会了冷静与精准，眼神如冰湖般清澈。',
      bodyColor1: '#ff6b6b', bodyColor2: '#cc3333',
      headColor1: '#aaddff', headColor2: '#66aacc',
      accentColor: '#80e0ff',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'clown_hat',
    },
    bg: {
      colors: ['#0a1828', '#05101a', '#142840'],
      accentHue: 200,
      particles: 'snowflake',
      ringColor: 'rgba(150,220,255,0.06)',
    },
    fruits: [
      { name: '雪梨',   emoji: '🍐', weight: 1.5, score: 14, radius: 26, speedMult: 1.2 },
      { name: '冻莓',   emoji: '🫐', weight: 0.6, score: 18, radius: 16, speedMult: 2.2 },
      { name: '冰橘',   emoji: '🍊', weight: 0.9, score: 20, radius: 20, speedMult: 1.7 },
      { name: '冰糖葫芦', emoji: '🔴', weight: 0.5, score: 24, radius: 14, speedMult: 2.6 },
      { name: '霜柿',   emoji: '🟠', weight: 0.8, score: 26, radius: 20, speedMult: 2.0 },
      { name: '寒莓',   emoji: '🫒', weight: 0.3, score: 28, radius: 12, speedMult: 3.0 },
      { name: '冰西瓜', emoji: '🍉', weight: 2.0, score: 30, radius: 32, speedMult: 0.85 },
      { name: '水晶果', emoji: '💎', weight: 0.35, score: 34, radius: 17, speedMult: 2.7 },
    ],
    soundStyle: 'icy',
    bgmStyle: 'frozen',
    mechanic: '多冰晶分身冻结系统',
    mechanicDesc: '❄️ 冰晶分身：每关生成3-6个固定位置的冰霜分身，冻结范围内水果3秒停顿+翻倍分数！解冻后按原速度继续移动，不可再被冰冻！',
  },

  // ---- 主题五：狂野西部（第41-50关）----
  {
    id: 'wild_west',
    name: '狂野西部',
    emoji: '🎯',
    startLevel: 40,
    endLevel: 49,
    story: '翻越沙漠山丘，苹果小丑来到了传说中的荒野之地——狂野西部。这里处处是机遇与挑战，最厉害的射手才能摘得"黄金仙人掌果"。神秘的老猎人指着靶心说：瞄准那里，分数就是你的！苹果小丑握紧靶圈，眯起眼睛——最后的传说，从这一刻开始...',
    player: {
      name: '苹果小丑',
      desc: '戴着宽边牛仔帽，披着皮质马甲，腰间挂着靶圈道具。在荒野的磨砺下，苹果小丑练就了一双精准的鹰眼。',
      bodyColor1: '#ff6b6b', bodyColor2: '#cc3333',
      headColor1: '#ffcc88', headColor2: '#cc9966',
      accentColor: '#ffd700',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'clown_hat',
    },
    bg: {
      colors: ['#2a1a05', '#1a1005', '#3a2810'],
      accentHue: 35,
      particles: 'spark',
      ringColor: 'rgba(255,180,50,0.04)',
    },
    fruits: [
      { name: '苹果',     emoji: '🍎', weight: 1.0, score: 20, radius: 22, speedMult: 1.6 },
      { name: '梨',       emoji: '🍐', weight: 1.2, score: 18, radius: 23, speedMult: 1.3 },
      { name: '山楂',     emoji: '🔴', weight: 0.2, score: 35, radius: 12, speedMult: 3.2 },
      { name: '橙子',     emoji: '🍊', weight: 0.9, score: 22, radius: 21, speedMult: 1.7 },
      { name: '枇杷',     emoji: '🟠', weight: 0.4, score: 28, radius: 16, speedMult: 2.5 },
      { name: '西瓜',     emoji: '🍉', weight: 2.0, score: 14, radius: 32, speedMult: 0.8 },
      { name: '仙人掌果', emoji: '💚', weight: 0.3, score: 40, radius: 15, speedMult: 2.8 },
      { name: '金苹果',   emoji: '🌟', weight: 0.25, score: 50, radius: 14, speedMult: 3.0 },
    ],
    soundStyle: 'western',
    bgmStyle: 'western',
    mechanic: '移动靶心系统',
    mechanicDesc: '🎯 移动靶心：随鼠标/触摸移动的靶圈⭕，靶圈内吃水果额外+50%分！命中中心红点触发暴击🎯×3！靶心有能量条，消耗完后缩小恢复。',
  },
];

// ==================== 50关配置 ====================

const LEVELS = [
  // ---- 核果园（1-10关）----
  { name: '桃源初见', target: 70,  baseSpeed: 104, spawnInterval: 1800, bombChance: 0.060 },
  { name: '花瓣飘落', target: 85,  baseSpeed: 108, spawnInterval: 1780, bombChance: 0.070 },
  { name: '果园漫步', target: 100, baseSpeed: 112, spawnInterval: 1760, bombChance: 0.080 },
  { name: '枝头硕果', target: 115, baseSpeed: 116, spawnInterval: 1740, bombChance: 0.090 },
  { name: '蜜桃丰收', target: 130, baseSpeed: 120, spawnInterval: 1720, bombChance: 0.100 },
  { name: '核果小径', target: 145, baseSpeed: 124, spawnInterval: 1700, bombChance: 0.110 },
  { name: '油桃山坡', target: 160, baseSpeed: 128, spawnInterval: 1680, bombChance: 0.120 },
  { name: '乌梅树下', target: 175, baseSpeed: 132, spawnInterval: 1660, bombChance: 0.130 },
  { name: '落日果园', target: 190, baseSpeed: 136, spawnInterval: 1640, bombChance: 0.140 },
  { name: '核果之王', target: 210, baseSpeed: 140, spawnInterval: 1620, bombChance: 0.150 },

  // ---- 柑橘岛（11-20关）----
  { name: '岸边初探', target: 210, baseSpeed: 144, spawnInterval: 1580, bombChance: 0.090, windStrength: 1 },
  { name: '柑橘港口', target: 230, baseSpeed: 148, spawnInterval: 1550, bombChance: 0.095, windStrength: 1 },
  { name: '柠檬小径', target: 250, baseSpeed: 152, spawnInterval: 1520, bombChance: 0.100, windStrength: 1 },
  { name: '金色果园', target: 270, baseSpeed: 156, spawnInterval: 1490, bombChance: 0.105, windStrength: 1 },
  { name: '海上风暴', target: 290, baseSpeed: 160, spawnInterval: 1460, bombChance: 0.110, windStrength: 2 },
  { name: '沃柑丘陵', target: 310, baseSpeed: 164, spawnInterval: 1430, bombChance: 0.115, windStrength: 2 },
  { name: '芦柑山谷', target: 330, baseSpeed: 168, spawnInterval: 1400, bombChance: 0.120, windStrength: 2 },
  { name: '柚子海滩', target: 350, baseSpeed: 172, spawnInterval: 1370, bombChance: 0.125, windStrength: 3 },
  { name: '暮色港口', target: 370, baseSpeed: 176, spawnInterval: 1340, bombChance: 0.128, windStrength: 3 },
  { name: '柑橘之王', target: 385, baseSpeed: 180, spawnInterval: 1310, bombChance: 0.130, windStrength: 3 },

  // ---- 浆果谷（21-30关）----
  { name: '谷口迷雾', target: 400, baseSpeed: 184, spawnInterval: 1280, bombChance: 0.130, portalStrength: 1 },
  { name: '草莓花田', target: 420, baseSpeed: 188, spawnInterval: 1250, bombChance: 0.135, portalStrength: 1 },
  { name: '蓝莓灌木', target: 440, baseSpeed: 192, spawnInterval: 1220, bombChance: 0.140, portalStrength: 2 },
  { name: '桑葚小径', target: 460, baseSpeed: 196, spawnInterval: 1190, bombChance: 0.145, portalStrength: 2 },
  { name: '精灵树屋', target: 480, baseSpeed: 200, spawnInterval: 1160, bombChance: 0.150, portalStrength: 2 },
  { name: '猕猴桃溪', target: 500, baseSpeed: 204, spawnInterval: 1130, bombChance: 0.155, portalStrength: 2 },
  { name: '树莓密林', target: 520, baseSpeed: 208, spawnInterval: 1100, bombChance: 0.160, portalStrength: 3 },
  { name: '葡萄藤架', target: 540, baseSpeed: 212, spawnInterval: 1070, bombChance: 0.165, portalStrength: 3 },
  { name: '圣女果园', target: 560, baseSpeed: 216, spawnInterval: 1040, bombChance: 0.168, portalStrength: 3 },
  { name: '浆果之王', target: 580, baseSpeed: 220, spawnInterval: 1010, bombChance: 0.170, portalStrength: 3 },

  // ---- 冰霜王国（31-40关）----
  // freezeStrength = 分身数量（3-6个，固定位置，不移动）
  // 每个分身冻结范围70px半径，冻结时间3秒，解冻后不可再冻
  { name: '冰原边缘', target: 600, baseSpeed: 224, spawnInterval: 990,  bombChance: 0.130, freezeStrength: 3 },
  { name: '雪梨山谷', target: 620, baseSpeed: 228, spawnInterval: 970,  bombChance: 0.135, freezeStrength: 3 },
  { name: '冻莓湖畔', target: 645, baseSpeed: 232, spawnInterval: 950,  bombChance: 0.140, freezeStrength: 3 },
  { name: '冰糖森林', target: 670, baseSpeed: 236, spawnInterval: 930,  bombChance: 0.145, freezeStrength: 4 },
  { name: '冰晶洞穴', target: 695, baseSpeed: 240, spawnInterval: 910,  bombChance: 0.150, freezeStrength: 4 },
  { name: '霜柿庄园', target: 720, baseSpeed: 244, spawnInterval: 890,  bombChance: 0.155, freezeStrength: 4 },
  { name: '寒莓深渊', target: 745, baseSpeed: 248, spawnInterval: 870,  bombChance: 0.160, freezeStrength: 5 },
  { name: '冰西瓜平原', target: 770, baseSpeed: 252, spawnInterval: 850,  bombChance: 0.165, freezeStrength: 5 },
  { name: '水晶宫殿', target: 800, baseSpeed: 256, spawnInterval: 830,  bombChance: 0.168, freezeStrength: 6 },
  { name: '冰霜之王', target: 830, baseSpeed: 260, spawnInterval: 810,  bombChance: 0.170, freezeStrength: 6 },

  // ---- 狂野西部（41-50关）----
  // targetStrength = 靶心等级（1=基础靶心 2=双环靶心 3=三环靶心）
  // 靶心半径随等级扩大，暴击区随等级缩小（挑战性增加）
  { name: '荒野初入', target: 860, baseSpeed: 264, spawnInterval: 790, bombChance: 0.120, targetStrength: 1 },
  { name: '沙漠市集', target: 880, baseSpeed: 268, spawnInterval: 775, bombChance: 0.125, targetStrength: 1 },
  { name: '仙人掌林', target: 900, baseSpeed: 272, spawnInterval: 760, bombChance: 0.130, targetStrength: 1 },
  { name: '牛仔对决', target: 920, baseSpeed: 276, spawnInterval: 745, bombChance: 0.135, targetStrength: 2 },
  { name: '黄金矿山', target: 940, baseSpeed: 280, spawnInterval: 730, bombChance: 0.140, targetStrength: 2 },
  { name: '峡谷营地', target: 960, baseSpeed: 284, spawnInterval: 715, bombChance: 0.145, targetStrength: 2 },
  { name: '荒野猎人', target: 980, baseSpeed: 288, spawnInterval: 700, bombChance: 0.150, targetStrength: 3 },
  { name: '沙尘风暴', target: 1000, baseSpeed: 292, spawnInterval: 685, bombChance: 0.155, targetStrength: 3 },
  { name: '决战夕阳', target: 1030, baseSpeed: 296, spawnInterval: 670, bombChance: 0.160, targetStrength: 3 },
  { name: '西部传奇', target: 1060, baseSpeed: 300, spawnInterval: 655, bombChance: 0.165, targetStrength: 3 },
];

const ROUND_TIME = 45;

// ---- 炸弹 ----
const BOMB = { name: '炸弹', emoji: '💣', score: -15, radius: 24, speedMult: 1.8 };

// ---- 道具定义 ----
const ITEMS = [
  { id: 'magnet',    name: '磁铁',     icon: '🧲', color: '#3b82f6', desc: '大范围强吸附水果6秒',     duration: 6000 },
  { id: 'slow',      name: '时间减缓', icon: '⏱️', color: '#f59e0b', desc: '全场速度降低50%持续5秒',  duration: 5000 },
  { id: 'shield',    name: '护盾',     icon: '🛡️', color: '#10b981', desc: '免疫下一次炸弹伤害',      duration: 0 },
  { id: 'double',    name: '双倍得分', icon: '✖️2', color: '#ef4444', desc: '得分翻倍持续8秒',         duration: 8000 },
  { id: 'addtime',   name: '增加计时', icon: '⏰', color: '#a78bfa', desc: '增加5秒倒计时',           duration: 0 },
  { id: 'slow',      name: '减速',     icon: '🐌', color: '#a78bfa', desc: '所有水果速度减半，持续5秒', duration: 5000 },
];

// ---- 道具掉落参数 ----
const ITEM_SPAWN_INTERVAL = 8000;  // 道具刷新间隔（毫秒）
const ITEM_SPAWN_INTERVAL_EARLY = 6000; // 前10关道具刷新间隔（更频繁）
const ITEM_DROP_CHANCE = 0.55;     // 道具掉落概率
const ITEM_DROP_CHANCE_EARLY = 0.65; // 前10关道具掉落概率（更高）
const ITEM_MAX_ON_FIELD = 3;       // 场上最多道具数
const ITEM_MAX_BAG = 3;            // 背包最多道具数

// ---- 角色默认参数 ----
const PLAYER = {
  x: CX, y: CY,
  bodyR: 28, headR: 20,
  headAngle: 0, headDist: 38,
};

// ==================== 主题工具函数 ====================

/** 获取当前主题 */
function getCurrentTheme() {
  return THEMES.find(t => level >= t.startLevel && level <= t.endLevel) || THEMES[0];
}

/** 获取当前主题索引（0-4） */
function getThemeIndex() {
  return Math.floor(level / 10);
}

/** 获取当前关卡在主题内的索引（0-9） */
function getLevelInTheme() {
  return level % 10;
}

/** 获取当前关卡的水果池（渐进式：前两关4个，后面每关+1） */
function getCurrentFruitPool() {
  const theme = getCurrentTheme();
  const levelInTheme = getLevelInTheme();

  // 每个主题前两关4个，后面每关增加1个，最多8个
  let count = 4;
  if (levelInTheme >= 2) {
    count = Math.min(4 + (levelInTheme - 2), theme.fruits.length);
  }

  return theme.fruits.slice(0, count);
}

/** 获取当前关卡的水果数量 */
function getFruitCount() {
  const theme = getCurrentTheme();
  const levelInTheme = getLevelInTheme();
  let count = 4;
  if (levelInTheme >= 2) {
    count = Math.min(4 + (levelInTheme - 2), theme.fruits.length);
  }
  return count;
}

/** 获取当前可用的道具池（前10关按关卡渐进解锁，后40关全6个） */
function getCurrentItemPool() {
  if (level < 10) {
    // 第1关0个，第2关起每关+1个，1→6渐进展示
    const itemCount = Math.max(0, level);
    return ITEMS.slice(0, itemCount);
  }
  return ITEMS; // 第11关起全6个道具
}

/** 获取当前可用的道具数量 */
function getItemCount() {
  if (level < 10) {
    return Math.max(0, level);
  }
  return ITEMS.length;
}

/** 判断是否进入新主题（主题关第一关） */
function isThemeStart(lvl) {
  return THEMES.some(t => t.startLevel === lvl);
}
