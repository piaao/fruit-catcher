/* ==========================================================
   水果吃货 - 音效系统
   Web Audio API 合成音效 + 主题 BGM 循环系统
   ========================================================== */

let audioCtx = null;
let bgmGainNode = null;
let bgmOscillators = [];
let bgmPlaying = false;

/** 确保 AudioContext 已初始化 */
function ensureAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    bgmGainNode = audioCtx.createGain();
    bgmGainNode.gain.value = 0.12;
    bgmGainNode.connect(audioCtx.destination);
  }
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

// ==================== BGM 系统 ====================

/** 停止当前BGM */
function stopBGM() {
  bgmOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
  bgmOscillators = [];
  bgmPlaying = false;
}

/** 播放主题BGM */
function playThemeBGM(style) {
  ensureAudio();
  stopBGM();
  bgmPlaying = true;

  const ac = audioCtx;
  const now = ac.currentTime;

  switch (style) {
    case 'pastoral': playPastoralBGM(now, 8); break;   // 8秒小节循环
    case 'ocean':    playOceanBGM(now, 16); break;     // 16秒大循环（海浪节奏完整）
    case 'mystic':   playMysticBGM(now, 8); break;
    case 'jungle':   playJungleBGM(now, 8); break;
    case 'royal':    playRoyalBGM(now, 8); break;
    default:         playPastoralBGM(now, 8); break;
  }
}

// ---- 核果园 BGM：田园风（C大调轻快旋律）----
function playPastoralBGM(now, dur) {
  const ac = audioCtx;
  // 主旋律 C D E F G A B
  const melody = [
    [523, 0], [587, 1], [659, 2], [698, 3],
    [784, 4], [880, 5], [784, 6], [659, 7],
  ];
  // 伴奏和弦
  const chords = [
    [262, 330, 392], // C
    [294, 370, 440], // Dm
    [330, 415, 494], // Em
    [349, 440, 523], // F
    [392, 494, 587], // G
    [349, 440, 523], // F
    [330, 415, 494], // Em
    [262, 330, 392], // C
  ];

  // 旋律音
  melody.forEach(([freq, beat]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'sine';
    const t = now + beat;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.02);
    g.gain.linearRampToValueAtTime(0.1, t + 0.5);
    g.gain.linearRampToValueAtTime(0, t + 0.9);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  // 和弦伴奏
  chords.forEach((chord, i) => {
    chord.forEach(freq => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(bgmGainNode);
      o.type = 'triangle';
      const t = now + i;
      o.frequency.setValueAtTime(freq * 0.5, t);
      g.gain.setValueAtTime(0.06, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.7);
      g.gain.linearRampToValueAtTime(0, t + 0.95);
      o.start(t);
      o.stop(t + dur + 1);
      bgmOscillators.push(o);
    });
  });

  // 循环
  scheduleBGMLoop(dur, () => playPastoralBGM(ac.currentTime, dur));
}

