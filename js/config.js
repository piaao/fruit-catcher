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
    story: '在核果大陆的中心，有一座传说中的果园——核果园。每一颗核果都蕴含着大地的记忆与力量。桃太郎从老桃树爷爷那里得知：只有集齐所有核果的祝福，才能获得前往水果圣殿的资格。为了寻找失散的父母，桃太郎踏上了这片神秘的土地...',
    player: {
      name: '桃太郎',
      desc: '圆润可爱的粉色小家伙，头戴嫩绿叶帽，性格温和勇敢。传说他是神桃子落入凡间化成的精灵。',
      bodyColor1: '#ffb6c1', bodyColor2: '#e06088',
      headColor1: '#ffe066', headColor2: '#e07000',
      accentColor: '#88cc44',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'leaf',
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
    story: '穿越无尽汪洋，桃太郎来到了传说中的柑橘岛。这里是所有柑橘类水果的诞生地，据说岛上的"黄金柑橘"蕴含着太阳的力量。但通往黄金果园的道路布满了重重障碍——只有真正勇敢的探险者才能摘取那最耀眼的果实...',
    player: {
      name: '桃太郎',
      desc: '海风吹拂下，桃太郎戴上了宽边草帽，眼神中闪烁着对未知的渴望。海洋的旅程让他变得更加坚强。',
      bodyColor1: '#ffa040', bodyColor2: '#cc6020',
      headColor1: '#ffcc33', headColor2: '#e08800',
      accentColor: '#3388cc',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'hat',
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
  },

  // ---- 主题三：浆果谷（第21-30关）----
  {
    id: 'berry',
    name: '浆果谷',
    emoji: '🍇',
    startLevel: 20,
    endLevel: 29,
    story: '传说在遥远的北方，有一片被薄雾笼罩的神秘山谷——浆果谷。这里住着掌管时间的精灵一族，他们培育的浆果蕴含着神奇的力量。蓝莓能让人看清未来的道路，草莓能治愈一切伤痛。精灵女王告诉桃太郎：要获得前往最终圣地的资格，必须先通过浆果谷的考验...',
    player: {
      name: '桃太郎',
      desc: '背生晶莹羽翼，眼神中闪烁着智慧的光芒。在精灵的祝福下，桃太郎获得了窥探时间的能力。',
      bodyColor1: '#9070d0', bodyColor2: '#5040a0',
      headColor1: '#8060e0', headColor2: '#4030a0',
      accentColor: '#60d0ff',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'wings',
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
  },

  // ---- 主题四：热带雨林（第31-40关）----
  {
    id: 'tropical',
    name: '热带雨林',
    emoji: '🥭',
    startLevel: 30,
    endLevel: 39,
    story: '穿过精灵的结界，桃太郎来到了一片古老而神秘的雨林——热带雨林。这里是水果大陆上最古老的地方，隐藏着失落已久的上古果园。传说这里的水果拥有掌控时间的力量，而雨林深处的"永恒之树"据说连接着过去与未来...',
    player: {
      name: '桃太郎',
      desc: '身着藤蔓编织的披风，手持古老探险杖，头上戴着用王莲叶做的王冠。在雨林的考验中，桃太郎逐渐显露王者气质。',
      bodyColor1: '#d08040', bodyColor2: '#8a5020',
      headColor1: '#c8a020', headColor2: '#8a6a10',
      accentColor: '#40c040',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'crown',
    },
    bg: {
      colors: ['#0a2a10', '#051a08', '#1a3a1a'],
      accentHue: 120,
      particles: 'leaf',
      ringColor: 'rgba(100,255,100,0.04)',
    },
    fruits: [
      { name: '椰子',   emoji: '🥥', weight: 2.5, score: 12, radius: 30, speedMult: 0.7 },
      { name: '菠萝',   emoji: '🍍', weight: 1.8, score: 15, radius: 28, speedMult: 0.9 },
      { name: '香蕉',   emoji: '🍌', weight: 1.3, score: 18, radius: 24, speedMult: 1.4 },
      { name: '芒果',   emoji: '🥭', weight: 0.8, score: 22, radius: 20, speedMult: 2.0 },
      { name: '荔枝',   emoji: '🔴', weight: 0.3, score: 26, radius: 14, speedMult: 2.8 },
      { name: '龙眼',   emoji: '⚪', weight: 0.25, score: 28, radius: 13, speedMult: 3.0 },
      { name: '火龙果', emoji: '🩷', weight: 0.5, score: 30, radius: 22, speedMult: 2.4 },
      { name: '山竹',   emoji: '⚫', weight: 0.35, score: 32, radius: 16, speedMult: 2.6 },
    ],
    soundStyle: 'tropical',
    bgmStyle: 'jungle',
  },

  // ---- 主题五：仁果殿（第41-50关）----
  {
    id: 'pome',
    name: '仁果殿',
    emoji: '🍎',
    startLevel: 40,
    endLevel: 49,
    story: '穿越重重险阻，桃太郎终于来到了传说中的水果圣殿——仁果殿。这里供奉着水果大陆最神圣的果实："许愿苹果"。据说，吃下它就能实现任何愿望。殿前由五大守护者镇守，每一位都拥有不凡的力量。桃太郎站在圣殿门前，深吸一口气——这是最后一段旅程，也是决定一切的终极挑战...',
    player: {
      name: '桃太郎',
      desc: '身披金色战袍，头戴璀璨王冠，胸前佩戴着五颗主题水果的宝石徽章。历经磨砺的桃太郎，终于有了几分王者风范。',
      bodyColor1: '#cc2020', bodyColor2: '#8a1010',
      headColor1: '#ff3030', headColor2: '#cc1010',
      accentColor: '#ffd700',
      bodyR: 28, headR: 20, headDist: 38,
      drawExtra: 'crown_gold',
    },
    bg: {
      colors: ['#2a0a0a', '#1a0505', '#3a1515'],
      accentHue: 0,
      particles: 'spark',
      ringColor: 'rgba(255,100,50,0.04)',
    },
    fruits: [
      { name: '西瓜',   emoji: '🍉', weight: 2.2, score: 15, radius: 32, speedMult: 0.8 },
      { name: '哈密瓜', emoji: '🍈', weight: 2.0, score: 18, radius: 30, speedMult: 0.9 },
      { name: '苹果',   emoji: '🍎', weight: 1.0, score: 22, radius: 22, speedMult: 1.6 },
      { name: '香梨',   emoji: '🍐', weight: 1.2, score: 25, radius: 23, speedMult: 1.3 },
      { name: '枇杷',   emoji: '🟠', weight: 0.4, score: 28, radius: 16, speedMult: 2.5 },
      { name: '山楂',   emoji: '🔴', weight: 0.2, score: 32, radius: 12, speedMult: 3.2 },
      { name: '石榴',   emoji: '💎', weight: 0.35, score: 36, radius: 18, speedMult: 2.6 },
      { name: '榴莲果', emoji: '🥭', weight: 0.4, score: 40, radius: 26, speedMult: 2.8 },
    ],
    soundStyle: 'royal',
    bgmStyle: 'royal',
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
  { name: '岸边初探', target: 210, baseSpeed: 144, spawnInterval: 1580, bombChance: 0.090 },
  { name: '柑橘港口', target: 230, baseSpeed: 148, spawnInterval: 1550, bombChance: 0.095 },
  { name: '柠檬小径', target: 250, baseSpeed: 152, spawnInterval: 1520, bombChance: 0.100 },
  { name: '金色果园', target: 270, baseSpeed: 156, spawnInterval: 1490, bombChance: 0.105 },
  { name: '海上风暴', target: 290, baseSpeed: 160, spawnInterval: 1460, bombChance: 0.110 },
  { name: '沃柑丘陵', target: 310, baseSpeed: 164, spawnInterval: 1430, bombChance: 0.115 },
  { name: '芦柑山谷', target: 330, baseSpeed: 168, spawnInterval: 1400, bombChance: 0.120 },
  { name: '柚子海滩', target: 350, baseSpeed: 172, spawnInterval: 1370, bombChance: 0.125 },
  { name: '暮色港口', target: 370, baseSpeed: 176, spawnInterval: 1340, bombChance: 0.128 },
  { name: '柑橘之王', target: 385, baseSpeed: 180, spawnInterval: 1310, bombChance: 0.130 },

  // ---- 浆果谷（21-30关）----
  { name: '谷口迷雾', target: 400, baseSpeed: 184, spawnInterval: 1280, bombChance: 0.130 },
  { name: '草莓花田', target: 420, baseSpeed: 188, spawnInterval: 1250, bombChance: 0.135 },
  { name: '蓝莓灌木', target: 440, baseSpeed: 192, spawnInterval: 1220, bombChance: 0.140 },
  { name: '桑葚小径', target: 460, baseSpeed: 196, spawnInterval: 1190, bombChance: 0.145 },
  { name: '精灵树屋', target: 480, baseSpeed: 200, spawnInterval: 1160, bombChance: 0.150 },
  { name: '猕猴桃溪', target: 500, baseSpeed: 204, spawnInterval: 1130, bombChance: 0.155 },
  { name: '树莓密林', target: 520, baseSpeed: 208, spawnInterval: 1100, bombChance: 0.160 },
  { name: '葡萄藤架', target: 540, baseSpeed: 212, spawnInterval: 1070, bombChance: 0.165 },
  { name: '圣女果园', target: 560, baseSpeed: 216, spawnInterval: 1040, bombChance: 0.168 },
  { name: '浆果之王', target: 580, baseSpeed: 220, spawnInterval: 1010, bombChance: 0.170 },

  // ---- 热带雨林（31-40关）----
  { name: '雨林边缘', target: 600, baseSpeed: 224, spawnInterval: 990,  bombChance: 0.170 },
  { name: '香蕉丛林', target: 620, baseSpeed: 228, spawnInterval: 970,  bombChance: 0.175 },
  { name: '芒果海岸', target: 645, baseSpeed: 232, spawnInterval: 950,  bombChance: 0.180 },
  { name: '菠萝要塞', target: 670, baseSpeed: 236, spawnInterval: 930,  bombChance: 0.185 },
  { name: '瀑布秘境', target: 695, baseSpeed: 240, spawnInterval: 910,  bombChance: 0.190 },
  { name: '榴莲丛林', target: 720, baseSpeed: 244, spawnInterval: 890,  bombChance: 0.195 },
  { name: '火山脚下', target: 745, baseSpeed: 248, spawnInterval: 870,  bombChance: 0.200 },
  { name: '荔枝沼泽', target: 770, baseSpeed: 252, spawnInterval: 850,  bombChance: 0.205 },
  { name: '椰子海滩', target: 800, baseSpeed: 256, spawnInterval: 830,  bombChance: 0.208 },
  { name: '热带之王', target: 830, baseSpeed: 260, spawnInterval: 810,  bombChance: 0.210 },

  // ---- 仁果殿（41-50关）----
  { name: '殿前广场', target: 860, baseSpeed: 264, spawnInterval: 790, bombChance: 0.200 },
  { name: '皇家果园', target: 880, baseSpeed: 268, spawnInterval: 775, bombChance: 0.205 },
  { name: '石榴走廊', target: 900, baseSpeed: 272, spawnInterval: 760, bombChance: 0.210 },
  { name: '山楂密室', target: 920, baseSpeed: 276, spawnInterval: 745, bombChance: 0.215 },
  { name: '宫廷宴会', target: 940, baseSpeed: 280, spawnInterval: 730, bombChance: 0.220 },
  { name: '地下酒窖', target: 960, baseSpeed: 284, spawnInterval: 715, bombChance: 0.222 },
  { name: '枇杷花园', target: 980, baseSpeed: 288, spawnInterval: 700, bombChance: 0.225 },
  { name: '瓜果迷宫', target: 1000, baseSpeed: 292, spawnInterval: 685, bombChance: 0.227 },
  { name: '龙椅之前', target: 1030, baseSpeed: 296, spawnInterval: 670, bombChance: 0.230 },
  { name: '果皇加冕', target: 1060, baseSpeed: 300, spawnInterval: 655, bombChance: 0.230 },
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
  { id: 'radar',     name: '透视标记', icon: '🔮', color: '#ec4899', desc: '高亮显示水果掉落轨迹5秒', duration: 5000 },
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
