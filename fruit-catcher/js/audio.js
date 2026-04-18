/* ==========================================================
   水果吃货 - 音效系统
   所有 Web Audio API 合成音效
   ========================================================== */

let audioCtx = null;

/** 确保 AudioContext 已初始化 */
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

/** 创建白噪声缓冲区 */
function createNoiseBuffer(dur) {
  const ac = audioCtx;
  const len = ac.sampleRate * dur;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

/* ---- 吃水果音效 ---- */
function playEatSound(fruitDef, isCombo) {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const n = fruitDef.name;

  if (n === '蓝莓') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(1400, now);
    o.frequency.exponentialRampToValueAtTime(1800, now + 0.02);
    o.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.4, now + 0.008);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.start(now); o.stop(now + 0.15);
  }
  else if (n === '草莓') {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type = 'sine';
    o.frequency.setValueAtTime(600, now);
    o.frequency.exponentialRampToValueAtTime(1100, now + 0.04);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    o.start(now); o.stop(now + 0.2);
    const o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.connect(g2); g2.connect(ac.destination); o2.type = 'triangle';
    o2.frequency.setValueAtTime(900, now + 0.06);
    o2.frequency.exponentialRampToValueAtTime(1300, now + 0.1);
    g2.gain.setValueAtTime(0, now + 0.06);
    g2.gain.linearRampToValueAtTime(0.25, now + 0.07);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    o2.start(now + 0.06); o2.stop(now + 0.2);
  }
  else if (n === '葡萄') {
    const ns = ac.createBufferSource();
    ns.buffer = createNoiseBuffer(0.2);
    const f = ac.createBiquadFilter(), g = ac.createGain();
    ns.connect(f); f.connect(g); g.connect(ac.destination);
    f.type = 'bandpass';
    f.frequency.setValueAtTime(2000, now);
    f.frequency.exponentialRampToValueAtTime(600, now + 0.15);
    f.Q.value = 1.5;
    g.gain.setValueAtTime(0.4, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    ns.start(now); ns.stop(now + 0.22);
  }
  else if (n === '苹果') {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.connect(f); f.connect(g); g.connect(ac.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, now);
    o.frequency.exponentialRampToValueAtTime(1200, now + 0.015);
    o.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    f.type = 'highpass'; f.frequency.value = 400;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.45, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    o.start(now); o.stop(now + 0.12);
    const o2 = ac.createOscillator(), f2 = ac.createBiquadFilter(), g2 = ac.createGain();
    o2.connect(f2); f2.connect(g2); g2.connect(ac.destination);
    o2.type = 'square';
    o2.frequency.setValueAtTime(800, now + 0.04);
    o2.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    f2.type = 'bandpass'; f2.frequency.value = 600; f2.Q.value = 2;
    g2.gain.setValueAtTime(0, now + 0.04);
    g2.gain.linearRampToValueAtTime(0.3, now + 0.045);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    o2.start(now + 0.04); o2.stop(now + 0.16);
  }
  else if (n === '橙子') {
    const ns = ac.createBufferSource();
    ns.buffer = createNoiseBuffer(0.25);
    const f = ac.createBiquadFilter(), g = ac.createGain();
    ns.connect(f); f.connect(g); g.connect(ac.destination);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3000, now);
    f.frequency.exponentialRampToValueAtTime(400, now + 0.15);
    f.Q.value = 5;
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    ns.start(now); ns.stop(now + 0.28);
  }
  else if (n === '西瓜') {
    const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.connect(f); f.connect(g); g.connect(ac.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(120, now);
    o.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    o.frequency.exponentialRampToValueAtTime(60, now + 0.35);
    f.type = 'lowpass'; f.frequency.value = 300;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.5, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    o.start(now); o.stop(now + 0.45);
    const o2 = ac.createOscillator(), f2 = ac.createBiquadFilter(), g2 = ac.createGain();
    o2.connect(f2); f2.connect(g2); g2.connect(ac.destination);
    o2.type = 'sawtooth';
    o2.frequency.setValueAtTime(200, now + 0.03);
    o2.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    f2.type = 'highpass'; f2.frequency.value = 80;
    g2.gain.setValueAtTime(0, now + 0.03);
    g2.gain.linearRampToValueAtTime(0.35, now + 0.04);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    o2.start(now + 0.03); o2.stop(now + 0.22);
  }

  // Combo 和声
  if (isCombo) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type = 'sine';
    const bf = fruitDef.weight < 1 ? 1200 : fruitDef.weight < 3 ? 600 : 300;
    o.frequency.setValueAtTime(bf, now + 0.04);
    o.frequency.exponentialRampToValueAtTime(bf * 1.8, now + 0.18);
    g.gain.setValueAtTime(0, now + 0.04);
    g.gain.linearRampToValueAtTime(0.2, now + 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o.start(now + 0.04); o.stop(now + 0.28);
  }
}