// ---- 柑橘岛 BGM：海风吹拂环境音 ----
// 白噪音 → 带通滤波(风声) + 低频正弦脉冲(海浪节奏) + 远景海鸥泛音
function playOceanBGM(now, dur) {
  const ac = audioCtx;

  // —— 层1：主风声（白噪音 + 带通滤波） ——
  const windBuf = ac.createBuffer(1, ac.sampleRate * 4, ac.sampleRate);
  const wd = windBuf.getChannelData(0);
  for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;

  const windSrc = ac.createBufferSource();
  windSrc.buffer = windBuf;
  windSrc.loop = true;

  const bp1 = ac.createBiquadFilter();
  bp1.type = 'bandpass';
  bp1.frequency.value = 600;
  bp1.Q.value = 0.6;

  const bp2 = ac.createBiquadFilter();
  bp2.type = 'bandpass';
  bp2.frequency.value = 1200;
  bp2.Q.value = 0.4;

  const windGain = ac.createGain();
  windGain.gain.setValueAtTime(0, now);
  windGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
  windGain.gain.setValueAtTime(0.18, now + dur - 1.5);
  windGain.gain.linearRampToValueAtTime(0, now + dur);

  windSrc.connect(bp1); bp1.connect(bp2); bp2.connect(windGain);
  windGain.connect(bgmGainNode);
  windSrc.start(now);
  windSrc.stop(now + dur + 0.5);
  bgmOscillators.push(windSrc);

  // —— 层2：低频海浪脉冲（每 ~3s 一波，共 dur/3 次） ——
  const waveCount = Math.ceil(dur / 3);
  for (let i = 0; i < waveCount; i++) {
    const t = now + i * 3 + Math.random() * 0.4;

    // 海浪冲击（低频正弦 ~55Hz）
    const wo = ac.createOscillator();
    const wg = ac.createGain();
    wo.type = 'sine';
    wo.frequency.setValueAtTime(55, t);
    wo.frequency.linearRampToValueAtTime(40, t + 1.2);
    wg.gain.setValueAtTime(0, t);
    wg.gain.linearRampToValueAtTime(0.22, t + 0.15);
    wg.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    wo.connect(wg); wg.connect(bgmGainNode);
    wo.start(t); wo.stop(t + 2);
    bgmOscillators.push(wo);

    // 海浪回退噪音（白噪音瞬态）
    const rushBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate);
    const rd = rushBuf.getChannelData(0);
    for (let j = 0; j < rd.length; j++) rd[j] = Math.random() * 2 - 1;
    const rushSrc = ac.createBufferSource();
    rushSrc.buffer = rushBuf;
    const rushBP = ac.createBiquadFilter();
    rushBP.type = 'bandpass';
    rushBP.frequency.value = 300;
    rushBP.Q.value = 0.3;
    const rushG = ac.createGain();
    rushG.gain.setValueAtTime(0, t);
    rushG.gain.linearRampToValueAtTime(0.09, t + 0.08);
    rushG.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    rushSrc.connect(rushBP); rushBP.connect(rushG); rushG.connect(bgmGainNode);
    rushSrc.start(t); rushSrc.stop(t + 1.5);
    bgmOscillators.push(rushSrc);
  }

  // —— 层3：远景海鸥泛音（稀疏高频短音） ——
  const gullTimes = [1.2, 4.8, 7.5, 11.0, 14.2];
  gullTimes.forEach(gt => {
    if (gt > dur) return;
    const t = now + gt;
    const go = ac.createOscillator();
    const gg = ac.createGain();
    go.type = 'sine';
    go.frequency.setValueAtTime(1200 + Math.random() * 400, t);
    go.frequency.linearRampToValueAtTime(900 + Math.random() * 300, t + 0.4);
    gg.gain.setValueAtTime(0, t);
    gg.gain.linearRampToValueAtTime(0.04, t + 0.06);
    gg.gain.linearRampToValueAtTime(0.02, t + 0.25);
    gg.gain.linearRampToValueAtTime(0, t + 0.5);
    go.connect(gg); gg.connect(bgmGainNode);
    go.start(t); go.stop(t + 0.6);
    bgmOscillators.push(go);
  });

  scheduleBGMLoop(dur, () => playOceanBGM(ac.currentTime, dur));
}

