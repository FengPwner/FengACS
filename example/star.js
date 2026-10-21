const stars = [];
const shootingStars = [];
const nebulae = [];
let initialized = false;
let bgGrad = null;
let audioCtx = null;
let lastShootingTime = 0;
let ambientStarted = false;

function initAudio() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch (e) { audioCtx = null; }
}

function playChime(freq, dur, vol) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const osc2 = audioCtx.createOscillator();
  const gain2 = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  osc2.type = 'sine';
  osc2.frequency.value = freq * 2;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  gain2.gain.setValueAtTime(0, now);
  gain2.gain.linearRampToValueAtTime(vol * 0.25, now + 0.02);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.8);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc2.connect(gain2);
  gain2.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + dur + 0.1);
  osc2.start(now);
  osc2.stop(now + dur + 0.1);
}

function startAmbient() {
  if (!audioCtx || ambientStarted) return;
  ambientStarted = true;
  const now = audioCtx.currentTime;
  const padFreqs = [110, 164.81, 220, 329.63];
  padFreqs.forEach((f, i) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + i * 0.02;
    lfoGain.gain.value = f * 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    lfo.start(now);
  });
}

function init(width, height) {
  bgGrad = ctx.createLinearGradient(0, 0, 0, height);
  bgGrad.addColorStop(0, '#020010');
  bgGrad.addColorStop(0.35, '#0a0525');
  bgGrad.addColorStop(0.65, '#0d1b3e');
  bgGrad.addColorStop(1, '#061225');

  stars.length = 0;
  for (let i = 0; i < 260; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.6 + 0.3,
      baseA: Math.random() * 0.6 + 0.3,
      speed: Math.random() * 1.5 + 0.4,
      phase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.15 ? 200 + Math.random() * 60 : 40 + Math.random() * 20,
      drift: (Math.random() - 0.5) * 3
    });
  }

  nebulae.length = 0;
  const nebColors = [
    [80, 40, 160],
    [30, 80, 180],
    [140, 50, 160],
    [20, 60, 120]
  ];
  for (let i = 0; i < 4; i++) {
    nebulae.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
      r: Math.random() * 180 + 140,
      color: nebColors[i],
      phase: Math.random() * Math.PI * 2,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.08
    });
  }

  initialized = true;
  if (!audioCtx) initAudio();
}

function spawnShootingStar(width, height) {
  const startX = Math.random() * width * 0.7 + width * 0.15;
  const startY = Math.random() * height * 0.35;
  const angle = Math.PI * 0.22 + Math.random() * 0.18;
  shootingStars.push({
    x: startX,
    y: startY,
    vx: Math.cos(angle) * (380 + Math.random() * 200),
    vy: Math.sin(angle) * (380 + Math.random() * 200),
    life: 1,
    maxLife: 1.4 + Math.random() * 0.6,
    age: 0,
    len: 90 + Math.random() * 70
  });
  if (audioCtx && Math.random() < 0.8) {
    playChime(880 + Math.random() * 400, 0.6, 0.04);
  }
}

function animate() {
  if (!initialized) init(width, height);

  const w = width, h = height;

  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const time = t;

  for (let i = 0; i < nebulae.length; i++) {
    const n = nebulae[i];
    n.x += n.driftX;
    n.y += n.driftY;
    if (n.x < -n.r) n.x = w + n.r;
    if (n.x > w + n.r) n.x = -n.r;
    if (n.y < -n.r) n.y = h + n.r;
    if (n.y > h + n.r) n.y = -n.r;
    const pulse = 0.5 + 0.5 * Math.sin(time * 0.15 + n.phase);
    const radius = n.r * (0.85 + pulse * 0.2);
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, radius);
    const c = n.color;
    grad.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.10 + pulse * 0.05})`);
    grad.addColorStop(0.5, `rgba(${c[0]},${c[1]},${c[2]},${0.04 + pulse * 0.02})`);
    grad.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.x += s.drift * dt;
    s.y += Math.sin(time * 0.1 + s.phase) * 0.05;
    if (s.x < -5) s.x = w + 5;
    if (s.x > w + 5) s.x = -5;
    if (s.y < -5) s.y = h + 5;
    if (s.y > h + 5) s.y = -5;

    const twinkle = 0.5 + 0.5 * Math.sin(time * s.speed + s.phase);
    const alpha = s.baseA * (0.4 + twinkle * 0.6);
    const glowR = s.r * (2.5 + twinkle * 1.5);

    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, glowR);
    if (s.hue > 180) {
      glow.addColorStop(0, `rgba(180,220,255,${alpha * 0.5})`);
      glow.addColorStop(1, 'rgba(180,220,255,0)');
    } else {
      glow.addColorStop(0, `rgba(255,240,200,${alpha * 0.5})`);
      glow.addColorStop(1, 'rgba(255,240,200,0)');
    }
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, glowR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.hue > 180
      ? `rgba(220,235,255,${alpha})`
      : `rgba(255,250,235,${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  if (time - lastShootingTime > 2.2 + Math.random() * 2) {
    lastShootingTime = time;
    spawnShootingStar(w, h);
  }

  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const ss = shootingStars[i];
    ss.age += dt;
    if (ss.age > ss.maxLife) {
      shootingStars.splice(i, 1);
      continue;
    }
    ss.x += ss.vx * dt;
    ss.y += ss.vy * dt;
    const progress = ss.age / ss.maxLife;
    const fade = Math.sin(progress * Math.PI);
    const speed = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
    const tailX = ss.x - (ss.vx / speed) * ss.len;
    const tailY = ss.y - (ss.vy / speed) * ss.len;

    const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
    grad.addColorStop(0, `rgba(180,220,255,0)`);
    grad.addColorStop(0.7, `rgba(200,230,255,${fade * 0.5})`);
    grad.addColorStop(1, `rgba(255,255,255,${fade})`);

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(ss.x, ss.y);
    ctx.stroke();

    const headGlow = ctx.createRadialGradient(ss.x, ss.y, 0, ss.x, ss.y, 12);
    headGlow.addColorStop(0, `rgba(255,255,255,${fade})`);
    headGlow.addColorStop(0.4, `rgba(200,225,255,${fade * 0.4})`);
    headGlow.addColorStop(1, 'rgba(200,225,255,0)');
    ctx.fillStyle = headGlow;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 12, 0, Math.PI * 2);
    ctx.fill();

    if (ss.x > w + 50 || ss.y > h + 50) {
      shootingStars.splice(i, 1);
    }
  }

  if (audioCtx && !ambientStarted && t > 0.5) {
    startAmbient();
  }
  if (audioCtx && t > 1 && Math.random() < 0.008) {
    const notes = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
    playChime(notes[Math.floor(Math.random() * notes.length)], 1.8 + Math.random(), 0.025);
  }
}