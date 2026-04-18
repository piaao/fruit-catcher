/* ==========================================================
   水果吃货 - 成就系统
   成就定义 + 状态管理 + 解锁检测 + UI 提示
   ========================================================== */

const ACHIEVEMENTS = [
  { id: 'first_win',     name: '初出茅庐',     desc: '完成第一关',                  icon: '🌟', check: (s) => s.maxLevelCleared >= 1 },
  { id: 'clear_all',     name: '水果之王',     desc: '通过全部5关',                icon: '👑', check: (s) => s.maxLevelCleared >= 5 },
  { id: 'score_200',     name: '闪亮登场',     desc: '一局得分达到200分',          icon: '💫', check: (s) => s.roundScore >= 200 },
  { id: 'score_500',     name: '分数猎人',     desc: '一局得分达到500分',          icon: '🎯', check: (s) => s.roundScore >= 500 },
  { id: 'apple_10',      name: '苹果爱好者',   desc: '一局吃了10个苹果',           icon: '🍎', check: (s) => s.roundFruits['苹果'] >= 10 },
  { id: 'apple_30',      name: '苹果狂魔',     desc: '一局吃了30个苹果',           icon: '🍎', check: (s) => s.roundFruits['苹果'] >= 30 },
  { id: 'blueberry_10',  name: '蓝莓收藏家',   desc: '一局吃了10个蓝莓',           icon: '💜', check: (s) => s.roundFruits['蓝莓'] >= 10 },
  { id: 'bomb_5',        name: '炸弹磁铁',     desc: '一局吃了5个炸弹',            icon: '💣', check: (s) => s.roundBombs >= 5 },
  { id: 'bomb_10',       name: '自毁专家',     desc: '一局吃了10个炸弹',           icon: '🤯', check: (s) => s.roundBombs >= 10 },
  { id: 'combo_5',       name: '连击新星',     desc: '达成5连击',                  icon: '⚡', check: (s) => s.maxCombo >= 5 },
  { id: 'combo_10',      name: '连击大师',     desc: '达成10连击',                 icon: '🔥', check: (s) => s.maxCombo >= 10 },
  { id: 'combo_20',      name: '连击之王',     desc: '达成20连击',                 icon: '💥', check: (s) => s.maxCombo >= 20 },
  { id: 'fruit_30',      name: '大胃王',       desc: '一局吃掉30个水果',           icon: '😋', check: (s) => s.roundTotalFruits >= 30 },
  { id: 'fruit_60',      name: '超级大胃王',   desc: '一局吃掉60个水果',           icon: '🤤', check: (s) => s.roundTotalFruits >= 60 },
  { id: 'watermelon_20', name: '西瓜吞噬者',   desc: '一局吃了20个西瓜',           icon: '🍉', check: (s) => s.roundFruits['西瓜'] >= 20 },
  { id: 'grape_15',      name: '葡萄品鉴师',   desc: '一局吃了15个葡萄',           icon: '🍇', check: (s) => s.roundFruits['葡萄'] >= 15 },
  { id: 'strawberry_12', name: '草莓甜心',     desc: '一局吃了12个草莓',           icon: '🍓', check: (s) => s.roundFruits['草莓'] >= 12 },
  { id: 'orange_15',     name: '橙意满满',     desc: '一局吃了15个橙子',           icon: '🍊', check: (s) => s.roundFruits['橙子'] >= 15 },
  { id: 'no_bomb_win',   name: '完美回避',     desc: '不碰任何炸弹通过一关',       icon: '🛡️', check: (s) => s.noBombWin },
  { id: 'speed_clear',   name: '极速通关',     desc: '在30秒内通过任意一关',       icon: '⏱️', check: (s) => s.speedClear },
  { id: 'item_first',    name: '初次尝试',     desc: '第一次使用道具',             icon: '🎁', check: (s) => (s.itemsUsed || 0) >= 1 },
  { id: 'item_hoarder',  name: '道具收藏家',   desc: '同时持有3种不同道具',         icon: '🎒', check: () => {
    let types = 0;
    ITEMS.forEach(it => { if (itemBag[it.id] > 0) types++; });
    return types >= 3;
  }},
  { id: 'item_spam',     name: '疯狂使用',     desc: '一局使用10次道具',            icon: '🧪', check: (s) => (s.itemsUsed || 0) >= 10 },
  { id: 'shield_save',   name: '完美防御',     desc: '用护盾挡住炸弹伤害',          icon: '🔰', check: (s) => s.shieldBlocked },
];

// ---- 成就状态 ----
let unlockedAch = new Set();
let achQueue = [];
let achShowing = false;
let achTimer = null;

/** 检测成就解锁 */
function checkAchievements() {
  for (const ach of ACHIEVEMENTS) {
    if (!unlockedAch.has(ach.id) && ach.check(stats)) {
      unlockedAch.add(ach.id);
      achQueue.push(ach);
      if (!achShowing) showNextAch();
    }
  }
}

/** 显示下一个成就提示 */
function showNextAch() {
  if (achQueue.length === 0) { achShowing = false; return; }
  achShowing = true;
  const ach = achQueue.shift();
  achToast.querySelector('.ach-icon').textContent = ach.icon;
  achNameEl.textContent = ach.name;
  achDescEl.textContent = ach.desc;
  achToast.classList.add('show');
  playAchievementSound();
  clearTimeout(achTimer);
  achTimer = setTimeout(() => {
    achToast.classList.remove('show');
    setTimeout(() => showNextAch(), 400);
  }, 2500);
}
