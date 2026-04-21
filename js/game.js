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
  start:   document.getElementById('startScreen'),
  win:     document.getElementById('winScreen'),
  lose:    document.getElementById('loseScreen'),
  clear:   document.getElementById('clearScreen'),
  pause:   document.getElementById('pauseScreen'),
  preview: document.getElementById('levelPreviewScreen'),
  select:  document.getElementById('levelSelectScreen'),
  settings: document.getElementById('settingsScreen'),
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
// 关卡里程碑（每关首次达成时触发一次）
let milestone40 = false;
let milestone80 = false;
let roundStartTime = 0;

// ---- 海风系统（柑橘岛主题）----
// ---- 海风系统（柑橘岛主题）----
let windState = {
  active: false,
  vx: 0, vy: 0,       // 当前风向速度向量
  dir: 'E',            // N/S/E/W 四个方向
  strength: 0,         // 1=微风, 2=中风, 3=强风
  timer: 0,            // 方向切换计时
  interval: 6,         // 切换间隔(秒)
  streaks: [],         // 风迹粒子（漂浮物）
  blowSound: null,     // 当前播放的风声节点
};

// 风力等级 → 速度基础值（px/s）
function windBaseSpeed(str) {
  return str === 1 ? 70 : str === 2 ? 150 : 250;
}

function getWindStrength() {
  const lvl = LEVELS[level];
  return lvl.windStrength || 0;
}

// 随机选择一个方向
function randomWindDir() {
  const dirs = ['N', 'S', 'E', 'W'];
  return dirs[Math.floor(Math.random() * 4)];
}

// 根据方向和强度计算目标速度向量
function windTargetVector(dir, str) {
  const spd = windBaseSpeed(str);
  switch (dir) {
    case 'N': return { vx: 0, vy: -spd };
    case 'S': return { vx: 0, vy: spd };
    case 'E': return { vx: spd, vy: 0 };
    case 'W': return { vx: -spd, vy: 0 };
  }
}

// 每关开始时调用：初始化风力
function initWindLevel() {
  const str = getWindStrength();
  if (str === 0) {
    windState.active = false;
    windState.vx = 0; windState.vy = 0;
    stopWindSound();
    return;
  }
  windState.active = true;
  windState.strength = str;
  windState.dir = randomWindDir();
  windState.timer = windState.interval;
  const t = windTargetVector(windState.dir, str);
  windState.vx = t.vx;
  windState.vy = t.vy;
  playWindSound(str);
}

// 更新风力系统（每帧）—— 风向全关固定，只在 initWindLevel() 初始化
function updateWind(dt) {
  const str = getWindStrength();
  if (str === 0) {
    if (windState.active) {
      windState.active = false;
      stopWindSound();
    }
    return;
  }

  windState.active = true;

  // 强度变化时重启音效
  if (str !== windState.strength) {
    windState.strength = str;
    playWindSound(str);
  }

  // 更新风迹粒子（漂浮物：树叶/气泡）
  const maxS = windState.strength === 1 ? 8 : windState.strength === 2 ? 14 : 20;
  if (Math.random() < 0.4 && windState.streaks.length < maxS) {
    // 从风来的方向边缘生成
    let sx, sy;
    if (windState.dir === 'N') { sx = Math.random() * W; sy = H + 10; }
    else if (windState.dir === 'S') { sx = Math.random() * W; sy = -10; }
    else if (windState.dir === 'E') { sx = -10; sy = Math.random() * H; }
    else { sx = W + 10; sy = Math.random() * H; }
    windState.streaks.push({
      x: sx, y: sy,
      life: 1.5 + Math.random() * 1,
      alpha: 0.5 + Math.random() * 0.4,
      size: 4 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 3,
      wobble: Math.random() * Math.PI * 2,
      emoji: Math.random() < 0.6 ? '🍃' : (Math.random() < 0.5 ? '🌿' : '✦'),
    });
  }
  const spd = windBaseSpeed(windState.strength);
  windState.streaks.forEach(p => {
    p.x += windState.vx * dt;
    p.y += windState.vy * dt;
    p.life -= dt;
    p.rot += p.rotSpd * dt;
    p.wobble += dt * 2;
    p.alpha = Math.max(0, (p.life / 2.5) * 0.7);
  });
  windState.streaks = windState.streaks.filter(p =>
    p.life > 0 && p.x > -80 && p.x < W + 80 && p.y > -80 && p.y < H + 80
  );
}

// 播放风力环境音效（白噪音+带通滤波）
function playWindSound(str) {
  stopWindSound();
  if (typeof ensureAudio !== 'function' || !audioCtx) return;
  ensureAudio();
  const ac = audioCtx;
  const now = ac.currentTime;

  // 噪声缓冲（持续循环）
  const nsBuf = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
  const data = nsBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  const ns = ac.createBufferSource();
  ns.buffer = nsBuf;
  ns.loop = true;

  // 带通滤波（塑造风声音色）
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = str === 1 ? 400 : str === 2 ? 700 : 1100;
  bp.Q.value = str === 1 ? 0.5 : str === 2 ? 0.7 : 1.0;

  // 高频啸叫（强风更明显）
  const hp = ac.createBiquadFilter();
  hp.type = 'highshelf';
  hp.frequency.value = 2000;
  hp.gain.value = str === 1 ? -6 : str === 2 ? 0 : 6;

  const g = ac.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(str === 1 ? 0.06 : str === 2 ? 0.12 : 0.20, now + 0.5);
  g.gain.setValueAtTime(str === 1 ? 0.06 : str === 2 ? 0.12 : 0.20, now + 3);
  g.gain.linearRampToValueAtTime(0, now + 3.5);

  ns.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ac.destination);
  ns.start(now);
  windState.blowSound = { src: ns, gain: g };
}

function stopWindSound() {
  if (windState.blowSound) {
    try {
      windState.blowSound.src.stop();
    } catch(e) {}
    windState.blowSound = null;
  }
}

// 追踪已出现的水果和道具（用于 NEW 标记）
let seenFruits = new Set();
let seenItems = new Set();

// ---- 海风演示动画（关卡选择界面）----
let windDemoRAF = null;
let windDemoItems = [];