/** 炸弹爆炸音效 */
function playBombSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(150, now);
  o.frequency.exponentialRampToValueAtTime(30, now + 0.3);
  g.gain.setValueAtTime(0.5, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  o.start(now); o.stop(now + 0.45);
  const ns = ac.createBufferSource();
  ns.buffer = createNoiseBuffer(0.3);
  const f = ac.createBiquadFilter(), g2 = ac.createGain();
  ns.connect(f); f.connect(g2); g2.connect(ac.destination);
  f.type = 'lowpass'; f.frequency.value = 800;
  g2.gain.setValueAtTime(0.6, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  ns.start(now); ns.stop(now + 0.4);
}

/** 道具拾取音效 */
function playItemPickupSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  [880, 1100, 1320].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = now + i * 0.06;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(t); o.stop(t + 0.18);
  });
}

/** 道具使用音效 */
function playItemUseSound(itemId) {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const freqMap = {
    magnet: [440, 554, 659],
    slow: [660, 523, 440],
    shield: [523, 659, 784],
    double: [784, 988, 1175],
    clearbomb: [330, 220, 147],
    freeze: [1175, 988, 784],
  };
  const freqs = freqMap[itemId] || [660, 880];
  freqs.forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = itemId === 'freeze' ? 'triangle' : (itemId === 'clearbomb' ? 'sawtooth' : 'sine');
    const t = now + i * 0.07;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.start(t); o.stop(t + 0.25);
  });
}

/** 炸弹清除音效 */
function playBombClearSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const ns = ac.createBufferSource();
  ns.buffer = createNoiseBuffer(0.5);
  const f = ac.createBiquadFilter(), g = ac.createGain();
  ns.connect(f); f.connect(g); g.connect(ac.destination);
  f.type = 'lowpass'; f.frequency.setValueAtTime(2000, now); f.frequency.exponentialRampToValueAtTime(200, now + 0.4);
  g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  ns.start(now); ns.stop(now + 0.55);
  const o = ac.createOscillator(), g2 = ac.createGain();
  o.connect(g2); g2.connect(ac.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(120, now); o.frequency.exponentialRampToValueAtTime(60, now + 0.3);
  g2.gain.setValueAtTime(0.4, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  o.start(now); o.stop(now + 0.4);
}

/** 护盾挡住炸弹音效 */
function playShieldBlockSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'square';
  o.frequency.setValueAtTime(1200, now);
  o.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.start(now); o.stop(now + 0.18);
  const ns = ac.createBufferSource();
  ns.buffer = createNoiseBuffer(0.1);
  const f = ac.createBiquadFilter(), g2 = ac.createGain();
  ns.connect(f); f.connect(g2); g2.connect(ac.destination);
  f.type = 'highpass'; f.frequency.value = 3000;
  g2.gain.setValueAtTime(0.3, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  ns.start(now); ns.stop(now + 0.12);
}

/** 成就解锁音效 */
function playAchievementSound() {
  ensureAudio();
  const ac = audioCtx;
  const notes = [659, 784, 988, 1319];
  notes.forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = ac.currentTime + i * 0.08;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t); o.stop(t + 0.35);
  });
}

/** 过关音效 */
function playWinSound() {
  ensureAudio();
  const ac = audioCtx;
  [523, 659, 784, 1047].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type = 'sine';
    const t = ac.currentTime + i * 0.13;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t); o.stop(t + 0.3);
  });
}

/** 失败音效 */
function playLoseSound() {
  ensureAudio();
  const ac = audioCtx;
  [330, 277, 220, 185].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination); o.type = 'sawtooth';
    const f = ac.createBiquadFilter();
    o.connect(f); f.connect(g);
    f.type = 'lowpass'; f.frequency.value = 600;
    const t = ac.currentTime + i * 0.18;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.start(t); o.stop(t + 0.4);
  });
}

/** 倒计时音效 */
function playTickSound(secondsLeft) {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const freq = 440 + (10 - secondsLeft) * 84;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = secondsLeft <= 3 ? 'square' : 'sine';
  o.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(secondsLeft <= 3 ? 0.35 : 0.2, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + (secondsLeft <= 3 ? 0.15 : 0.1));
  o.start(now); o.stop(now + 0.2);
  if (secondsLeft <= 3) {
    const o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.connect(g2); g2.connect(ac.destination);
    o2.type = 'sine';
    o2.frequency.setValueAtTime(80, now);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.3, now + 0.02);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    o2.start(now); o2.stop(now + 0.3);
  }
}