// ---- 浆果谷 BGM：神秘梦幻风（E小调）----
function playMysticBGM(now, dur) {
  const ac = audioCtx;
  const melody = [
    [659, 0], [587, 1], [494, 2], [440, 3],
    [392, 4], [440, 5], [494, 6], [587, 7],
  ];
  const chords = [
    [330, 392, 494], [294, 349, 440],
    [262, 330, 392], [294, 349, 440],
    [247, 311, 370], [262, 330, 392],
    [294, 349, 440], [330, 392, 494],
  ];

  melody.forEach(([freq, beat]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'sine';
    const t = now + beat;
    o.frequency.setValueAtTime(freq * 0.8, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.1, t + 0.03);
    g.gain.linearRampToValueAtTime(0.06, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  // 钟琴泛音层
  melody.forEach(([freq, beat]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'sine';
    const t = now + beat + 0.05;
    o.frequency.setValueAtTime(freq * 2, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  chords.forEach((chord, i) => {
    chord.forEach(freq => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(bgmGainNode);
      o.type = 'triangle';
      const t = now + i;
      o.frequency.setValueAtTime(freq * 0.5, t);
      g.gain.setValueAtTime(0.04, t);
      g.gain.linearRampToValueAtTime(0.025, t + 0.7);
      g.gain.linearRampToValueAtTime(0, t + 0.95);
      o.start(t);
      o.stop(t + dur + 1);
      bgmOscillators.push(o);
    });
  });

  scheduleBGMLoop(dur, () => playMysticBGM(ac.currentTime, dur));
}

// ---- 热带雨林 BGM：热带活力风（A小调）----
function playJungleBGM(now, dur) {
  const ac = audioCtx;
  const melody = [
    [440, 0], [523, 0.5], [659, 1], [523, 1.5],
    [587, 2], [659, 2.5], [784, 3], [880, 4],
    [784, 4.5], [659, 5], [523, 5.5],
    [587, 6], [523, 6.5], [440, 7],
  ];
  const bass = [220, 220, 175, 196, 165, 175, 220, 220];

  melody.forEach(([freq, beat]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'square';
    const t = now + beat;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.01);
    g.gain.linearRampToValueAtTime(0.05, t + 0.3);
    g.gain.linearRampToValueAtTime(0, t + 0.45);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  // 低音线
  bass.forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'triangle';
    const t = now + i;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.1, t);
    g.gain.linearRampToValueAtTime(0.07, t + 0.7);
    g.gain.linearRampToValueAtTime(0, t + 0.95);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  // 打击乐节奏（噪声脉冲）
  for (let i = 0; i < dur * 2; i++) {
    const ns = ac.createBufferSource();
    ns.buffer = createNoiseBuffer(0.08);
    const f = ac.createBiquadFilter();
    const g = ac.createGain();
    ns.connect(f); f.connect(g); g.connect(bgmGainNode);
    f.type = i % 4 === 0 ? 'lowpass' : 'highpass';
    f.frequency.value = i % 4 === 0 ? 400 : 6000;
    const t = now + i * 0.5;
    g.gain.setValueAtTime(i % 4 === 0 ? 0.1 : 0.03, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    ns.start(t);
    ns.stop(t + 0.1);
    bgmOscillators.push(ns);
  }

  scheduleBGMLoop(dur, () => playJungleBGM(ac.currentTime, dur));
}

// ---- 仁果殿 BGM：皇家史诗风（D小调）----
function playRoyalBGM(now, dur) {
  const ac = audioCtx;
  const melody = [
    [587, 0], [523, 1], [440, 2], [523, 3],
    [587, 4], [659, 5], [784, 5.5], [659, 6],
    [587, 6.5], [523, 7], [440, 7.5],
  ];
  const chords = [
    [294, 349, 440], [262, 330, 392],
    [220, 277, 330], [262, 330, 392],
    [294, 349, 440], [349, 440, 523],
    [294, 349, 440], [262, 330, 392],
  ];

  // 弦乐层
  melody.forEach(([freq, beat]) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'sawtooth';
    const f = ac.createBiquadFilter();
    o.connect(f); f.connect(g);
    f.type = 'lowpass';
    f.frequency.value = 1200;
    const t = now + beat;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.05);
    g.gain.linearRampToValueAtTime(0.06, t + 0.6);
    g.gain.linearRampToValueAtTime(0, t + 0.9);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  // 和弦pad
  chords.forEach((chord, i) => {
    chord.forEach(freq => {
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.connect(g); g.connect(bgmGainNode);
      o.type = 'sine';
      const t = now + i;
      o.frequency.setValueAtTime(freq * 0.5, t);
      g.gain.setValueAtTime(0.06, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.7);
      g.gain.linearRampToValueAtTime(0, t + 0.95);
      o.start(t);
      o.stop(t + dur + 1);
      bgmOscillators.push(o);
    });
  });

  // 铜管点缀
  [587, 784, 1047].forEach((freq, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(bgmGainNode);
    o.type = 'square';
    const f = ac.createBiquadFilter();
    o.connect(f); f.connect(g);
    f.type = 'lowpass';
    f.frequency.value = 2000;
    const t = now + i * 2.67;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.04, t + 0.03);
    g.gain.linearRampToValueAtTime(0.025, t + 0.4);
    g.gain.linearRampToValueAtTime(0, t + 0.6);
    o.start(t);
    o.stop(t + dur + 1);
    bgmOscillators.push(o);
  });

  scheduleBGMLoop(dur, () => playRoyalBGM(ac.currentTime, dur));
}

/** 安排BGM循环 */
let bgmLoopTimer = null;
function scheduleBGMLoop(dur, fn) {
  if (bgmLoopTimer) clearTimeout(bgmLoopTimer);
  bgmLoopTimer = setTimeout(() => {
    if (bgmPlaying) fn();
  }, dur * 1000 - 100);
}

// ==================== 吃水果音效 ====================

/** 通用音效引擎（按音效风格生成） */
function playEatSound(fruitDef, isCombo) {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const style = currentTheme ? currentTheme.soundStyle : 'sweet';

  switch (style) {
    case 'sweet':    playSweetEat(ac, now, fruitDef); break;
    case 'fresh':    playFreshEat(ac, now, fruitDef); break;
    case 'magic':    playMagicEat(ac, now, fruitDef); break;
    case 'tropical': playTropicalEat(ac, now, fruitDef); break;
    case 'royal':    playRoyalEat(ac, now, fruitDef); break;
    default:         playSweetEat(ac, now, fruitDef); break;
  }

  // Combo 和声（通用）
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

// 核果园：甜蜜风
function playSweetEat(ac, now, def) {
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination); o.type = 'sine';
  const baseFreq = 500 + (1 - def.weight / 2.5) * 600;
  o.frequency.setValueAtTime(baseFreq, now);
  o.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.03);
  o.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.12);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.35, now + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.start(now); o.stop(now + 0.18);
}

// 柑橘岛：清新风
function playFreshEat(ac, now, def) {
  const ns = ac.createBufferSource();
  ns.buffer = createNoiseBuffer(0.2);
  const f = ac.createBiquadFilter(), g = ac.createGain();
  ns.connect(f); f.connect(g); g.connect(ac.destination);
  f.type = 'bandpass';
  f.frequency.setValueAtTime(1500 + (1 - def.weight / 2.5) * 2000, now);
  f.frequency.exponentialRampToValueAtTime(400, now + 0.15);
  f.Q.value = 2;
  g.gain.setValueAtTime(0.35, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  ns.start(now); ns.stop(now + 0.22);
}

// 浆果谷：魔法风
function playMagicEat(ac, now, def) {
  const freq = 600 + (1 - def.weight / 2.5) * 800;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination); o.type = 'sine';
  o.frequency.setValueAtTime(freq, now);
  o.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.04);
  o.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.1);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.3, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  o.start(now); o.stop(now + 0.22);
  // 泛音
  const o2 = ac.createOscillator(), g2 = ac.createGain();
  o2.connect(g2); g2.connect(ac.destination); o2.type = 'triangle';
  o2.frequency.setValueAtTime(freq * 1.5, now + 0.05);
  o2.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.15);
  g2.gain.setValueAtTime(0, now + 0.05);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.06);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
  o2.start(now + 0.05); o2.stop(now + 0.22);
}

