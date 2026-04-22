/* ==========================================================
   水果吃货 - 成就系统
   成就定义 + 状态管理 + 解锁检测 + UI 提示
   ========================================================== */

const ACHIEVEMENTS = [
  // ---- 通用成就 ----
  { id: 'first_win',     name: '初出茅庐',     desc: '完成第一关',                  icon: '🌟', check: (s) => s.maxLevelCleared >= 1 },
  { id: 'clear_all',     name: '水果之王',     desc: '通过全部50关',               icon: '👑', check: (s) => s.maxLevelCleared >= 50 },
  { id: 'score_200',     name: '闪亮登场',     desc: '一局得分达到200分',          icon: '💫', check: (s) => s.roundScore >= 200 },
  { id: 'score_500',     name: '分数猎人',     desc: '一局得分达到500分',          icon: '🎯', check: (s) => s.roundScore >= 500 },
  { id: 'combo_5',       name: '连击新星',     desc: '达成5连击',                  icon: '⚡', check: (s) => s.maxCombo >= 5 },
  { id: 'combo_10',      name: '连击大师',     desc: '达成10连击',                 icon: '🔥', check: (s) => s.maxCombo >= 10 },
  { id: 'combo_20',      name: '连击之王',     desc: '达成20连击',                 icon: '💥', check: (s) => s.maxCombo >= 20 },
  { id: 'fruit_30',      name: '大胃王',       desc: '一局吃掉30个水果',           icon: '😋', check: (s) => s.roundTotalFruits >= 30 },
  { id: 'fruit_60',      name: '超级大胃王',   desc: '一局吃掉60个水果',           icon: '🤤', check: (s) => s.roundTotalFruits >= 60 },
  { id: 'no_bomb_win',   name: '完美回避',     desc: '不碰任何炸弹通过一关',       icon: '🛡️', check: (s) => s.noBombWin },
  { id: 'speed_clear',   name: '极速通关',     desc: '在30秒内通过任意一关',       icon: '⏱️', check: (s) => s.speedClear },
  { id: 'bomb_5',        name: '炸弹磁铁',     desc: '一局吃了5个炸弹',            icon: '💣', check: (s) => s.roundBombs >= 5 },
  { id: 'bomb_10',       name: '自毁专家',     desc: '一局吃了10个炸弹',           icon: '🤯', check: (s) => s.roundBombs >= 10 },
  { id: 'item_first',    name: '初次尝试',     desc: '第一次使用道具',             icon: '🎁', check: (s) => (s.itemsUsed || 0) >= 1 },
  { id: 'item_hoarder',  name: '道具收藏家',   desc: '同时持有3种不同道具',         icon: '🎒', check: () => {
    let types = 0;
    ITEMS.forEach(it => { if (itemBag[it.id] > 0) types++; });
    return types >= 3;
  }},
  { id: 'item_spam',     name: '疯狂使用',     desc: '一局使用10次道具',            icon: '🧪', check: (s) => (s.itemsUsed || 0) >= 10 },
  { id: 'shield_save',   name: '完美防御',     desc: '用护盾挡住炸弹伤害',          icon: '🔰', check: (s) => s.shieldBlocked },

  // ---- 水果专属成就（通用名+动态检测）----
  { id: 'fruit_master',  name: '水果大师',     desc: '一局吃掉15个任意水果',       icon: '🏆', check: (s) => {
    return Object.values(s.roundFruits).some(v => v >= 15);
  }},

  // ---- 主题成就 ----
  { id: 'theme_stone',   name: '核果入门',     desc: '通关核果园（第10关）',       icon: '🍑', check: (s) => s.maxLevelCleared >= 10 },
  { id: 'theme_citrus',  name: '柑橘冒险',     desc: '通关柑橘岛（第20关）',       icon: '🍊', check: (s) => s.maxLevelCleared >= 20 },
  { id: 'theme_berry',   name: '浆果猎人',     desc: '通关浆果谷（第30关）',       icon: '🫐', check: (s) => s.maxLevelCleared >= 30 },
  { id: 'theme_tropical',name: '热带勇士',     desc: '通关热带雨林（第40关）',      icon: '🥭', check: (s) => s.maxLevelCleared >= 40 },
  { id: 'theme_pome',    name: '果皇加冕',     desc: '通关仁果殿（第50关）',        icon: '👑', check: (s) => s.maxLevelCleared >= 50 },
  { id: 'theme_all',     name: '全果谱收集者', desc: '通关全部5个主题',             icon: '🏆', check: (s) => s.maxLevelCleared >= 50 },
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
