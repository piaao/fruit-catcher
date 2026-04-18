/* ==========================================================
   水果吃货 - 游戏配置
   所有常量、水果/炸弹/关卡/道具定义
   ========================================================== */

// ---- 画布尺寸 ----
const W = 800, H = 600;
const CX = W / 2, CY = H / 2;

// ---- 水果定义 ----
const FRUITS = [
  { name: '蓝莓', emoji: '🫐', weight: 0.05, score: 20, radius: 12, speedMult: 3.2 },
  { name: '草莓', emoji: '🍓', weight: 0.15, score: 12, radius: 16, speedMult: 2.5 },
  { name: '葡萄', emoji: '🍇', weight: 0.3,  score: 8,  radius: 18, speedMult: 2.0 },
  { name: '苹果', emoji: '🍎', weight: 0.8,  score: 5,  radius: 22, speedMult: 1.5 },
  { name: '橙子', emoji: '🍊', weight: 1.5,  score: 3,  radius: 26, speedMult: 1.1 },
  { name: '西瓜', emoji: '🍉', weight: 5.0,  score: 1,  radius: 34, speedMult: 0.7 },
];

// ---- 炸弹 ----
const BOMB = { name: '炸弹', emoji: '💣', score: -15, radius: 24, speedMult: 1.8 };

// ---- 关卡 ----
const LEVELS = [
  { name: '热身关', target: 60,  baseSpeed: 110, spawnInterval: 1800, bombChance: 0.08 },
  { name: '加速关', target: 130, baseSpeed: 140, spawnInterval: 1500, bombChance: 0.10 },
  { name: '密集关', target: 220, baseSpeed: 160, spawnInterval: 1100, bombChance: 0.12 },
  { name: '狂乱关', target: 340, baseSpeed: 190, spawnInterval: 850,  bombChance: 0.15 },
  { name: '极限关', target: 500, baseSpeed: 220, spawnInterval: 650,  bombChance: 0.18 },
];

const ROUND_TIME = 45;

// ---- 道具定义 ----
const ITEMS = [
  { id: 'magnet',    name: '磁铁',     icon: '🧲', color: '#3b82f6', desc: '自动吸附附近水果5秒',   duration: 5000 },
  { id: 'slow',      name: '时间减缓', icon: '⏱️', color: '#f59e0b', desc: '全场速度降低50%持续5秒', duration: 5000 },
  { id: 'shield',    name: '护盾',     icon: '🛡️', color: '#10b981', desc: '免疫下一次炸弹伤害',      duration: 0 },
  { id: 'double',    name: '双倍得分', icon: '✖️', color: '#ef4444', desc: '得分翻倍持续8秒',         duration: 8000 },
  { id: 'clearbomb', name: '炸弹清除', icon: '💥', color: '#f97316', desc: '清除场上所有炸弹',        duration: 0 },
  { id: 'freeze',    name: '冰冻全场', icon: '❄️', color: '#06b6d4', desc: '冻结所有水果4秒',         duration: 4000 },
];

// ---- 道具掉落参数 ----
const ITEM_SPAWN_INTERVAL = 12000; // 每12秒判定一次
const ITEM_DROP_CHANCE = 0.35;    // 35%概率生成道具掉落
const ITEM_MAX_ON_FIELD = 2;       // 场上最多同时2个道具盒
const ITEM_MAX_BAG = 3;            // 每种道具最多持有3个

// ---- 角色 ----
const PLAYER = {
  x: CX, y: CY,
  bodyR: 28, headR: 20,
  headAngle: 0, headDist: 38,
};