function initWindDemo() {
  const canvas = document.getElementById('windDemoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W2 = canvas.width, H2 = canvas.height;

  windDemoItems = [];
  for (let i = 0; i < 8; i++) {
    windDemoItems.push({
      x: Math.random() * W2,
      y: Math.random() * H2,
      vx: (Math.random() - 0.5) * 15,
      vy: 12 + Math.random() * 12,
      size: 8 + Math.random() * 6,
      emoji: Math.random() < 0.5 ? '🍃' : (Math.random() < 0.5 ? '🌿' : '🍊'),
      alpha: 0.6 + Math.random() * 0.4,
      rot: Math.random() * Math.PI * 2,
      rotSpd: (Math.random() - 0.5) * 2,
    });
  }

  let windVx = 0, windVy = 60;
  let windTimer = 0;
  let windDir = 'S';
  const windDirs = ['N', 'S', 'E', 'W'];
  let dirIdx = 1;
  let t = 0;

  function drawFrame() {
    ctx.clearRect(0, 0, W2, H2);

    // 风向标签
    const dirIcon = windDir === 'N' ? '↑北' : windDir === 'S' ? '↓南' : windDir === 'E' ? '→东' : '←西';
    ctx.save();
    ctx.fillStyle = 'rgba(136,221,255,0.9)';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dirIcon, W2 / 2, H2 - 8);
    ctx.restore();

    // 绘制漂浮物（随风移动）
    windDemoItems.forEach(f => {
      f.x += f.vx * 0.016 + windVx * 0.016;
      f.y += f.vy * 0.016 + windVy * 0.016;
      f.rot += f.rotSpd * 0.016;
      ctx.save();
      ctx.globalAlpha = f.alpha;
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.font = f.size + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(f.emoji, 0, 0);
      ctx.restore();

      // 重置出界物品
      if (f.y > H2 + 15 || f.y < -15 || f.x < -15 || f.x > W2 + 15) {
        f.y = -10;
        f.x = Math.random() * W2;
        f.vx = (Math.random() - 0.5) * 15;
        f.vy = 12 + Math.random() * 12;
      }
    });

    // 定时切换方向
    windTimer += 0.016;
    if (windTimer > 2.5) {
      windTimer = 0;
      dirIdx = (dirIdx + 1) % windDirs.length;
      windDir = windDirs[dirIdx];
      windVx = windDir === 'E' ? 60 : windDir === 'W' ? -60 : 0;
      windVy = windDir === 'S' ? 60 : windDir === 'N' ? -60 : 0;
    }

    t += 0.016;
    windDemoRAF = requestAnimationFrame(drawFrame);
  }

  if (windDemoRAF) cancelAnimationFrame(windDemoRAF);
  windDemoRAF = requestAnimationFrame(drawFrame);
}

function stopWindDemo() {
  if (windDemoRAF) {
    cancelAnimationFrame(windDemoRAF);
    windDemoRAF = null;
  }
}

// ---- 关卡选择状态 ----
let currentSelectTheme = 0; // 当前选择的主题索引（0-4）
let passedLevels = [];      // 已通过的关卡索引数组
let levelStars = {};        // 关卡星级 { levelIdx: stars (1-5) }
let levelBestScores = {};  // 关卡最佳成绩 { levelIdx: bestScore }

// ---- 秘籍状态 ----
let cheatAllLevels = false;  // 全关解锁
let cheatStartBonus = false; // 初始+10分
let cheatStartItem = false;  // 初始道具

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

// 秘籍开关事件
document.getElementById('cheatAllLevels').addEventListener('change', e => {
  cheatAllLevels = e.target.checked;
  // 刷新关卡选择界面显示
  if (document.getElementById('levelSelectScreen').classList.contains('hidden') === false) {
    renderLevelSelect();
  }
});
document.getElementById('cheatStartBonus').addEventListener('change', e => {
  cheatStartBonus = e.target.checked;
});
document.getElementById('cheatStartItem').addEventListener('change', e => {
  cheatStartItem = e.target.checked;
});

document.getElementById('btnStart').addEventListener('click', () => {
  ensureAudio();
  if (typeof playClickSound === 'function') playClickSound();
  loadProgress(); // 加载已保存的进度
  showLevelSelect(); // 打开关卡选择界面
});

// 设置按钮
document.getElementById('btnSettings').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  showOverlay('settings');
});

// 关闭设置按钮
document.getElementById('btnCloseSettings').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  hideAllOverlays();
});

// 音乐音量滑块
document.getElementById('bgmVolume').addEventListener('input', e => {
  const vol = parseInt(e.target.value);
  document.getElementById('bgmVolumeValue').textContent = vol + '%';
  if (bgmGainNode) {
    bgmGainNode.gain.value = vol / 100;
  }
  localStorage.setItem('fc_bgmVol', vol);
});

// 音效音量滑块
document.getElementById('sfxVolume').addEventListener('input', e => {
  const vol = parseInt(e.target.value);
  document.getElementById('sfxVolumeValue').textContent = vol + '%';
  localStorage.setItem('fc_sfxVol', vol);
});

// 音效测试按钮
document.getElementById('btnTestSfx').addEventListener('click', () => {
  ensureAudio();
  if (typeof playEatSound === 'function') {
    playEatSound({ weight: 1.5 }, false);
  }
});

// 重置进度按钮
document.getElementById('btnResetProgress').addEventListener('click', () => {
  if (confirm('确定要重置所有游戏进度吗？\n这将清空所有关卡记录、成就和最佳成绩！')) {
    localStorage.removeItem('fc_progress');
    localStorage.removeItem('fc_achievements');
    passedLevels = [];
    levelStars = {};
    levelBestScores = {};
    unlockedAch = new Set();
    stats = { maxLevelCleared: -1 };
    if (typeof playClickSound === 'function') playClickSound();
    hideAllOverlays();
    alert('进度已重置！');
  }
});

// 加载保存的音量设置
function loadVolumeSettings() {
  const savedBgmVol = localStorage.getItem('fc_bgmVol');
  const savedSfxVol = localStorage.getItem('fc_sfxVol');
  if (savedBgmVol !== null) {
    const vol = parseInt(savedBgmVol);
    document.getElementById('bgmVolume').value = vol;
    document.getElementById('bgmVolumeValue').textContent = vol + '%';
    if (bgmGainNode) bgmGainNode.gain.value = vol / 100;
  }
  if (savedSfxVol !== null) {
    const vol = parseInt(savedSfxVol);
    document.getElementById('sfxVolume').value = vol;
    document.getElementById('sfxVolumeValue').textContent = vol + '%';
  }
}

document.getElementById('btnNext').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  level++;
  showLevelPreview();
});
document.getElementById('btnRetry').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  showLevelPreview();
});

// 快速重试按钮 - 直接开始当前关卡
document.getElementById('btnRetryDirect').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  hideAllOverlays();
  beginRound();
});
document.getElementById('btnRestart1').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});
document.getElementById('btnRestart3').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});
// 新增：通关/失败界面返回首页按钮
document.getElementById('btnBackHomeWin').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});
document.getElementById('btnBackHomeLose').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});
document.getElementById('btnBackHomeClear').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});

// 关卡预览开始按钮
document.getElementById('btnStartLevel').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  hideAllOverlays();
  beginRound();
});

// 关卡预览返回按钮
document.getElementById('btnBackToSelect').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  showLevelSelect();
});

// ---- 暂停功能 ----
document.getElementById('btnResume').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  resumeGame();
});
document.getElementById('btnRetryLevel').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  hideAllOverlays();
  beginRound();
});
document.getElementById('btnBackHome').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});

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
  if (typeof playPauseSound === 'function') playPauseSound();
  const lvl = LEVELS[level];
  document.getElementById('pauseInfo').textContent =
    currentTheme.emoji + ' 第 ' + (level + 1) + ' 关 — ' + lvl.name + '  得分：' + score + '/' + lvl.target;
  showOverlay('pause');
}