// 热带雨林：热带打击乐风
function playTropicalEat(ac, now, def) {
  const freq = 300 + (1 - def.weight / 2.5) * 500;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'triangle';
  o.frequency.setValueAtTime(freq, now);
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.1);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.4, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  o.start(now); o.stop(now + 0.18);
  // 噪声层
  const ns = ac.createBufferSource();
  ns.buffer = createNoiseBuffer(0.1);
  const f = ac.createBiquadFilter(), g2 = ac.createGain();
  ns.connect(f); f.connect(g2); g2.connect(ac.destination);
  f.type = 'bandpass'; f.frequency.value = freq * 2; f.Q.value = 3;
  g2.gain.setValueAtTime(0.2, now);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  ns.start(now); ns.stop(now + 0.12);
}

// 仁果殿：皇家质感风
function playRoyalEat(ac, now, def) {
  const freq = 400 + (1 - def.weight / 2.5) * 700;
  // 主音
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sawtooth';
  const f = ac.createBiquadFilter();
  o.connect(f); f.connect(g);
  f.type = 'lowpass'; f.frequency.value = 1500;
  o.frequency.setValueAtTime(freq, now);
  o.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.02);
  o.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.1);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.35, now + 0.005);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  o.start(now); o.stop(now + 0.15);
  // 回声泛音
  const o2 = ac.createOscillator(), g2 = ac.createGain();
  o2.connect(g2); g2.connect(ac.destination); o2.type = 'sine';
  o2.frequency.setValueAtTime(freq * 2, now + 0.06);
  o2.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);
  g2.gain.setValueAtTime(0, now + 0.06);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.08);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  o2.start(now + 0.06); o2.stop(now + 0.35);
}

