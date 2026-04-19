/* ==========================================================
   水果吃货 - 游戏核心
   状态管理 + 主循环 + 碰撞 + 主题背景/人物渲染
   依赖: config.js, audio.js, items.js, achievements.js
   ========================================================== */

// ==================== DOM 引用 ====================
const canvas  = document.getElementById('gameCanvas');
const ctx     = canvas.getContext('2d');
const wrapper = document.getElementById('gameWrapper');
const hudEl   = document.getElementById('hud');
const lvlInfo = document.getElementById('levelInfo');
const itemBar = document.getElementById('itemBar');

const achToast  = document.getElementById('achievementToast');
const achNameEl = document.getElementById('achName');
const achDescEl = document.getElementById('achDesc');

// ==================== 全屏自适应 ====================
function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  CX = W / 2;
  CY = H / 2;
  canvas.width = W;
  canvas.height = H;
  PLAYER.x = CX;
  PLAYER.y = CY;
}
// resize 时同步刷新背景粒子
window.addEventListener('resize', () => { resizeCanvas(); if (bgParticles.length > 0) initBgParticles(); });
resizeCanvas();

const overlays = {
  start:  document.getElementById('startScreen'),
  win:    document.getElementById('winScreen'),
  lose:   document.getElementById('loseScreen'),
  clear:  document.getElementById('clearScreen'),
  pause:  document.getElementById('pauseScreen'),
  preview: document.getElementById('levelPreviewScreen'),
};

// ==================== 游戏状态 ====================
let state = 'start';
let level = 0, score = 0, timeLeft = ROUND_TIME;
let mouseX = CX, mouseY = CY - 60;
let projectiles = [];
let particles = [];
let floatingTexts = [];
let spawnTimer = 0, countdownTimer = null;
let combo = 0, comboTimer = 0;
let screenFlash = 0;
let roundStartTime = 0;

// ---- 主题状态 ----
let currentTheme = THEMES[0];
let bgParticles = [];
let bgVariant = 0;  // 当前背景变体（每关随机）

// ---- 本局统计 ----
let stats = {};

function resetRoundStats() {
  stats = {
    roundScore: 0,
    roundFruits: {},
    roundBombs: 0,
    roundTotalFruits: 0,
    maxCombo: 0,
    maxLevelCleared: 0,
    noBombWin: false,
    speedClear: false,
    itemsUsed: 0,
    shieldBlocked: false,
  };
}
resetRoundStats();

// ==================== 鼠标 ====================
canvas.addEventListener('mousemove', e => {
  const r = canvas.getBoundingClientRect();
  mouseX = (e.clientX - r.left) * (W / r.width);
  mouseY = (e.clientY - r.top) * (H / r.height);
});

// ==================== 事件绑定 ====================
document.getElementById('btnStart').addEventListener('click', () => {
  ensureAudio();
  level = 0;
  stats.maxLevelCleared = 0;
  unlockedAch.clear();
  showLevelPreview();
});
document.getElementById('btnNext').addEventListener('click', () => {
  level++;
  showLevelPreview();
});
document.getElementById('btnRetry').addEventListener('click', () => {
  showLevelPreview();
});
document.getElementById('btnRestart1').addEventListener('click', backToStart);
document.getElementById('btnRestart2').addEventListener('click', backToStart);
document.getElementById('btnRestart3').addEventListener('click', backToStart);

// 关卡预览开始按钮
document.getElementById('btnStartLevel').addEventListener('click', () => {
  hideAllOverlays();
  beginRound();
});

// ---- 暂停功能 ----
document.getElementById('btnResume').addEventListener('click', resumeGame);
document.getElementById('btnRetryLevel').addEventListener('click', () => {
  hideAllOverlays();
  beginRound();
});
document.getElementById('btnBackHome').addEventListener('click', backToStart);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (state === 'playing') {
      pauseGame();
    } else if (state === 'paused') {
      resumeGame();
    }
  }
});

function pauseGame() {
  state = 'paused';
  if (countdownTimer) clearInterval(countdownTimer);
  if (typeof stopBGM === 'function') stopBGM();
  const lvl = LEVELS[level];
  document.getElementById('pauseInfo').textContent =
    currentTheme.emoji + ' 第 ' + (level + 1) + ' 关 — ' + lvl.name + '  得分：' + score + '/' + lvl.target;
  showOverlay('pause');
}

function resumeGame() {
  hideAllOverlays();
  state = 'playing';
  if (typeof playThemeBGM === 'function') playThemeBGM(currentTheme.bgmStyle);
  // 恢复倒计时
  countdownTimer = setInterval(() => {
    if (state !== 'playing') return;
    timeLeft--;
    document.getElementById('timerVal').textContent = Math.max(0, timeLeft);
    if (timeLeft <= 10) {
      document.getElementById('timerVal').classList.add('warning');
      playTickSound(timeLeft);
    }
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      endRound();
    }
  }, 1000);
}

