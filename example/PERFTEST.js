let series = null;
let dataPoints = null;
let dataIdx = 0;
const DATA_LEN = 300;

let frameTimes = null;
let ftIdx = 0;
const FT_LEN = 120;

let drawTimes = null;
let dtIdx = 0;
const DT_LEN = 120;

let gcEvents = 0;
let lastHeap = 0;
let maxHeapSeen = 0;

let loopCount = 0;
let lastT = 0;

function animate() {
  const w = width, h = height;
  const cx = w * 0.5, cy = h * 0.5;

  const frameStart = performance.now();
  const realDt = dt * 1000;
  const realFps = realDt > 0 ? 1000 / realDt : 0;

  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  if (series === null) {
    series = [
      { key: 'FPS', hue: 190, width: 2.4, alpha: 0.95 },
      { key: 'FRAME', hue: 280, width: 2.2, alpha: 0.9 },
      { key: 'DRAW', hue: 45, width: 2.0, alpha: 0.9 },
      { key: 'HEAP', hue: 140, width: 1.8, alpha: 0.85 }
    ];
    dataPoints = [];
    for (let s = 0; s < series.length; s++) {
      dataPoints.push(new Float32Array(DATA_LEN));
    }
    frameTimes = new Float32Array(FT_LEN);
    for (let i = 0; i < FT_LEN; i++) frameTimes[i] = 16.7;
    drawTimes = new Float32Array(DT_LEN);
    if (performance.memory) {
      lastHeap = performance.memory.usedJSHeapSize;
    }
  }

  loopCount++;

  if (t < 3) {
    const fadeIn = Math.min(1, t / 0.5);
    const fadeOut = t > 2.5 ? Math.max(0, (3 - t) / 0.5) : 1;
    const alpha = fadeIn * fadeOut;

    const pulse = 1 + Math.sin(t * 6) * 0.04;
    const fontSize = Math.floor(h * 0.16 * pulse);

    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, h * 0.45);
    grad.addColorStop(0, 'rgba(80,220,255,0.9)');
    grad.addColorStop(0.5, 'rgba(40,120,255,0.4)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = alpha;
    ctx.font = 'bold ' + fontSize + 'px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText('PERF TEST', cx + 3, cy + 3);
    ctx.fillStyle = '#a8f0ff';
    ctx.fillText('PERF TEST', cx, cy);

    ctx.globalAlpha = alpha * 0.6;
    ctx.font = 'bold ' + Math.floor(fontSize * 0.22) + 'px monospace';
    ctx.fillStyle = '#4fd0ff';
    ctx.fillText('SYSTEM BENCHMARK', cx, cy + fontSize * 0.85);

    ctx.restore();
  } else {
    frameTimes[ftIdx] = Math.min(200, realDt);
    ftIdx = (ftIdx + 1) % FT_LEN;

    let heapMB = 0;
    if (performance.memory) {
      const hb = performance.memory.usedJSHeapSize;
      if (hb < lastHeap - 1048576) gcEvents++;
      if (hb > maxHeapSeen) maxHeapSeen = hb;
      lastHeap = hb;
      heapMB = hb / 1048576;
    }

    const seriesVals = [
      Math.min(1, realFps / 120),
      Math.min(1, realDt / 50),
      Math.min(1, (drawTimes[(dtIdx + DT_LEN - 1) % DT_LEN] || 0) / 20),
      Math.min(1, heapMB / 512)
    ];

    dataIdx = (dataIdx + 1) % DATA_LEN;
    for (let s = 0; s < series.length; s++) {
      dataPoints[s][dataIdx] = seriesVals[s];
    }

    const gTop = h * 0.08;
    const gBot = h * 0.92;
    const gH = gBot - gTop;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = 'rgba(120,240,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = gTop + (gH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const x = (w / 8) * i;
      ctx.beginPath();
      ctx.moveTo(x, gTop);
      ctx.lineTo(x, gBot);
      ctx.stroke();
    }

    for (let s = 0; s < series.length; s++) {
      const sr = series[s];
      const arr = dataPoints[s];

      ctx.beginPath();
      for (let i = 0; i < DATA_LEN; i++) {
        const idx = (dataIdx + 1 + i) % DATA_LEN;
        const x = (i / (DATA_LEN - 1)) * w;
        const y = gBot - arr[idx] * gH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'hsl(' + sr.hue + ',100%,62%)';
      ctx.globalAlpha = sr.alpha * 0.9;
      ctx.lineWidth = sr.width;
      ctx.stroke();

      ctx.globalAlpha = sr.alpha * 0.15;
      ctx.lineWidth = sr.width * 4;
      ctx.stroke();
    }

    for (let s = 0; s < series.length; s++) {
      const sr = series[s];
      const arr = dataPoints[s];
      const y = gBot - arr[dataIdx] * gH;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'hsl(' + sr.hue + ',100%,75%)';
      ctx.beginPath();
      ctx.arc(w - 1, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(w - 1, y, 9, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const frameEnd = performance.now();
    const drawCost = frameEnd - frameStart;
    drawTimes[dtIdx] = drawCost;
    dtIdx = (dtIdx + 1) % DT_LEN;

    let ftSum = 0, ftMax = 0, ftMin = 9999;
    for (let i = 0; i < FT_LEN; i++) {
      ftSum += frameTimes[i];
      if (frameTimes[i] > ftMax) ftMax = frameTimes[i];
      if (frameTimes[i] < ftMin) ftMin = frameTimes[i];
    }
    const ftAvg = ftSum / FT_LEN;
    const fpsAvg = Math.round(1000 / ftAvg);
    const fpsNow = Math.round(realFps);
    const fpsMin = Math.round(1000 / ftMax);
    const fpsMax = Math.round(1000 / ftMin);

    let dSum = 0, dMax = 0;
    for (let i = 0; i < DT_LEN; i++) {
      dSum += drawTimes[i];
      if (drawTimes[i] > dMax) dMax = drawTimes[i];
    }
    const dAvg = dSum / DT_LEN;

    const cpuEst = Math.min(100, Math.round(dAvg / 16.67 * 100));
    const headroom = Math.max(0, 100 - cpuEst);

    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const fs = Math.max(10, Math.floor(h * 0.019));
    const lh = fs * 1.42;
    const px = w * 0.03;
    let py = h * 0.035;
    ctx.font = 'bold ' + fs + 'px monospace';

    ctx.fillStyle = '#7fffe0';
    ctx.fillText('◆ MEASURED TELEMETRY', px, py);
    py += lh * 1.2;
    ctx.fillStyle = 'rgba(120,240,255,0.25)';
    ctx.fillRect(px, py - lh * 0.15, fs * 22, 1);
    py += lh * 0.4;

    const fpsColor = fpsAvg < 40 ? '#ff7f7f' : (fpsAvg < 52 ? '#ffd67f' : '#7fffb0');
    const rows = [
      ['FPS', fpsAvg + ' avg', fpsColor],
      ['FPNOW', fpsNow, fpsColor],
      ['FPMIN', fpsMin, '#ff7f7f'],
      ['FPMAX', fpsMax, '#7fffb0'],
      ['FRAME', ftAvg.toFixed(2) + 'ms', '#9fd0ff'],
      ['FMAX', ftMax.toFixed(2) + 'ms', '#ff9f9f'],
      ['FMIN', ftMin.toFixed(2) + 'ms', '#9fffb0'],
      ['DRAW', dAvg.toFixed(2) + 'ms', '#ffd67f'],
      ['DMAX', dMax.toFixed(2) + 'ms', '#ffcf7f'],
      ['LOAD', cpuEst + '%', cpuEst > 80 ? '#ff7f7f' : '#7fd8ff'],
      ['HEAD', headroom + '%', '#8cff9f'],
      ['HEAP', heapMB.toFixed(1) + 'MB', '#ffd67f'],
      ['HMAX', (maxHeapSeen / 1048576).toFixed(1) + 'MB', '#ffcf9f'],
      ['GC', gcEvents, '#ffaf7f'],
      ['LOOP', loopCount, '#9fb0ff'],
      ['TIME', t.toFixed(2) + 's', '#9fb0ff']
    ];

    for (let i = 0; i < rows.length; i++) {
      const label = rows[i][0];
      const val = rows[i][1];
      const col = rows[i][2];
      ctx.fillStyle = 'rgba(120,240,255,0.5)';
      ctx.fillText(label, px, py);
      ctx.fillStyle = col;
      ctx.fillText(String(val), px + fs * 4.4, py);
      py += lh;
    }

    ctx.restore();

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const rpx = w * 0.97;
    let rpy = h * 0.035;
    ctx.font = 'bold ' + fs + 'px monospace';

    ctx.fillStyle = '#7fffe0';
    ctx.fillText('FRAME GRAPH ◆', rpx, rpy);
    rpy += lh * 1.1;

    const gw = w * 0.22;
    const gh = fs * 3.2;
    const gx = rpx - gw;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(gx, rpy, gw, gh);
    ctx.strokeStyle = 'rgba(120,240,255,0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(gx, rpy, gw, gh);
    ctx.beginPath();
    for (let i = 0; i < FT_LEN; i++) {
      const idx = (ftIdx + 1 + i) % FT_LEN;
      const v = Math.min(1, frameTimes[idx] / 60);
      const x = gx + (i / (FT_LEN - 1)) * gw;
      const y = rpy + gh - v * gh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#7fd8ff';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    rpy += gh + lh * 0.8;

    ctx.fillStyle = '#7fffe0';
    ctx.fillText('DRAW GRAPH ◆', rpx, rpy);
    rpy += lh * 0.8;

    const dgx = rpx - gw;
    const dgh = fs * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(dgx, rpy, gw, dgh);
    ctx.strokeStyle = 'rgba(255,214,127,0.25)';
    ctx.strokeRect(dgx, rpy, gw, dgh);
    ctx.beginPath();
    for (let i = 0; i < DT_LEN; i++) {
      const idx = (dtIdx + 1 + i) % DT_LEN;
      const v = Math.min(1, drawTimes[idx] / 20);
      const x = dgx + (i / (DT_LEN - 1)) * gw;
      const y = rpy + dgh - v * dgh;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#ffd67f';
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
    rpy += dgh + lh * 0.8;

    ctx.fillStyle = '#7fffe0';
    ctx.fillText('LEGEND ◆', rpx, rpy);
    rpy += lh * 0.85;

    for (let s = 0; s < series.length; s++) {
      const sr = series[s];
      ctx.fillStyle = 'hsl(' + sr.hue + ',100%,62%)';
      ctx.fillRect(rpx - fs * 5, rpy + fs * 0.28, fs * 1.1, fs * 0.55);
      ctx.fillStyle = 'rgba(200,240,255,0.75)';
      ctx.fillText(sr.key, rpx, rpy);
      rpy += lh * 0.95;
    }

    ctx.restore();
  }
}