// ==================== 其他音效（通用） ====================

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
    addtime: [880, 1047, 1319],
  };
  const freqs = freqMap[itemId] || [660, 880];
  freqs.forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = now + i * 0.07;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.start(t); o.stop(t + 0.25);
  });
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

// ==================== 界面转场音效 ====================

/** 按钮点击音效 - 短促的咔哒 */
function playClickSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'square';
  o.frequency.setValueAtTime(800, now);
  o.frequency.exponentialRampToValueAtTime(400, now + 0.05);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  o.start(now); o.stop(now + 0.1);
}

/** 界面出现音效 - 轻柔的升起 */
function playUIShowSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(300, now);
  o.frequency.exponentialRampToValueAtTime(600, now + 0.15);
  g.gain.setValueAtTime(0.12, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  o.start(now); o.stop(now + 0.25);
}

/** 暂停音效 - 幕布拉下 */
function playPauseSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  // 低沉的下降音
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'triangle';
  o.frequency.setValueAtTime(400, now);
  o.frequency.exponentialRampToValueAtTime(100, now + 0.2);
  g.gain.setValueAtTime(0.2, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  o.start(now); o.stop(now + 0.35);
}

/** 恢复音效 - 幕布升起 */
function playResumeSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  // 清脆的上升音
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(200, now);
  o.frequency.exponentialRampToValueAtTime(600, now + 0.15);
  g.gain.setValueAtTime(0.15, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  o.start(now); o.stop(now + 0.25);
}

/** 连击里程碑音效 - 不同等级不同音调 */
function playComboMilestoneSound(comboLevel) {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  // comboLevel: 1=普通, 2=10连击, 3=20连击, 4=30+连击
  const configs = [
    [523, 659],      // 普通连击
    [659, 784, 988], // 10连击
    [784, 988, 1175, 1319], // 20连击
    [988, 1175, 1319, 1568, 1760] // 30+连击
  ];
  const notes = configs[Math.min(comboLevel - 1, 3)];
  notes.forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = now + i * 0.08;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t); o.stop(t + 0.3);
  });
}

/** 高分水果获得音效 */
function playHighScoreSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  // 金币般的叮咚声
  [1319, 1568, 1760, 2093].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = now + i * 0.06;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.start(t); o.stop(t + 0.2);
  });
}

/** 界面按钮悬停音效 - 轻柔提示 */
function playHoverSound() {
  ensureAudio();
  const ac = audioCtx, now = ac.currentTime;
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(1000, now);
  g.gain.setValueAtTime(0.05, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  o.start(now); o.stop(now + 0.08);
}

/** 增强版过关音效 - 带和弦 */
function playWinSoundEnhanced() {
  ensureAudio();
  const ac = audioCtx;
  // 主旋律
  [523, 659, 784, 1047, 1319].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    const t = ac.currentTime + i * 0.12;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t); o.stop(t + 0.35);
  });
  // 和弦伴奏
  [392, 494, 587].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'triangle';
    const t = ac.currentTime + 0.3 + i * 0.05;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t); o.stop(t + 0.45);
  });
}