function hideAllOverlays() {
  Object.values(overlays).forEach(el => el.classList.add('hidden'));
}
function showOverlay(key) {
  overlays[key].classList.remove('hidden');
}
function backToStart() {
  hideAllOverlays();
  showOverlay('start');
  state = 'start';
  if (countdownTimer) clearInterval(countdownTimer);
  hudEl.classList.remove('active');
  lvlInfo.classList.remove('active');
  itemBar.classList.remove('active');
  clearAllItemEffects();
  if (typeof stopBGM === 'function') stopBGM();
}

// ==================== 关卡预览 ====================
function showLevelPreview() {
  const lvl = LEVELS[level];
  const theme = getCurrentTheme();

  // 设置主题信息
  document.getElementById('previewThemeEmoji').textContent = theme.emoji;
  document.getElementById('previewThemeName').textContent = theme.name + ' · 第' + (level + 1) + '关';
  document.getElementById('previewLevelName').textContent = lvl.name;
  document.getElementById('previewTarget').textContent = lvl.target;

  // 计算难度星级（基于速度和炸弹概率）
  const speedScore = (lvl.baseSpeed - 104) / (300 - 104); // 0-1
  const bombScore = (lvl.bombChance - 0.064) / (0.24 - 0.064); // 0-1
  const totalScore = (speedScore + bombScore) / 2;
  const stars = Math.ceil(totalScore * 5);
  document.getElementById('previewStars').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  document.getElementById('previewStars').style.color = stars >= 4 ? '#ff6b6b' : stars >= 3 ? '#ffa500' : '#ffd700';

  // 生成水果列表
  const fruits = theme.fruits;
  const fruitsHtml = fruits.map(f => {
    const speedClass = f.speedMult >= 2.5 ? 'fruit-fast' : f.speedMult >= 2.0 ? 'fruit-medium' : 'fruit-slow';
    return `<div class="preview-fruit-item">
      <span class="preview-fruit-icon">${f.emoji}</span>
      <span class="preview-fruit-name">${f.name}</span>
      <span class="preview-fruit-score ${speedClass}">${f.score}分</span>
    </div>`;
  }).join('');
  document.getElementById('previewFruits').innerHTML = '<div class="preview-fruits-title">本关水果</div>' + fruitsHtml;

  hideAllOverlays();
  showOverlay('preview');
}

// ==================== 主题系统 ====================

/** 初始化主题 */
function initTheme() {
  const newTheme = getCurrentTheme();
  // 检测是否换了主题
  const themeChanged = newTheme.id !== currentTheme.id;
  currentTheme = newTheme;
  bgVariant = Math.floor(Math.random() * 5); // 0-4随机背景变体
  initBgParticles();

  if (themeChanged && typeof playThemeBGM === 'function') {
    playThemeBGM(currentTheme.bgmStyle);
  }
}