function resumeGame() {
  hideAllOverlays();
  state = 'playing';
  if (typeof playResumeSound === 'function') playResumeSound();
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
  // 播放界面出现音效
  if (typeof playUIShowSound === 'function') playUIShowSound();
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
  const speedScore = (lvl.baseSpeed - 104) / (300 - 104);
  const bombScore = (lvl.bombChance - 0.064) / (0.24 - 0.064);
  const totalScore = (speedScore + bombScore) / 2;
  const stars = Math.ceil(totalScore * 5);
  document.getElementById('previewStars').textContent = '★'.repeat(stars) + '☆'.repeat(5 - stars);
  document.getElementById('previewStars').style.color = stars >= 4 ? '#ff6b6b' : stars >= 3 ? '#ffa500' : '#ffd700';

  // 生成水果列表（按分数从高到低排列 + NEW 标记）
  const fruits = getCurrentFruitPool().sort((a, b) => b.score - a.score);
  const fruitsHtml = fruits.map(f => {
    const speedClass = f.speedMult >= 2.5 ? 'fruit-fast' : f.speedMult >= 2.0 ? 'fruit-medium' : 'fruit-slow';
    const isNew = !seenFruits.has(f.name);
    seenFruits.add(f.name);
    return `<div class="preview-fruit-item">
      <span class="preview-fruit-icon">${f.emoji}</span>
      <span class="preview-fruit-name">${f.name}</span>
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      <span class="preview-fruit-score ${speedClass}">${f.score}分</span>
    </div>`;
  }).join('');
  document.getElementById('previewFruits').innerHTML = '<div class="preview-section-title">🍑 本关水果（共' + fruits.length + '种）</div>' + fruitsHtml;

  // 生成道具列表（按出现顺序）
  const items = getCurrentItemPool();
  const itemsHtml = items.map(item => {
    const isNew = !seenItems.has(item.id);
    seenItems.add(item.id);
    return `<div class="preview-item-item">
      <span class="preview-item-icon">${item.icon}</span>
      <span class="preview-item-name">${item.name}</span>
      ${isNew ? '<span class="new-badge">NEW</span>' : ''}
      <span class="preview-item-desc">${item.desc}</span>
    </div>`;
  }).join('');
  document.getElementById('previewItems').innerHTML = '<div class="preview-section-title">🎁 本关道具（共' + items.length + '种）</div>' + itemsHtml;

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
  milestone40 = false; milestone80 = false;
  roundStartTime = performance.now();
  // 重置海风（每关随机方向+强度）
  initWindLevel();
  resetRoundStats();

  // 秘籍：初始+10分
  if (cheatStartBonus) {
    score += 10;
    addFloatingText(CX, CY - 80, '+10 初始积分!', '#ffd700');
  }

  // 初始化主题
  initTheme();

  // 初始化当前关卡的道具池（渐进式）
  currentLevelItems = getCurrentItemPool();
  initItemBar(); // 重新初始化道具栏（根据当前关卡的道具池）
  resetItemBag();
  clearAllItemEffects();

  // 秘籍：初始随机道具
  if (cheatStartItem && currentLevelItems.length > 0) {
    const randomItem = currentLevelItems[Math.floor(Math.random() * currentLevelItems.length)];
    addItemToBag(randomItem);
    addFloatingText(CX, CY - 50, '🎁 ' + randomItem.name, '#a8e063');
  }

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
    const prevMaxLevel = stats.maxLevelCleared;
    markLevelPassed(level); // 保存通关进度
    if (level + 1 > stats.maxLevelCleared) stats.maxLevelCleared = level + 1;
    if (stats.roundBombs === 0) stats.noBombWin = true;
    if (elapsed <= 30) stats.speedClear = true;

    // 检测主题通关（第10、20、30、40、50关）
    const themeEnds = [9, 19, 29, 39, 49];
    if (themeEnds.includes(level) && level > prevMaxLevel) {
      const themeIdx = themeEnds.indexOf(level);
      const theme = THEMES[themeIdx];
      // 主题通关庆祝效果
      setTimeout(() => {
        createThemeClearCelebration(theme, level + 1);
      }, 500);
    }

    // 计算用时评级
    const timeLeft = ROUND_TIME - elapsed;
    let rank, rankColor, rankBg, stars;
    if (timeLeft >= 20)      { rank = 'S'; stars = 5; rankColor = '#ffd700'; rankBg = 'linear-gradient(135deg, #ffd700, #ff8c00)'; }
    else if (timeLeft >= 15) { rank = 'A'; stars = 4; rankColor = '#60d060'; rankBg = 'linear-gradient(135deg, #60d060, #40a040)'; }
    else if (timeLeft >= 10) { rank = 'B'; stars = 3; rankColor = '#4da6ff'; rankBg = 'linear-gradient(135deg, #4da6ff, #2070c0)'; }
    else if (timeLeft >= 5)  { rank = 'C'; stars = 2; rankColor = '#ffa500'; rankBg = 'linear-gradient(135deg, #ffa500, #cc8000)'; }
    else                     { rank = 'D'; stars = 1; rankColor = '#888888'; rankBg = 'linear-gradient(135deg, #888, #555)'; }

    // 保存星级（取最高）
    if (!levelStars[level] || levelStars[level] < stars) {
      levelStars[level] = stars;
    }
    // 保存最佳成绩
    if (!levelBestScores[level] || score > levelBestScores[level]) {
      levelBestScores[level] = score;
    }
    saveProgress();

    if (level >= LEVELS.length - 1) {
      // 全通关 - 使用增强音效
      if (typeof playClearCelebrationSound === 'function') playClearCelebrationSound();
      else { playWinSound(); setTimeout(playWinSound, 600); }

      // 创建金色星尘和烟花效果
      setTimeout(() => {
        createStardust('clearConfetti');
        createFireworks('clearFireworks');
      }, 300);

      document.getElementById('clearMsg').textContent = '🏆 全关通关！';
      document.getElementById('clearDetail').innerHTML =
        '<div class="result-section result-section-full">' +
        '<div class="result-section-title">🎯 本关得分</div>' +
        '<div class="result-row"><span class="result-label">目标</span><span class="result-value">' + lvl.target + '</span></div>' +
        '<div class="result-row"><span class="result-label">实际</span><span class="result-value" style="color:#a8e063">+' + (score - lvl.target) + '</span></div>' +
        '</div>' +
        '<div class="result-section result-section-full">' +
        '<div class="result-section-title">⭐ 关卡评价</div>' +
        '<div class="result-row"><span class="result-label">用时</span><span class="result-value">' + elapsed.toFixed(1) + 's</span></div>' +
        '<div class="result-row"><span class="result-label">剩余</span><span class="result-value">' + timeLeft.toFixed(1) + 's</span></div>' +
        '<div class="result-rank pulse-glow" style="background:' + rankBg + ';color:' + rankColor + '">' + rank + '</div>' +
        '</div>' +
        '<p style="margin-top:14px;color:#ffd700;font-size:13px">🏆 你已通过全部 ' + LEVELS.length + ' 关，征服了所有五大主题！</p>';
      showOverlay('clear');
    } else {
      // 过关 - 使用增强音效
      if (typeof playWinSoundEnhanced === 'function') playWinSoundEnhanced();
      else playWinSound();

      // 创建彩带庆祝效果
      setTimeout(() => {
        createConfetti('winConfetti', ['#a8e063', '#ffd700', '#4da6ff', '#feca57']);
      }, 200);

      // 检测下一关是否新主题
      const nextTheme = THEMES.find(t => level + 1 >= t.startLevel && level + 1 <= t.endLevel);
      let extraMsg = '';
      if (nextTheme && nextTheme.id !== currentTheme.id) {
        extraMsg = '<br>🌟 即将进入新主题：' + nextTheme.emoji + ' ' + nextTheme.name + '！';
      }

      // 构建详细统计信息
      const fruitStats = Object.entries(stats.roundFruits)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => '<div class="result-row"><span class="result-label">' + name + '</span><span class="result-value" style="color:#a8e063">×' + count + '</span></div>')
        .slice(0, 5) // 最多显示5种水果
        .join('');

      document.getElementById('winMsg').textContent = '第 ' + (level + 1) + ' 关完成！';
      document.getElementById('winDetail').innerHTML =
        '<div class="result-section result-section-full">' +
        '<div class="result-section-title">🎯 本关得分</div>' +
        '<div class="result-row"><span class="result-label">目标</span><span class="result-value">' + lvl.target + '</span></div>' +
        '<div class="result-row"><span class="result-label">实际</span><span class="result-value" style="color:#a8e063">+' + (score - lvl.target) + '</span></div>' +
        '</div>' +
        '<div class="result-section result-section-full">' +
        '<div class="result-section-title">⭐ 关卡评价</div>' +
        '<div class="result-row"><span class="result-label">用时</span><span class="result-value">' + elapsed.toFixed(1) + 's</span></div>' +
        '<div class="result-row"><span class="result-label">剩余</span><span class="result-value">' + timeLeft.toFixed(1) + 's</span></div>' +
        '<div class="result-rank pulse-glow" style="background:' + rankBg + ';color:' + rankColor + '">' + rank + '</div>' +
        '</div>' +
        (fruitStats ? '<div class="result-section result-section-full"><div class="result-section-title">🍑 水果统计</div>' + fruitStats + '</div>' : '') +
        '<p style="margin-top:10px;color:#888;font-size:13px">评价规则：剩余时间 ≥20s=S 15s=A 10s=B 5s=C D' + extraMsg + '</p>';
      showOverlay('win');
    }
  } else {
    // 失败 - 使用增强音效
    if (typeof playLoseSoundEnhanced === 'function') playLoseSoundEnhanced();
    else playLoseSound();

    // 触发屏幕红闪
    setTimeout(() => {
      const wrapper = document.getElementById('gameWrapper');
      wrapper.classList.add('screen-red-flash');
      setTimeout(() => wrapper.classList.remove('screen-red-flash'), 500);
    }, 100);

    const remaining = ROUND_TIME - elapsed;
    document.getElementById('loseMsg').textContent = '💀 第 ' + (level + 1) + ' 关失败';
    document.getElementById('loseDetail').innerHTML =
      '<div class="result-section">' +
      '<div class="result-section-title">🎯 本关得分</div>' +
      '<div class="result-row"><span class="result-label">目标</span><span class="result-value">' + lvl.target + '</span></div>' +
      '<div class="result-row"><span class="result-label">实际</span><span class="result-value" style="color:#ff6b6b">-' + (lvl.target - score) + '</span></div>' +
      '</div>' +
      '<div class="result-section">' +
      '<div class="result-section-title">⏱️ 用时</div>' +
      '<div class="result-row"><span class="result-label">用时</span><span class="result-value">' + elapsed.toFixed(1) + 's</span></div>' +
      '<div class="result-row"><span class="result-label">剩余</span><span class="result-value">' + remaining.toFixed(1) + 's</span></div>' +
      '</div>' +
      '<p style="margin-top:14px;color:#ff6b6b;font-size:13px">💪 还差 ' + (lvl.target - score) + ' 分，不要放弃！</p>';
    showOverlay('lose');
  }

  checkAchievements();
}