/** 增强版失败音效 - 更低沉更有冲击力 */
function playLoseSoundEnhanced() {
  ensureAudio();
  const ac = audioCtx;
  [330, 262, 220, 165, 110].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sawtooth';
    const f = ac.createBiquadFilter();
    o.connect(f); f.connect(g);
    f.type = 'lowpass';
    f.frequency.value = 500;
    const t = ac.currentTime + i * 0.15;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.start(t); o.stop(t + 0.45);
  });
}

/** 全通关庆典音效 */
function playClearCelebrationSound() {
  ensureAudio();
  const ac = audioCtx;
  // 胜利号角风格的音效
  const melody = [523, 659, 784, 880, 988, 1047, 1175, 1319, 1568, 1760];
  melody.forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = i < 5 ? 'sine' : 'triangle';
    const t = ac.currentTime + i * 0.1;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(i < 5 ? 0.25 : 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.start(t); o.stop(t + 0.4);
  });
  // 低音和弦
  [262, 330, 392, 523].forEach((freq, i) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'triangle';
    const t = ac.currentTime + 0.5 + i * 0.06;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    o.start(t); o.stop(t + 0.55);
  });
}

/** 里程碑达成音效（40% / 80% 阶段目标）- 敞亮"哈~"满足感 */
function playMilestoneSound(threshold) {
  ensureAudio();
  const ac = audioCtx;
  const is80 = threshold >= 80;
  const now = ac.currentTime;
  const dur = is80 ? 1.35 : 0.9; // 1.5倍于原时长

  // ---- 哈~ 主音：中低频开口音 ----
  const o = ac.createOscillator(), g = ac.createGain();
  o.connect(g); g.connect(ac.destination);
  o.type = 'sine';
  const baseFreq = is80 ? 300 : 360;
  o.frequency.setValueAtTime(baseFreq, now);
  o.frequency.linearRampToValueAtTime(baseFreq * 1.4, now + 0.08); // 开口上扬
  o.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + dur);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.35, now + 0.03);
  g.gain.setValueAtTime(0.35, now + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.start(now); o.stop(now + dur + 0.05);

  // ---- 哈~ 敞亮泛音层：高频谐波增加气流感 ----
  const harmonics = is80
    ? [[2, 0.18], [3, 0.12], [4, 0.08]]
    : [[2, 0.15], [3, 0.1]];
  harmonics.forEach(([mult, vol]) => {
    const o2 = ac.createOscillator(), g2 = ac.createGain();
    o2.connect(g2); g2.connect(ac.destination);
    o2.type = 'sine';
    o2.frequency.setValueAtTime(baseFreq * mult, now);
    o2.frequency.linearRampToValueAtTime(baseFreq * mult * 1.4, now + 0.08);
    o2.frequency.exponentialRampToValueAtTime(baseFreq * mult * 0.8, now + dur);
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(vol, now + 0.05);
    g2.gain.exponentialRampToValueAtTime(0.001, now + dur);
    o2.start(now); o2.stop(now + dur + 0.05);
  });

  // ---- 80%额外：绵长的满足尾音 ----
  if (is80) {
    const o3 = ac.createOscillator(), g3 = ac.createGain();
    o3.connect(g3); g3.connect(ac.destination);
    o3.type = 'triangle';
    o3.frequency.setValueAtTime(600, now + 0.1);
    o3.frequency.exponentialRampToValueAtTime(380, now + dur * 0.9);
    g3.gain.setValueAtTime(0, now + 0.1);
    g3.gain.linearRampToValueAtTime(0.15, now + 0.18);
    g3.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);
    o3.start(now + 0.1); o3.stop(now + dur);
  }
}
