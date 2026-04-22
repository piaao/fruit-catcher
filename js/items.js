/* ==========================================================
   水果吃货 - 道具系统
   道具栏管理 + 掉落生成 + 使用效果 + UI
   ========================================================== */

// ---- 道具栏状态 ----
let itemBag = {};
ITEMS.forEach(it => itemBag[it.id] = 0);

// 当前关卡可用的道具（渐进式）
let currentLevelItems = [];

// ---- 道具掉落物 ----
let itemDrops = [];
let itemSpawnTimer = 0;

// ---- 道具效果状态 ----
let activeEffects = {
  magnet: { active: false, timer: 0 },
  slow:   { active: false, timer: 0 },
  shield: { active: false },
  double: { active: false, timer: 0 },
  radar:  { active: false, timer: 0 },
};

// ---- 道具使用提示 ----
let itemHintTimer = null;
const itemHintEl = document.getElementById('itemUseHint');

function showItemHint(text) {
  itemHintEl.textContent = text;
  itemHintEl.classList.add('show');
  clearTimeout(itemHintTimer);
  itemHintTimer = setTimeout(() => itemHintEl.classList.remove('show'), 2000);
}

/* ---- 道具栏 UI ---- */
function initItemBar() {
  const bar = document.getElementById('itemBar');
  bar.innerHTML = '';
  // 只显示当前关卡可用的道具
  currentLevelItems.forEach((it, i) => {
    const slot = document.createElement('div');
    slot.className = 'item-slot empty';
    slot.id = 'slot-' + it.id;
    slot.innerHTML =
      '<span class="item-key">' + (i + 1) + '</span>' +
      '<span class="item-icon">' + it.icon + '</span>' +
      '<span class="item-count" id="count-' + it.id + '">0</span>';
    bar.appendChild(slot);
  });
}

function updateItemBarUI() {
  // 只更新当前关卡可用的道具
  currentLevelItems.forEach(it => {
    const slot = document.getElementById('slot-' + it.id);
    const countEl = document.getElementById('count-' + it.id);
    if (!slot || !countEl) return;
    const c = itemBag[it.id];
    countEl.textContent = c;
    if (c > 0) {
      slot.classList.remove('empty');
    } else {
      slot.classList.add('empty');
    }
  });
}

/* ---- 生成道具掉落物 ---- */
function spawnItemDrop() {
  if (itemDrops.length >= ITEM_MAX_ON_FIELD) return;
  if (currentLevelItems.length === 0) return; // 没有可用道具
  const def = currentLevelItems[Math.floor(Math.random() * currentLevelItems.length)];
  const side = Math.floor(Math.random() * 4);
  const m = 50;
  let sx, sy;
  if (side === 0) { sx = Math.random() * W; sy = -m; }
  else if (side === 1) { sx = W + m; sy = Math.random() * H; }
  else if (side === 2) { sx = Math.random() * W; sy = H + m; }
  else { sx = -m; sy = Math.random() * H; }

  const dx = CX - sx + (Math.random() - 0.5) * 160;
  const dy = CY - sy + (Math.random() - 0.5) * 160;
  const len = Math.hypot(dx, dy);
  const speed = 90;
  const vx = (dx / len) * speed, vy = (dy / len) * speed;

  itemDrops.push({
    x: sx, y: sy, vx, vy,
    def, eaten: false, alpha: 1,
    scale: 1, rot: 0, rotSpd: (Math.random() - 0.5) * 3,
    glow: 0,
  });
}

/* ---- 使用道具 ---- */
function useItem(slotIndex) {
  if (state !== 'playing') return;
  // 使用当前关卡可用道具的索引
  const def = currentLevelItems[slotIndex];
  if (!def || itemBag[def.id] <= 0) return;

  itemBag[def.id]--;
  updateItemBarUI();

  // 闪烁槽位
  const slot = document.getElementById('slot-' + def.id);
  slot.classList.add('active-use');
  setTimeout(() => slot.classList.remove('active-use'), 200);

  playItemUseSound(def.id);
  const h = headPos();

  switch (def.id) {
    case 'magnet':
      activeEffects.magnet.active = true;
      activeEffects.magnet.timer = def.duration;
      showItemHint('🧲 磁铁启动！自动吸附水果5秒');
      spawnParticles(h.x, h.y, '#3b82f6', 25, true);
      break;

    case 'slow':
      activeEffects.slow.active = true;
      activeEffects.slow.timer = def.duration;
      showItemHint('⏱️ 时间减缓！全场减速50%');
      spawnParticles(h.x, h.y, '#f59e0b', 25, true);
      break;

    case 'shield':
      activeEffects.shield.active = true;
      showItemHint('🛡️ 护盾启动！免疫下一次炸弹');
      spawnParticles(h.x, h.y, '#10b981', 25, true);
      break;

    case 'double':
      activeEffects.double.active = true;
      activeEffects.double.timer = def.duration;
      showItemHint('✖️2 双倍得分！持续8秒');
      spawnParticles(h.x, h.y, '#ef4444', 25, true);
      break;

    case 'addtime':
      timeLeft += 5;
      document.getElementById('timerVal').textContent = Math.max(0, timeLeft);
      document.getElementById('timerVal').classList.remove('warning');
      showItemHint('⏰ 时间+5秒！当前剩余：' + timeLeft + '秒');
      spawnParticles(h.x, h.y, '#a78bfa', 25, true);
      addFloatingText(h.x - 30, h.y - 40, '+5秒', '#a78bfa');
      break;

    case 'radar':
      activeEffects.radar.active = true;
      activeEffects.radar.timer = def.duration;
      showItemHint('🔮 透视启动！显示水果掉落轨迹');
      spawnParticles(h.x, h.y, '#ec4899', 25, true);
      break;
  }

  stats.itemsUsed = (stats.itemsUsed || 0) + 1;
  checkAchievements();
}

/** 清除所有道具效果 */
function clearAllItemEffects() {
  Object.keys(activeEffects).forEach(k => {
    activeEffects[k].active = false;
    if (activeEffects[k].timer !== undefined) activeEffects[k].timer = 0;
  });
}

/** 重置道具栏 */
function resetItemBag() {
  // 只重置当前关卡可用的道具
  currentLevelItems.forEach(it => itemBag[it.id] = 0);
  updateItemBarUI();
}

/* ---- 键盘监听 ---- */
document.addEventListener('keydown', e => {
  const key = parseInt(e.key);
  if (key >= 1 && key <= 6) {
    useItem(key - 1);
  }
});