// ==================== 生成 ====================
function spawnProjectile() {
  const lvl = LEVELS[level];
  const fruitPool = getCurrentFruitPool();
  const isBomb = Math.random() < lvl.bombChance;
  const def = isBomb ? BOMB : fruitPool[Math.floor(Math.random() * fruitPool.length)];
  const speed = lvl.baseSpeed * (def.speedMult || 1.5);

  // 四边随机生成点
  const m = 50;
  const side = Math.floor(Math.random() * 4);
  let sx, sy;
  if (side === 0) { sx = Math.random() * W; sy = -m; }
  else if (side === 1) { sx = W + m; sy = Math.random() * H; }
  else if (side === 2) { sx = Math.random() * W; sy = H + m; }
  else { sx = -m; sy = Math.random() * H; }

  // 目标点：角色附近加散布
  const tx = CX + (Math.random() - 0.5) * 160;
  const ty = CY + (Math.random() - 0.5) * 160;
  const dx = tx - sx, dy = ty - sy;
  const len = Math.hypot(dx, dy);

  // 基础初速（对准角色）
  let vx = (dx / len) * speed;
  let vy = (dy / len) * speed;

  // 有风时：数值积分精确补偿，使水果最终落到角色附近
  // 水果运动模型：重力 GY = 200 加速度 + 恒定风力 windState.vx/vy
  // 策略：先估算落地时间 T，再用风偏移修正 vx 使落点对准角色
  if (windState.active) {
    const GY = 200; // 重力加速度(px/s²)，与游戏内一致
    const catchR = 55; // 角色捕获半径
    const catchX = CX, catchY = CY;

    // 估算落地时间（精确二次方程求根）
    // sy + vy0*t + 0.5*GY*t² = catchY
    const a = 0.5 * GY;
    const b = vy;
    const c = sy - catchY;
    const disc = b * b - 4 * a * c;
    let T;
    if (disc < 0) {
      T = Math.abs((catchY - sy) / vy); // 竖直方向飞不到，用竖直估算
    } else {
      const t1 = (-b + Math.sqrt(disc)) / (2 * a);
      const t2 = (-b - Math.sqrt(disc)) / (2 * a);
      T = Math.max(t1, t2); // 取较大的正解（落下来而非飞上去）
    }
    T = Math.max(T, 0.3); // 至少0.3秒，防止近距离水果T过小

    // 飞行 T 秒后，风造成 x 方向总偏移 = windVx * T
    // 若落点 x0 = sx + vx * T + windVx * T 超出 catchR，则修正 vx
    const landX = sx + vx * T + windState.vx * T;
    const drift = landX - catchX;
    // 修正：调整 vx 使落点回正，保留 8% 漂移感
    const COMP = 0.92;
    if (Math.abs(drift) > 5) {
      vx = (sx - catchX + vx * T - drift * COMP) / T;
      // 限制最大横向速度（不超过竖直速度的1.5倍）
      const maxVx = Math.abs(vy) * 1.5 + speed;
      if (Math.abs(vx) > maxVx) vx = Math.sign(vx) * maxVx;
    }
  }

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

// ==================== 界面特效函数 ====================

/** 创建过关彩带效果 */
function createConfetti(containerId, colors) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const confettiColors = colors || ['#ffd700', '#ff6b6b', '#a8e063', '#4da6ff', '#ff9ff3', '#feca57'];

  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    confetti.style.animationDelay = Math.random() * 0.5 + 's';
    confetti.style.animationDuration = (2 + Math.random() * 2) + 's';

    // 不同形状
    const shapes = ['50%', '0', '50% 0 50% 50%'];
    confetti.style.borderRadius = shapes[Math.floor(Math.random() * shapes.length)];

    // 随机大小
    const size = 6 + Math.random() * 8;
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';

    container.appendChild(confetti);
  }
}