/** 初始化背景粒子 */
function initBgParticles() {
  bgParticles = [];
  const count = 30;
  for (let i = 0; i < count; i++) {
    bgParticles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 20,
      vy: 10 + Math.random() * 30,
      size: 2 + Math.random() * 4,
      alpha: 0.1 + Math.random() * 0.4,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

/** 绘制主题背景 */
function drawThemeBackground() {
  const bg = currentTheme.bg;
  const t = performance.now() / 1000;

  // 基础渐变背景
  const maxDim = Math.max(W, H);
  const grad = ctx.createRadialGradient(CX, CY, 0, CX, CY, maxDim * 0.7);
  grad.addColorStop(0, bg.colors[0]);
  grad.addColorStop(0.6, bg.colors[1]);
  grad.addColorStop(1, bg.colors[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 主题色光环
  const hue = bg.accentHue;
  const hGrad = ctx.createRadialGradient(CX, CY - 100, 0, CX, CY, maxDim * 0.5);
  hGrad.addColorStop(0, 'hsla(' + hue + ',60%,40%,0.08)');
  hGrad.addColorStop(1, 'hsla(' + hue + ',60%,20%,0)');
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, W, H);

  // 背景圆环
  const ringStep = maxDim * 0.16;
  for (let r = ringStep; r < maxDim * 0.7; r += ringStep) {
    ctx.beginPath();
    ctx.arc(CX, CY, r, 0, Math.PI * 2);
    ctx.strokeStyle = bg.ringColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // 背景粒子
  bgParticles.forEach(p => {
    p.x += p.vx * 0.016;
    p.y += p.vy * 0.016;
    p.rot += p.rotSpd * 0.016;
    p.phase += 0.02;

    // 循环
    if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
    if (p.x < -10) p.x = W + 10;
    if (p.x > W + 10) p.x = -10;

    const alpha = p.alpha * (0.5 + 0.5 * Math.sin(p.phase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);

    const pType = bg.particles;
    if (pType === 'petal') {
      // 花瓣
      ctx.fillStyle = 'hsla(' + (hue + 20) + ',70%,80%,1)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pType === 'sparkle') {
      // 海面闪光
      ctx.fillStyle = 'hsla(' + (hue + 10) + ',80%,70%,1)';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else if (pType === 'firefly') {
      // 萤火虫
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
      g.addColorStop(0, 'hsla(' + (hue - 30) + ',80%,70%,0.8)');
      g.addColorStop(1, 'hsla(' + (hue - 30) + ',80%,70%,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-p.size * 2, -p.size * 2, p.size * 4, p.size * 4);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (pType === 'leaf') {
      // 树叶
      ctx.fillStyle = 'hsla(' + (hue + 40) + ',50%,40%,1)';
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'hsla(' + (hue + 40) + ',40%,30%,0.6)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(-p.size * 1.2, 0);
      ctx.lineTo(p.size * 1.2, 0);
      ctx.stroke();
    } else if (pType === 'spark') {
      // 金色火花
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 1.5);
      g.addColorStop(0, 'rgba(255,215,0,0.8)');
      g.addColorStop(1, 'rgba(255,215,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-p.size * 1.5, -p.size * 1.5, p.size * 3, p.size * 3);
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

/** 绘制主题人物 */
function drawPlayer() {
  const px = PLAYER.x, py = PLAYER.y, a = PLAYER.headAngle;
  const hx = px + Math.cos(a) * PLAYER.headDist;
  const hy = py + Math.sin(a) * PLAYER.headDist;
  const theme = currentTheme;
  const pc = theme.player;

  ctx.save();

  // 护盾视觉效果
  if (activeEffects.shield.active) {
    ctx.beginPath();
    ctx.arc(px, py, PLAYER.bodyR + 14, 0, Math.PI * 2);
    const shieldGrad = ctx.createRadialGradient(px, py, PLAYER.bodyR, px, py, PLAYER.bodyR + 14);
    shieldGrad.addColorStop(0, 'rgba(16,185,129,0.05)');
    shieldGrad.addColorStop(0.7, 'rgba(16,185,129,0.15)');
    shieldGrad.addColorStop(1, 'rgba(16,185,129,0.3)');
    ctx.fillStyle = shieldGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,185,129,' + (0.5 + Math.sin(performance.now() / 200) * 0.3) + ')';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // 身体
  const bodyG = ctx.createRadialGradient(px, py, 0, px, py, PLAYER.bodyR);
  bodyG.addColorStop(0, pc.bodyColor1);
  bodyG.addColorStop(1, pc.bodyColor2);
  ctx.shadowColor = pc.bodyColor1;
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(px, py, PLAYER.bodyR, 0, Math.PI * 2);
  ctx.fillStyle = bodyG;
  ctx.fill();
  ctx.strokeStyle = pc.accentColor + '99';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 主题特色装饰（背部）
  if (pc.drawExtra === 'wings') {
    // 精灵翅膀
    ctx.shadowBlur = 0;
    const wingFlap = Math.sin(performance.now() / 200) * 0.3;
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a + Math.PI / 2 * s);
      ctx.beginPath();
      ctx.ellipse(0, -18, 8, 18, wingFlap * s, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150,120,255,0.3)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(180,150,255,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // 眼睛
  ctx.shadowBlur = 0;
  const perp = a + Math.PI / 2;
  for (const s of [-1, 1]) {
    const ex = px + Math.cos(a) * 10 + Math.cos(perp) * s * 8;
    const ey = py + Math.sin(a) * 10 + Math.sin(perp) * s * 8;
    ctx.beginPath(); ctx.arc(ex, ey, 4, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.arc(ex + Math.cos(a) * 1.5, ey + Math.sin(a) * 1.5, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#111'; ctx.fill();
  }

  // 颈部
  ctx.beginPath();
  ctx.moveTo(px + Math.cos(a) * PLAYER.bodyR, py + Math.sin(a) * PLAYER.bodyR);
  ctx.lineTo(hx - Math.cos(a) * PLAYER.headR, hy - Math.sin(a) * PLAYER.headR);
  ctx.strokeStyle = pc.accentColor + '80';
  ctx.lineWidth = 6;
  ctx.stroke();

  // 头部
  const headG = ctx.createRadialGradient(hx, hy, 0, hx, hy, PLAYER.headR);
  headG.addColorStop(0, pc.headColor1);
  headG.addColorStop(1, pc.headColor2);
  ctx.shadowColor = pc.headColor1;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.arc(hx, hy, PLAYER.headR, 0, Math.PI * 2);
  ctx.fillStyle = headG;
  ctx.fill();
  ctx.strokeStyle = pc.accentColor + 'cc';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 嘴巴
  ctx.shadowBlur = 0;
  ctx.font = '16px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('👄', hx, hy);

  // 主题头部装饰
  if (pc.drawExtra === 'leaf') {
    // 桃叶发饰
    ctx.fillStyle = '#88cc44';
    ctx.beginPath();
    ctx.ellipse(hx + 2, hy - PLAYER.headR - 3, 6, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#66aa33';
    ctx.beginPath();
    ctx.ellipse(hx - 2, hy - PLAYER.headR - 5, 4, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (pc.drawExtra === 'hat') {
    // 航海帽
    ctx.fillStyle = '#2255aa';
    ctx.beginPath();
    ctx.ellipse(hx, hy - PLAYER.headR + 2, PLAYER.headR + 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(hx - 10, hy - PLAYER.headR - 12, 20, 15);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(hx - 10, hy - PLAYER.headR - 1, 20, 3);
  } else if (pc.drawExtra === 'crown') {
    // 菠萝叶皇冠
    ctx.fillStyle = '#2a8a2a';
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      const lx = hx + i * 5;
      const ly = hy - PLAYER.headR - 4;
      ctx.moveTo(lx, ly + 8);
      ctx.lineTo(lx - 3, ly + 8);
      ctx.lineTo(lx, ly - 6);
      ctx.lineTo(lx + 3, ly + 8);
      ctx.closePath();
      ctx.fill();
    }
  } else if (pc.drawExtra === 'crown_gold') {
    // 金色皇冠
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(hx - 14, hy - PLAYER.headR + 2);
    ctx.lineTo(hx - 14, hy - PLAYER.headR - 8);
    ctx.lineTo(hx - 7, hy - PLAYER.headR - 2);
    ctx.lineTo(hx, hy - PLAYER.headR - 12);
    ctx.lineTo(hx + 7, hy - PLAYER.headR - 2);
    ctx.lineTo(hx + 14, hy - PLAYER.headR - 8);
    ctx.lineTo(hx + 14, hy - PLAYER.headR + 2);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    // 宝石
    ctx.fillStyle = '#ff3030';
    ctx.beginPath();
    ctx.arc(hx, hy - PLAYER.headR - 5, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 碰撞范围虚线
  ctx.beginPath();
  ctx.arc(hx, hy, PLAYER.headR + 4, 0, Math.PI * 2);
  ctx.strokeStyle = pc.accentColor + '40';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.restore();
}

// ==================== 游戏控制 ====================
function beginRound() {
  state = 'playing';
  score = 0;
  projectiles = [];
  particles = [];
  floatingTexts = [];
  itemDrops = [];
  spawnTimer = 0;
  itemSpawnTimer = 0;
  timeLeft = ROUND_TIME;
  combo = 0; comboTimer = 0;
  roundStartTime = performance.now();
  resetRoundStats();

  // 初始化主题
  initTheme();

  // 每关开始清空道具栏，清除所有效果
  resetItemBag();
  clearAllItemEffects();

  // 初始化水果统计
  const fruitPool = getCurrentFruitPool();
  fruitPool.forEach(f => { stats.roundFruits[f.name] = 0; });

  const lvl = LEVELS[level];
  const theme = currentTheme;

  document.getElementById('levelVal').textContent = level + 1;
  document.getElementById('targetVal').textContent = lvl.target;
  document.getElementById('levelName').textContent = level + 1;
  document.getElementById('levelDesc').textContent = theme.emoji + ' ' + lvl.name;
  document.getElementById('scoreVal').textContent = score;
  document.getElementById('timerVal').textContent = timeLeft;
  document.getElementById('timerVal').classList.remove('warning');

  // 更新主题色到HUD
  document.getElementById('levelInfo').style.borderColor = theme.player.accentColor + '40';

  hudEl.classList.add('active');
  lvlInfo.classList.add('active');
  itemBar.classList.add('active');

  // 主题过渡提示
  if (isThemeStart(level)) {
    addFloatingText(CX, CY - 100, theme.emoji + ' ' + theme.name, theme.player.accentColor);
  }

  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    if (state !== 'playing') return;
    timeLeft--;
    document.getElementById('timerVal').textContent = Math.max(0, timeLeft);
    if (timeLeft <= 10) {
      document.getElementById('timerVal').classList.add('warning');
      playTickSound(timeLeft);
    }
    if (timeLeft <= 0) {
      clearInterval(countdownTimer);
      endRound();
    }
  }, 1000);

  // 恢复BGM
  if (typeof playThemeBGM === 'function') playThemeBGM(theme.bgmStyle);
}

function endRound() {
  state = 'ended';
  const lvl = LEVELS[level];
  const elapsed = (performance.now() - roundStartTime) / 1000;

  clearAllItemEffects();

  if (score >= lvl.target) {
    if (level + 1 > stats.maxLevelCleared) stats.maxLevelCleared = level + 1;
    if (stats.roundBombs === 0) stats.noBombWin = true;
    if (elapsed <= 30) stats.speedClear = true;

    if (level >= LEVELS.length - 1) {
      playWinSound();
      setTimeout(playWinSound, 600);
      document.getElementById('clearMsg').textContent = '全关通关！总得分：' + score;
      document.getElementById('clearDetail').textContent =
        '你已通过全部 ' + LEVELS.length + ' 关，征服了所有五大主题！你是真正的水果之王！';
      showOverlay('clear');
    } else {
      playWinSound();

      // 检测下一关是否新主题
      const nextTheme = THEMES.find(t => level + 1 >= t.startLevel && level + 1 <= t.endLevel);
      let extraMsg = '';
      if (nextTheme && nextTheme.id !== currentTheme.id) {
        extraMsg = '\n即将进入新主题：' + nextTheme.emoji + ' ' + nextTheme.name + '！';
      }

      document.getElementById('winMsg').textContent = '第 ' + (level + 1) + ' 关完成！得分 ' + score;
      document.getElementById('winDetail').textContent =
        currentTheme.emoji + ' ' + lvl.name + ' — 目标：' + lvl.target + '  达成：' + score + '  超额：' + (score - lvl.target) + ' 分' + extraMsg;
      showOverlay('win');
    }
  } else {
    playLoseSound();
    document.getElementById('loseMsg').textContent = '第 ' + (level + 1) + ' 关失败，差 ' + (lvl.target - score) + ' 分';
    document.getElementById('loseDetail').textContent =
      currentTheme.emoji + ' ' + lvl.name + ' — 目标：' + lvl.target + '  你的得分：' + score;
    showOverlay('lose');
  }

  checkAchievements();
}

// ==================== 生成 ====================
function spawnProjectile() {
  const lvl = LEVELS[level];
  const fruitPool = getCurrentFruitPool();
  const side = Math.floor(Math.random() * 4);
  const m = 50;
  let sx, sy;
  if (side === 0) { sx = Math.random() * W; sy = -m; }
  else if (side === 1) { sx = W + m; sy = Math.random() * H; }
  else if (side === 2) { sx = Math.random() * W; sy = H + m; }
  else { sx = -m; sy = Math.random() * H; }

  const isBomb = Math.random() < lvl.bombChance;
  const def = isBomb ? BOMB : fruitPool[Math.floor(Math.random() * fruitPool.length)];

  const dx = CX - sx + (Math.random() - 0.5) * 160;
  const dy = CY - sy + (Math.random() - 0.5) * 160;
  const len = Math.hypot(dx, dy);
  const speed = lvl.baseSpeed * (def.speedMult || 1.5);
  const vx = (dx / len) * speed, vy = (dy / len) * speed;

  projectiles.push({
    x: sx, y: sy, vx, vy,
    def, isBomb,
    scale: 1, eaten: false, alpha: 1,
    rot: Math.random() * Math.PI * 2,
    rotSpd: (Math.random() - 0.5) * 4,
  });
}

function spawnParticles(x, y, color, count, big) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (big ? 120 : 80) + Math.random() * (big ? 250 : 160);
    particles.push({
      x, y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s,
      r: (big ? 4 : 3) + Math.random() * (big ? 8 : 5),
      alpha: 1, color,
      life: (big ? 0.8 : 0.6) + Math.random() * 0.4,
    });
  }
}

function addFloatingText(x, y, text, color) {
  floatingTexts.push({ x, y, text, color, alpha: 1, vy: -60, life: 1.5 });
}

// ==================== 碰撞 ====================
function headPos() {
  return {
    x: PLAYER.x + Math.cos(PLAYER.headAngle) * PLAYER.headDist,
    y: PLAYER.y + Math.sin(PLAYER.headAngle) * PLAYER.headDist,
  };
}
function hitTest(p) {
  const h = headPos();
  return dist(p.x, p.y, h.x, h.y) < (p.def.radius + PLAYER.headR - 4);
}
function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }

// ==================== 主循环 ====================
let lastTS = 0;

function mainLoop(ts) {
  const dt = Math.min((ts - lastTS) / 1000, 0.05);
  lastTS = ts;

  if (state === 'playing') {
    const lvl = LEVELS[level];

    // 头部朝向
    const ta = Math.atan2(mouseY - PLAYER.y, mouseX - PLAYER.x);
    let da = ta - PLAYER.headAngle;
    while (da > Math.PI) da -= Math.PI * 2;
    while (da < -Math.PI) da += Math.PI * 2;
    PLAYER.headAngle += da * Math.min(dt * 14, 1);

    // Combo
    if (comboTimer > 0) { comboTimer -= dt; if (comboTimer <= 0) combo = 0; }

    // 生成水果
    spawnTimer += dt * 1000;
    if (spawnTimer >= lvl.spawnInterval) {
      spawnTimer -= lvl.spawnInterval;
      spawnProjectile();
      if (Math.random() < 0.3) spawnProjectile();
    }

    // 道具掉落生成
    itemSpawnTimer += dt * 1000;
    if (itemSpawnTimer >= ITEM_SPAWN_INTERVAL) {
      itemSpawnTimer -= ITEM_SPAWN_INTERVAL;
      if (Math.random() < ITEM_DROP_CHANCE) {
        spawnItemDrop();
      }
    }

    // 更新道具效果计时
    ['magnet', 'slow', 'double'].forEach(k => {
      if (activeEffects[k].active) {
        activeEffects[k].timer -= dt * 1000;
        if (activeEffects[k].timer <= 0) {
          activeEffects[k].active = false;
          activeEffects[k].timer = 0;
        }
      }
    });

    // 炸弹闪烁衰减
    if (screenFlash > 0) screenFlash -= dt * 3;

    // 计算速度修正
    const speedMod = activeEffects.slow.active ? 0.5 : 1.0;
    const h = headPos();

    // 磁铁效果：吸附水果
    if (activeEffects.magnet.active) {
      const magnetRange = 200;
      projectiles.forEach(p => {
        if (p.eaten || p.isBomb) return;
        const d = dist(p.x, p.y, h.x, h.y);
        if (d < magnetRange && d > 1) {
          const force = (1 - d / magnetRange) * 500;
          const ax = (h.x - p.x) / d * force;
          const ay = (h.y - p.y) / d * force;
          p.vx += ax * dt;
          p.vy += ay * dt;
        }
      });
    }

    // 更新投射物
    projectiles.forEach(p => {
      if (p.eaten) {
        if (p.isBomb) { p.scale += dt * 8; p.alpha -= dt * 6; }
        else { p.scale += dt * 3; p.alpha -= dt * 4; }
        return;
      }

      p.x += p.vx * dt * speedMod;
      p.y += p.vy * dt * speedMod;
      p.rot += p.rotSpd * dt;

      if (hitTest(p)) {
        p.eaten = true;
        combo++;
        comboTimer = 2.5;
        if (combo > stats.maxCombo) stats.maxCombo = combo;

        if (p.isBomb) {
          if (activeEffects.shield.active) {
            activeEffects.shield.active = false;
            stats.shieldBlocked = true;
            playShieldBlockSound();
            spawnParticles(h.x, h.y, '#10b981', 30, true);
            addFloatingText(h.x - 40, h.y - 20, '🛡️ 挡住了！', '#10b981');
            screenFlash = 0.5;
          } else {
            score = Math.max(0, score + p.def.score);
            stats.roundBombs++;
            combo = 0;
            document.getElementById('scoreVal').textContent = score;
            playBombSound();
            spawnParticles(h.x, h.y, '#ff4400', 30, true);
            spawnParticles(h.x, h.y, '#ffaa00', 20, true);
            spawnParticles(h.x, h.y, '#ff0000', 15, false);
            addFloatingText(h.x - 30, h.y - 20, p.def.score + '分', '#ff3333');
            screenFlash = 1;
            wrapper.classList.remove('shake');
            void wrapper.offsetWidth;
            wrapper.classList.add('shake');
          }
        } else {
          let pts = p.def.score;
          // 7档连击倍率（最高50连击3倍）
          if (combo >= 31)       pts = Math.round(pts * 3.0);
          else if (combo >= 21) pts = Math.round(pts * 2.5);
          else if (combo >= 16) pts = Math.round(pts * 2.0);
          else if (combo >= 11) pts = Math.round(pts * 1.8);
          else if (combo >= 7)  pts = Math.round(pts * 1.5);
          else if (combo >= 3)  pts = Math.round(pts * 1.2);
          if (activeEffects.double.active) pts *= 2;
          score += pts;
          stats.roundScore = score;
          stats.roundFruits[p.def.name] = (stats.roundFruits[p.def.name] || 0) + 1;
          stats.roundTotalFruits++;
          document.getElementById('scoreVal').textContent = score;
          playEatSound(p.def, combo >= 3);
          spawnParticles(h.x, h.y, pts >= 12 ? '#ffd700' : '#fff', 16, false);
          const lbl = combo >= 3 ? ('+' + pts + ' x' + combo + '连击！') : ('+' + pts);
          // 根据连击档位调整颜色
          let comboColor = '#ffd700';
          if (combo >= 31) comboColor = '#ff3030';      // 红色-最高档
          else if (combo >= 21) comboColor = '#ff6600';  // 橙色
          else if (combo >= 16) comboColor = '#ff8800';  // 橙黄
          else if (combo >= 11) comboColor = '#ffaa00';  // 黄橙
          addFloatingText(h.x - 20, h.y - 20, lbl, combo >= 3 ? comboColor : currentTheme.player.accentColor);

          if (activeEffects.double.active) {
            addFloatingText(h.x - 10, h.y - 45, '✖️2 DOUBLE', '#ef4444');
          }

          if (score >= LEVELS[level].target) {
            clearInterval(countdownTimer);
            endRound();
          }

          checkAchievements();
        }
      }

      // 越界
      if (!p.eaten) {
        const m = 80;
        if (p.x < -m || p.x > W + m || p.y < -m || p.y > H + m) {
          p.eaten = true; p.alpha = 0;
        }
      }
    });

    projectiles = projectiles.filter(p => p.alpha > 0);

    // 更新道具掉落物
    itemDrops.forEach(d => {
      if (d.eaten) {
        d.scale += dt * 5;
        d.alpha -= dt * 5;
        return;
      }
      d.x += d.vx * dt * speedMod;
      d.y += d.vy * dt * speedMod;
      d.rot += d.rotSpd * dt;
      d.glow += dt * 4;

      const ddist = dist(d.x, d.y, h.x, h.y);
      if (ddist < (24 + PLAYER.headR)) {
        d.eaten = true;
        if (itemBag[d.def.id] < ITEM_MAX_BAG) {
          itemBag[d.def.id]++;
        } else {
          score += 15;
          document.getElementById('scoreVal').textContent = score;
          addFloatingText(d.x - 15, d.y - 15, '+15（道具已满）', '#aaa');
        }
        updateItemBarUI();
        playItemPickupSound();
        spawnParticles(d.x, d.y, d.def.color, 20, false);
        addFloatingText(d.x - 15, d.y - 25, d.def.icon + ' ' + d.def.name, d.def.color);
      }

      if (!d.eaten) {
        const m = 80;
        if (d.x < -m || d.x > W + m || d.y < -m || d.y > H + m) {
          d.eaten = true; d.alpha = 0;
        }
      }
    });
    itemDrops = itemDrops.filter(d => d.alpha > 0);

    // 粒子
    particles.forEach(p => {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += 200 * dt;
      p.life -= dt; p.alpha = Math.max(0, p.life);
    });
    particles = particles.filter(p => p.life > 0);

    // 浮动文字
    floatingTexts.forEach(ft => {
      ft.y += ft.vy * dt; ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.5);
    });
    floatingTexts = floatingTexts.filter(ft => ft.life > 0);
  }

  render();
  requestAnimationFrame(mainLoop);
}

// ==================== 渲染 ====================
function render() {
  // 主题背景
  drawThemeBackground();

  // 磁铁效果范围指示
  if (activeEffects.magnet.active && state === 'playing') {
    const h = headPos();
    const magnetRatio = activeEffects.magnet.timer / 5000;
    ctx.save();
    ctx.beginPath();
    ctx.arc(h.x, h.y, 200, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59,130,246,' + (0.15 + Math.sin(performance.now() / 300) * 0.1) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    const mg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 200);
    mg.addColorStop(0, 'rgba(59,130,246,' + (0.05 * magnetRatio) + ')');
    mg.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.restore();
  }

  // 炸弹红闪
  if (screenFlash > 0) {
    ctx.fillStyle = 'rgba(255,0,0,' + (screenFlash * 0.3) + ')';
    ctx.fillRect(0, 0, W, H);
  }

  // 投射物
  projectiles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(p.scale, p.scale);

    // 双倍得分光环
    if (activeEffects.double.active && !p.eaten && !p.isBomb) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, p.def.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(239,68,68,0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // 绘制水果
    ctx.font = (p.def.radius * 1.7) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = p.isBomb ? '#ff4400' : currentTheme.player.accentColor;
    ctx.shadowBlur = p.isBomb ? 12 : 6;
    ctx.fillText(p.def.emoji, 0, 0);

    ctx.restore();
  });

  // 道具掉落物
  itemDrops.forEach(d => {
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.translate(d.x, d.y);
    ctx.rotate(d.rot);
    ctx.scale(d.scale, d.scale);

    const glowSize = 15 + Math.sin(d.glow) * 5;
    const glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 24 + glowSize);
    glowGrad.addColorStop(0, d.def.color + '60');
    glowGrad.addColorStop(1, d.def.color + '00');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + glowSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowColor = d.def.color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = d.def.color + '30';
    ctx.strokeStyle = d.def.color;
    ctx.lineWidth = 2.5;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.def.icon, 0, 1);

    ctx.restore();
  });

  // 角色
  drawPlayer();

  // 粒子
  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // 浮动文字
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha = ft.alpha;
    ctx.font = 'bold 20px "Segoe UI"';
    ctx.fillStyle = ft.color;
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.textAlign = 'center';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  // 连击显示（7档）
  if (combo >= 3 && comboTimer > 0 && state === 'playing') {
    const mult = combo >= 31 ? 3.0 : combo >= 21 ? 2.5 : combo >= 16 ? 2.0 : combo >= 11 ? 1.8 : combo >= 7 ? 1.5 : 1.2;
    const color = combo >= 31 ? '#ff3030' : combo >= 21 ? '#ff6600' : combo >= 16 ? '#ff8800' : combo >= 11 ? '#ffaa00' : '#ffd700';
    const fire = combo >= 31 ? '💥' : combo >= 21 ? '⚡' : combo >= 16 ? '🔥🔥' : combo >= 11 ? '🔥' : '✨';

    ctx.save();
    ctx.globalAlpha = Math.min(1, comboTimer * 2);
    ctx.font = 'bold 32px "Segoe UI"';
    ctx.fillStyle = color;
    ctx.shadowColor = color; ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillText(fire + ' ' + combo + ' 连击 x' + mult + '！', CX, 50);
    ctx.restore();
  }

  // 活跃效果指示器
  if (state === 'playing') {
    let effectY = 80;
    const effectList = [];
    if (activeEffects.magnet.active) effectList.push({ icon: '🧲', name: '磁铁', timer: activeEffects.magnet.timer, max: 5000, color: '#3b82f6' });
    if (activeEffects.slow.active) effectList.push({ icon: '⏱️', name: '减速', timer: activeEffects.slow.timer, max: 5000, color: '#f59e0b' });
    if (activeEffects.shield.active) effectList.push({ icon: '🛡️', name: '护盾', timer: -1, max: 1, color: '#10b981' });
    if (activeEffects.double.active) effectList.push({ icon: '✖️2', name: '双倍', timer: activeEffects.double.timer, max: 8000, color: '#ef4444' });

    effectList.forEach(ef => {
      ctx.save();
      const bx = 14, by = effectY, bw = 110, bh = 22;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeStyle = ef.color + '80';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = '12px "Segoe UI"';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.fillText(ef.icon + ' ' + ef.name, bx + 6, by + bh / 2);

      if (ef.timer >= 0) {
        const ratio = Math.max(0, ef.timer / ef.max);
        ctx.fillStyle = ef.color;
        ctx.beginPath();
        ctx.roundRect(bx + 4, by + bh - 5, (bw - 8) * ratio, 3, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = ef.color;
        ctx.beginPath();
        ctx.roundRect(bx + 4, by + bh - 5, bw - 8, 3, 2);
        ctx.fill();
      }

      ctx.restore();
      effectY += 28;
    });
  }

  // 最后10秒倒计时
  if (state === 'playing' && timeLeft <= 10 && timeLeft > 0) {
    ctx.save();
    const phase = (performance.now() % 1000) / 1000;
    const scale = 1 + Math.sin(phase * Math.PI) * 0.3;
    ctx.translate(CX, CY - 80);
    ctx.scale(scale, scale);
    ctx.font = 'bold 120px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const urgent = timeLeft <= 5;
    ctx.fillStyle = urgent ? 'rgba(255,60,60,0.5)' : 'rgba(255,160,40,0.4)';
    ctx.shadowColor = urgent ? '#ff3333' : '#ff8800';
    ctx.shadowBlur = 40;
    ctx.fillText(timeLeft, 0, 0);
    ctx.restore();
  }

  // 主题标签（左下角）
  if (state === 'playing') {
    ctx.save();
    ctx.font = '12px "Segoe UI"';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'left';
    ctx.fillText(currentTheme.emoji + ' ' + currentTheme.name + '  |  ' + (level + 1) + '/50', 14, H - 14);
    ctx.restore();
  }

  // 准星
  if (state === 'playing') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(mouseX - 12, mouseY); ctx.lineTo(mouseX + 12, mouseY);
    ctx.moveTo(mouseX, mouseY - 12); ctx.lineTo(mouseX, mouseY + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // idle 状态角色跟随鼠标
  if (state === 'start') {
    PLAYER.headAngle = Math.atan2(mouseY - PLAYER.y, mouseX - PLAYER.x);
  }
}

// ==================== 初始化 & 启动 ====================
initItemBar();
updateItemBarUI();

lastTS = performance.now();
requestAnimationFrame(mainLoop);