/** 创建烟花效果 */
function createFireworks(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const fireworkColors = ['#ffd700', '#ff6b6b', '#4da6ff', '#a8e063', '#ff9ff3'];

  for (let fw = 0; fw < 5; fw++) {
    setTimeout(() => {
      const centerX = 20 + Math.random() * 60;
      const centerY = 20 + Math.random() * 40;
      const color = fireworkColors[Math.floor(Math.random() * fireworkColors.length)];

      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework';
        particle.style.left = centerX + '%';
        particle.style.top = centerY + '%';
        particle.style.backgroundColor = color;

        const angle = (i / 20) * Math.PI * 2;
        const distance = 50 + Math.random() * 80;
        particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');

        container.appendChild(particle);
      }

      // 播放爆炸音效
      if (typeof playBombSound === 'function') {
        setTimeout(() => playBombSound(), fw * 300);
      }
    }, fw * 400);
  }
}

/** 创建金色星尘效果 */
function createStardust(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const dust = document.createElement('div');
      dust.className = 'stardust';
      dust.style.left = Math.random() * 100 + '%';
      dust.style.top = Math.random() * 100 + '%';
      dust.style.animationDelay = Math.random() * 0.5 + 's';
      container.appendChild(dust);
    }, i * 50);
  }
}

/** 屏幕边缘闪光效果 */
function triggerScreenEdgeFlash(color) {
  const wrapper = document.getElementById('gameWrapper');
  wrapper.style.boxShadow = 'inset 0 0 100px ' + color;
  setTimeout(() => {
    wrapper.style.boxShadow = 'none';
  }, 300);
}

/** 连击里程碑检测并触发特效 */
function checkComboMilestone(combo) {
  // 里程碑: 2, 5, 7, 10, 13, 17, 22, 31, 50
  const milestones = [2, 5, 7, 10, 13, 17, 22, 31, 50];
  if (!milestones.includes(combo)) return;

  // 计算等级：里程碑越靠后等级越高
  const level = Math.min(milestones.indexOf(combo) + 1, 5);
  if (typeof playComboMilestoneSound === 'function') {
    playComboMilestoneSound(level);
  }
  // 触发屏幕边框闪光
  const colors = ['#a8e063', '#88cc44', '#ffd700', '#ff9ff3', '#ff6b6b'];
  triggerScreenEdgeFlash(colors[Math.min(level - 1, 4)] + '80');
}

/** 关卡阶段里程碑检测（40% / 80%） */
function checkLevelMilestone() {
  if (state !== 'playing') return;
  const target = LEVELS[level].target;
  const pct = score / target;

  if (!milestone80 && pct >= 0.8) {
    milestone80 = true;
    triggerMilestoneEffect(80);
  } else if (!milestone40 && pct >= 0.4) {
    milestone40 = true;
    triggerMilestoneEffect(40);
  }
}

/** 触发里程碑特效：文字从右滑入扩大 + 屏幕闪光 + 音效 */
function triggerMilestoneEffect(threshold) {
  const is80 = threshold >= 80;
  const color = is80 ? '#ffaa00' : currentTheme.player.accentColor;
  const juiceColor = is80 ? '#ff8800' : '#ffcc44';
  const emoji = is80 ? '💥' : '✨';
  // 动画时间1.5倍：1.6s → 2.4s，移除时间 1700 → 2550ms
  const label = '关卡进度' + threshold + '%';

  // 1. 里程碑音效
  if (typeof playMilestoneSound === 'function') playMilestoneSound(threshold);

  // 2. 屏幕边缘闪光
  triggerScreenEdgeFlash(juiceColor + '80');

  // 3. 文字动画（从右侧滑入扩大再消散）
  addJuicyText(W * 0.5, CY, emoji + ' ' + label, color, juiceColor, is80);

  // 4. 屏幕边缘彩色边框
  screenFlash = is80 ? 1.0 : 0.7;
}

/** 果汁飞溅文字：从右滑入 → 扩大 → 慢慢消散 */
function addJuicyText(x, y, text, color, juiceColor, isBig) {
  const id = 'juicyStyle';
  if (!document.getElementById(id)) {
    const s = document.createElement('style');
    s.id = id;
    s.textContent = [
      '@keyframes juicyIn {',
      '  0%  { transform:translate(160px,0) scale(0.4); opacity:0; }',
      '  30% { transform:translate(0,0)    scale(1.3);  opacity:1; }',
      '  55% { transform:translate(0,0)    scale(1);    opacity:1; }',
      '  100%{ transform:translate(-30px,0) scale(0.8); opacity:0; }',
      '}',
      '@keyframes juicyGlow {',
      '  0%,100%{ text-shadow:0 0 20px var(--jc),0 0 40px var(--jc); }',
      '  50%  { text-shadow:0 0 30px var(--jc),0 0 60px var(--jo); }',
      '}',
    ].join('');
    document.head.appendChild(s);
  }

  const el = document.createElement('div');
  el.textContent = text;
  el.style.cssText = [
    `position:fixed;left:${x}px;top:${y}px;transform:translate(-50%,-50%);`,
    `font-size:${isBig ? '52px' : '42px'};font-weight:900;`,
    `font-family:'Arial Black','Microsoft YaHei',sans-serif;`,
    `color:${color};`,
    `--jc:${color};--jo:${juiceColor};`,
    `text-shadow:0 0 20px ${color},0 0 40px ${juiceColor};`,
    `pointer-events:none;z-index:9999;white-space:nowrap;`,
    `animation:juicyIn 2.4s cubic-bezier(0.22,1,0.36,1) forwards,`,
    `           juicyGlow ${isBig ? '0.45s' : '0.6s'} ease-in-out infinite;`,
  ].join('');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2550);
}



/** 主题通关庆祝效果 */
function createThemeClearCelebration(theme, levelNum) {
  // 播放主题通关音效
  if (typeof playAchievementSound === 'function') playAchievementSound();
  if (typeof playWinSoundEnhanced === 'function') playWinSoundEnhanced();

  // 创建大量彩色粒子
  createStardust('themeClearStardust');
  createFireworks('themeClearFireworks');

  // 屏幕边框主题色闪光
  triggerScreenEdgeFlash(theme.player.accentColor + 'a0');

  // 显示主题通关提示
  const msg = document.createElement('div');
  msg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    text-shadow: 0 0 30px ${theme.player.accentColor};
    z-index: 1000;
    pointer-events: none;
    animation: themeClearPop 2s ease-out forwards;
  `;
  msg.textContent = theme.emoji + ' ' + theme.name + ' 通关！';
  document.body.appendChild(msg);

  // 创建样式动画
  if (!document.getElementById('themeClearStyle')) {
    const style = document.createElement('style');
    style.id = 'themeClearStyle';
    style.textContent = `
      @keyframes themeClearPop {
        0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
        20% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
        40% { transform: translate(-50%, -50%) scale(1); }
        80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  // 移除提示
  setTimeout(() => {
    msg.remove();
  }, 2000);

  // 显示成就提示
  const themeAch = {
    icon: theme.emoji,
    name: theme.name + ' 通关',
    desc: '成功通关第' + levelNum + '关！'
  };
  achQueue.push(themeAch);
  if (!achShowing) showNextAch();
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

    // 海风系统更新
    updateWind(dt);

    // 生成水果
    spawnTimer += dt * 1000;
    if (spawnTimer >= lvl.spawnInterval) {
      spawnTimer -= lvl.spawnInterval;
      spawnProjectile();
      if (Math.random() < 0.3) spawnProjectile();
    }

    // 道具掉落生成（前10关更频繁）
    itemSpawnTimer += dt * 1000;
    const spawnInterval = level < 10 ? ITEM_SPAWN_INTERVAL_EARLY : ITEM_SPAWN_INTERVAL;
    const dropChance = level < 10 ? ITEM_DROP_CHANCE_EARLY : ITEM_DROP_CHANCE;
    if (itemSpawnTimer >= spawnInterval) {
      itemSpawnTimer -= spawnInterval;
      if (Math.random() < dropChance) {
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

    // 磁铁效果：大范围强吸附水果
    if (activeEffects.magnet.active) {
      const magnetRange = 350; // 增强：200 -> 350
      const magnetStrength = 800; // 增强：500 -> 800
      projectiles.forEach(p => {
        if (p.eaten || p.isBomb) return;
        const d = dist(p.x, p.y, h.x, h.y);
        if (d < magnetRange && d > 1) {
          const force = (1 - d / magnetRange) * magnetStrength;
          const ax = (h.x - p.x) / d * force;
          const ay = (h.y - p.y) / d * force;
          p.vx += ax * dt;
          p.vy += ay * dt;
        }
      });
    }

    // 透视标记效果：显示水果掉落轨迹预测
    if (activeEffects.radar.active) {
      projectiles.forEach(p => {
        if (p.eaten || p.isBomb) return;
        // 预测水果落点（基于当前速度和方向）
        const predictTime = 1.5; // 预测1.5秒后的位置
        const predX = p.x + p.vx * predictTime;
        const predY = p.y + p.vy * predictTime;

        ctx.save();
        ctx.globalAlpha = 0.6 + Math.sin(performance.now() / 200) * 0.2;
        ctx.strokeStyle = p.def.score >= 15 ? '#ff6b6b' : p.def.score >= 10 ? '#ffd700' : '#a8e063';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(predX, predY, p.def.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // 绘制预测轨迹线
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(predX, predY);
        ctx.stroke();
        ctx.restore();
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
      // 海风影响（所有方向）
      if (windState.active) {
        p.x += windState.vx * dt;
        p.y += windState.vy * dt;
      }
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
          // 9档连击倍率（新增2连击、5连击档位）
          if (combo >= 31)       pts = Math.round(pts * 3.0);
          else if (combo >= 22) pts = Math.round(pts * 2.5);
          else if (combo >= 17) pts = Math.round(pts * 2.2);
          else if (combo >= 13) pts = Math.round(pts * 2.0);
          else if (combo >= 10) pts = Math.round(pts * 1.8);
          else if (combo >= 7)  pts = Math.round(pts * 1.6);
          else if (combo >= 5)  pts = Math.round(pts * 1.5);
          else if (combo >= 3)  pts = Math.round(pts * 1.3);
          else if (combo >= 2)  pts = Math.round(pts * 1.2);
          if (activeEffects.double.active) pts *= 2;
          score += pts;
          stats.roundScore = score;
          // 关卡里程碑检测（40% / 80%）
          checkLevelMilestone();
          stats.roundFruits[p.def.name] = (stats.roundFruits[p.def.name] || 0) + 1;
          stats.roundTotalFruits++;
          document.getElementById('scoreVal').textContent = score;
          playEatSound(p.def, combo >= 3);

          // 高分水果特效增强（≥12分）
          const isHighScore = pts >= 12;
          if (isHighScore) {
            // 高分水果：添加爆开 emoji 和金色光晕
            spawnParticles(h.x, h.y, '#ffd700', 25, true);
            spawnParticles(h.x, h.y, '#fff', 15, false);
            addFloatingText(h.x - 30, h.y - 50, '💥', '#ffd700');
            // 触发屏幕边缘金色闪光
            triggerScreenEdgeFlash('rgba(255,215,0,0.3)');
            // 播放高分音效
            if (typeof playHighScoreSound === 'function') playHighScoreSound();
          } else {
            spawnParticles(h.x, h.y, '#fff', 16, false);
          }

          const lbl = combo >= 2 ? ('+' + pts + ' x' + combo + '连击！') : ('+' + pts);
          // 根据连击档位调整颜色
          let comboColor = '#ffd700';
          if (combo >= 31) comboColor = '#ff3030';      // 红色-最高档
          else if (combo >= 22) comboColor = '#ff6600';  // 橙色
          else if (combo >= 17) comboColor = '#ff8800';  // 橙黄
          else if (combo >= 13) comboColor = '#ffaa00';  // 黄橙
          else if (combo >= 10) comboColor = '#ffcc00';  // 亮黄
          else if (combo >= 7) comboColor = '#ffdd33';   // 金黄
          else if (combo >= 5) comboColor = '#ffee66';   // 浅金
          addFloatingText(h.x - 20, h.y - 20, lbl, combo >= 2 ? comboColor : currentTheme.player.accentColor);

          // 连击里程碑检测
          checkComboMilestone(combo);

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
      if (windState.active) {
        d.x += windState.vx * dt;
        d.y += windState.vy * dt;
      }
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

  // 海风特效渲染
  if (windState.active && state === 'playing') {
    const str = windState.strength;
    const speed = windBaseSpeed(str);
    const norm = Math.sqrt(windState.vx * windState.vx + windState.vy * windState.vy) / speed;

    // === 风迹粒子（漂浮物）===
    ctx.save();
    windState.streaks.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.font = p.size + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emoji, 0, 0);
      ctx.restore();
    });
    ctx.restore();

    // === 边缘风迹拖尾线 ===
    ctx.save();
    ctx.strokeStyle = 'rgba(136,221,255,0.18)';
    ctx.lineWidth = 1;
    const t = performance.now() / 1000;
    const streakLen = 20 + norm * 40;
    for (let i = 0; i < 12; i++) {
      const offset = ((t * 80 + i * 60) % H);
      ctx.globalAlpha = 0.15 + norm * 0.15;
      ctx.beginPath();
      ctx.moveTo(0, offset);
      ctx.lineTo(windState.vx > 0 ? streakLen : (windState.vx < 0 ? -streakLen : 0), offset);
      ctx.stroke();
    }
    ctx.restore();

    // === 方向指示箭头（中心指向）===
    if (norm > 0.1) {
      ctx.save();
      ctx.translate(CX, CY);
      const angle = Math.atan2(windState.vy, windState.vx);
      ctx.rotate(angle);
      ctx.globalAlpha = 0.12 + norm * 0.1;
      ctx.fillStyle = '#88ddff';
      ctx.beginPath();
      ctx.moveTo(40, 0);
      ctx.lineTo(-10, -8);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-10, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // === 右上角风力 HUD ===
    const dirIcon = windState.dir === 'N' ? '↑' : windState.dir === 'S' ? '↓' : windState.dir === 'E' ? '→' : '←';
    const dirLabel = windState.dir === 'N' ? '北风' : windState.dir === 'S' ? '南风' : windState.dir === 'E' ? '东风' : '西风';
    const windColors = ['#88ddff', '#66c2ff', '#3399ff'];
    const windLabels = ['微风', '中风', '强风'];

    ctx.save();
    ctx.globalAlpha = 0.85;
    // 背景条
    ctx.fillStyle = 'rgba(0,20,50,0.75)';
    ctx.fillRect(W - 120, 8, 110, 36);
    ctx.strokeStyle = 'rgba(136,221,255,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(W - 120, 8, 110, 36);

    // 方向文字
    ctx.fillStyle = windColors[str - 1];
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(dirIcon + ' ' + dirLabel, W - 112, 20);

    // 风力等级
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#aaddff';
    ctx.fillText(windLabels[str - 1], W - 112, 38);
    ctx.restore();
  }

  // 磁铁效果范围指示（大范围）
  if (activeEffects.magnet.active && state === 'playing') {
    const h = headPos();
    const magnetRatio = activeEffects.magnet.timer / 6000;
    ctx.save();
    ctx.beginPath();
    ctx.arc(h.x, h.y, 350, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(59,130,246,' + (0.15 + Math.sin(performance.now() / 300) * 0.1) + ')';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
    const mg = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, 350);
    mg.addColorStop(0, 'rgba(59,130,246,' + (0.08 * magnetRatio) + ')');
    mg.addColorStop(1, 'rgba(59,130,246,0)');
    ctx.fillStyle = mg;
    ctx.fill();
    ctx.restore();
  }

  // 透视标记效果指示
  if (activeEffects.radar.active && state === 'playing') {
    const h = headPos();
    const radarRatio = activeEffects.radar.timer / 5000;
    ctx.save();
    ctx.globalAlpha = radarRatio * (0.5 + Math.sin(performance.now() / 150) * 0.3);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(h.x, h.y, 280, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绘制扫描线效果
    const angle = (performance.now() / 500) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(h.x, h.y);
    ctx.lineTo(h.x + Math.cos(angle) * 280, h.y + Math.sin(angle) * 280);
    ctx.strokeStyle = 'rgba(236,72,153,0.5)';
    ctx.stroke();
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

    // 绘制水果（带颜色底座）
    const fruitColor = 'hsl(' + (currentTheme.bg.accentHue || 320) + ',50%,65%)';
    ctx.beginPath();
    ctx.arc(0, 0, p.def.radius, 0, Math.PI * 2);
    ctx.fillStyle = fruitColor + '60';
    ctx.fill();

    // 绘制水果emoji
    ctx.shadowColor = p.isBomb ? '#ff4400' : currentTheme.player.accentColor;
    ctx.shadowBlur = p.isBomb ? 12 : 6;
    ctx.font = (p.def.radius * 1.7) + 'px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.def.emoji, 0, 0);

    // 绘制炸弹效果（红色闪烁边框）
    if (p.isBomb) {
      ctx.beginPath();
      ctx.arc(0, 0, p.def.radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,68,68,' + (0.5 + Math.sin(performance.now() / 100) * 0.3) + ')';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

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

  // 连击显示（使用HTML元素）
  const comboEl = document.getElementById('comboDisplay');
  if (combo >= 2 && comboTimer > 0 && state === 'playing') {
    // 获取倍率
    let mult = 1.0;
    if (combo >= 31) mult = 3.0;
    else if (combo >= 22) mult = 2.5;
    else if (combo >= 17) mult = 2.2;
    else if (combo >= 13) mult = 2.0;
    else if (combo >= 10) mult = 1.8;
    else if (combo >= 7) mult = 1.6;
    else if (combo >= 5) mult = 1.5;
    else if (combo >= 3) mult = 1.3;
    else if (combo >= 2) mult = 1.2;

    const color = combo >= 31 ? '#ff3030' : combo >= 22 ? '#ff6600' : combo >= 17 ? '#ff8800' : combo >= 13 ? '#ffaa00' : combo >= 10 ? '#ffcc00' : combo >= 7 ? '#ffdd33' : combo >= 5 ? '#ffee66' : '#ffd700';
    const fire = combo >= 31 ? '💥' : combo >= 22 ? '⚡' : combo >= 17 ? '🔥' : combo >= 13 ? '🔥' : combo >= 10 ? '✨' : combo >= 5 ? '✨' : '✨';
    const scale = combo >= 31 ? 1.4 : combo >= 22 ? 1.25 : combo >= 17 ? 1.2 : combo >= 13 ? 1.15 : 1.1;
    comboEl.innerHTML = fire + '<br>' + combo + '连击<br>x' + mult;
    comboEl.style.color = color;
    comboEl.style.fontSize = (18 * scale) + 'px';
    comboEl.style.textShadow = '0 0 20px ' + color + ', 0 0 40px ' + color;
    comboEl.style.opacity = Math.min(1, comboTimer * 2).toString();
    comboEl.style.transform = 'scale(' + (1 + Math.sin(performance.now() / 100) * 0.05) + ')';
  } else {
    comboEl.innerHTML = '';
    comboEl.style.opacity = '0';
  }

  // 活跃效果指示器
  if (state === 'playing') {
    let effectY = 80;
    const effectList = [];
    if (activeEffects.magnet.active) effectList.push({ icon: '🧲', name: '磁铁', timer: activeEffects.magnet.timer, max: 6000, color: '#3b82f6' });
    if (activeEffects.slow.active) effectList.push({ icon: '⏱️', name: '减速', timer: activeEffects.slow.timer, max: 5000, color: '#f59e0b' });
    if (activeEffects.shield.active) effectList.push({ icon: '🛡️', name: '护盾', timer: -1, max: 1, color: '#10b981' });
    if (activeEffects.double.active) effectList.push({ icon: '✖️2', name: '双倍', timer: activeEffects.double.timer, max: 8000, color: '#ef4444' });
    if (activeEffects.radar.active) effectList.push({ icon: '🔮', name: '透视', timer: activeEffects.radar.timer, max: 5000, color: '#ec4899' });

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

// ==================== 关卡选择界面 ====================

/** 从 localStorage 加载进度 */
function loadProgress() {
  try {
    const saved = localStorage.getItem('fc_progress');
    if (saved) {
      const data = JSON.parse(saved);
      passedLevels = data.levels || [];
      levelStars = data.stars || {};
      levelBestScores = data.bestScores || {}; // 最佳成绩
      stats.maxLevelCleared = passedLevels.length > 0 ? Math.max(...passedLevels) : -1;
    } else {
      passedLevels = [];
      levelStars = {};
      levelBestScores = {};
      stats.maxLevelCleared = -1;
    }
  } catch (e) {
    passedLevels = [];
    levelStars = {};
    levelBestScores = {};
    stats.maxLevelCleared = -1;
  }
}

/** 保存进度到 localStorage */
function saveProgress() {
  try {
    localStorage.setItem('fc_progress', JSON.stringify({
      levels: passedLevels,
      stars: levelStars,
      bestScores: levelBestScores
    }));
  } catch (e) {
    console.warn('无法保存进度:', e);
  }
}

/** 标记关卡通关 */
function markLevelPassed(lvlIdx) {
  if (!passedLevels.includes(lvlIdx)) {
    passedLevels.push(lvlIdx);
    passedLevels.sort((a, b) => a - b);
    saveProgress();
    stats.maxLevelCleared = Math.max(...passedLevels);
  }
}

/** 获取关卡解锁状态 */
function getLevelStatus(lvlIdx) {
  // 秘籍：全关解锁
  if (cheatAllLevels) return 'unlocked';
  if (passedLevels.includes(lvlIdx)) return 'passed'; // 已通关
  if (lvlIdx === 0 || passedLevels.includes(lvlIdx - 1)) return 'unlocked'; // 可挑战
  return 'locked'; // 未解锁
}

/** 渲染当前主题的关卡选择界面 */
function renderLevelSelect() {
  const theme = THEMES[currentSelectTheme];

  // 更新主题信息
  document.getElementById('selectThemeEmoji').textContent = theme.emoji;
  document.getElementById('selectThemeName').textContent = theme.name;
  document.getElementById('selectThemePage').textContent = currentSelectTheme + 1;
  document.getElementById('selectThemeTotal').textContent = THEMES.length;
  document.getElementById('selectThemeStory').textContent = theme.story;
  document.getElementById('selectPlayerName').textContent = theme.player.name;
  document.getElementById('selectPlayerDesc').textContent = theme.player.desc;

  // 海风演示（仅柑橘岛显示）
  if (theme.mechanic) {
    document.getElementById('windDemoContainer').style.display = 'block';
    document.getElementById('windDemoLabel').textContent = '🌊 ' + theme.mechanic;
    initWindDemo();
  } else {
    document.getElementById('windDemoContainer').style.display = 'none';
    stopWindDemo();
  }

  // 更新进度显示
  document.getElementById('levelSelectProgress').textContent = '已通关 ' + passedLevels.length + '/50';

  // 渲染关卡卡片
  const grid = document.getElementById('levelCardsGrid');
  grid.innerHTML = '';

  for (let i = theme.startLevel; i <= theme.endLevel; i++) {
    const lvl = LEVELS[i];
    const status = getLevelStatus(i);
    const card = document.createElement('div');
    card.className = 'level-card ' + status;
    card.dataset.level = i;

    const levelNum = i + 1;
    let statusIcon = '';
    if (status === 'passed') statusIcon = '✅';
    else if (status === 'unlocked') statusIcon = '🔓';
    else statusIcon = '🔒';

    // 评级显示（SABCD）和最佳成绩
    let rankHtml = '';
    let scoreHtml = '';
    if (status === 'passed' && levelStars[i]) {
      const s = levelStars[i];
      const ranks = ['D', 'C', 'B', 'A', 'S'];
      const rank = ranks[Math.min(Math.max(s - 1, 0), 4)];
      const rankColors = { S: '#ffd700', A: '#60d060', B: '#4da6ff', C: '#ffa500', D: '#888888' };
      rankHtml = '<span class="level-rank" style="color:' + rankColors[rank] + '">' + rank + '</span>';
      // 显示最佳成绩
      if (levelBestScores[i]) {
        scoreHtml = '<span class="level-best-score">🏆 ' + levelBestScores[i] + '</span>';
      }
    }

    card.innerHTML = '<span class="level-num">' + levelNum + '</span>' +
                     '<span class="level-name">' + lvl.name + '</span>' +
                     rankHtml +
                     scoreHtml +
                     '<span class="level-status-icon">' + statusIcon + '</span>';

    if (status !== 'locked') {
      // 悬停音效
      card.addEventListener('mouseenter', () => {
        if (typeof playHoverSound === 'function') playHoverSound();
      });
      // 点击音效
      card.addEventListener('click', () => {
        if (typeof playClickSound === 'function') playClickSound();
        level = i;
        showLevelPreview();
      });
    }

    grid.appendChild(card);
  }
}

/** 显示关卡选择界面 */
function showLevelSelect() {
  loadProgress();

  // 默认显示最高通关关卡所在的主题
  const maxPassed = stats.maxLevelCleared >= 0 ? stats.maxLevelCleared : 0;
  currentSelectTheme = Math.floor(maxPassed / 10);

  renderLevelSelect();
  showOverlay('select');
}

/** 切换到上一个主题 */
function prevTheme() {
  if (currentSelectTheme > 0) {
    currentSelectTheme--;
    renderLevelSelect();
  }
}

/** 切换到下一个主题 */
function nextTheme() {
  if (currentSelectTheme < THEMES.length - 1) {
    currentSelectTheme++;
    renderLevelSelect();
  }
}

// 关卡选择界面事件绑定
document.getElementById('btnBackToStart').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  backToStart();
});
document.getElementById('btnPrevTheme').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  prevTheme();
});
document.getElementById('btnNextTheme').addEventListener('click', () => {
  if (typeof playClickSound === 'function') playClickSound();
  nextTheme();
});

// ==================== 初始化 & 启动 ====================
initItemBar();
updateItemBarUI();
loadVolumeSettings(); // 加载音量设置

lastTS = performance.now();
requestAnimationFrame(mainLoop);
