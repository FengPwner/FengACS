(function () {
  let bound = false;
  let audioCtx = null;

  function hookAudioContext() {
    if (window.AudioContext && !window.AudioContext.__fengacsWav) {
      const OrigAC = window.AudioContext;
      function HijackedAC(opts) {
        const ctx = new OrigAC(opts);
        window.__fengACS_audioCtx = ctx;
        return ctx;
      }
      HijackedAC.prototype = OrigAC.prototype;
      HijackedAC.__fengacsWav = true;
      window.AudioContext = HijackedAC;
    }
    if (window.webkitAudioContext && !window.webkitAudioContext.__fengacsWav) {
      const OrigAC = window.webkitAudioContext;
      function HijackedAC(opts) {
        const ctx = new OrigAC(opts);
        window.__fengACS_audioCtx = ctx;
        return ctx;
      }
      HijackedAC.prototype = OrigAC.prototype;
      HijackedAC.__fengacsWav = true;
      window.webkitAudioContext = HijackedAC;
    }
  }

  function ensureCtx() {
    if (window.__fengACS_audioCtx) return window.__fengACS_audioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    window.__fengACS_audioCtx = ctx;
    return ctx;
  }

  function encodeWav(samples, sampleRate) {
    const numChannels = 1;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(offset, str) {
      for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    }

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      view.setInt16(offset, s, true);
      offset += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  async function renderWavFromContext(ctx, duration) {
    const sampleRate = ctx.sampleRate;
    const length = Math.ceil(sampleRate * duration);
    const offline = new OfflineAudioContext(1, length, sampleRate);

    const dest = ctx.destination;
    const stream = dest.stream;

    if (!stream) throw new Error('No audio stream available. Play the animation first.');

    const source = offline.createBufferSource();
    const mediaStream = stream;

    const audioTracks = mediaStream.getAudioTracks();
    if (!audioTracks.length) throw new Error('No audio track in the stream.');

    return new Promise((resolve, reject) => {
      const recorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = async () => {
        try {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const arrayBuf = await blob.arrayBuffer();
          const decodeCtx = new AudioContext();
          const audioBuf = await decodeCtx.decodeAudioData(arrayBuf);
          const samples = audioBuf.getChannelData(0);
          const wavBlob = encodeWav(samples, audioBuf.sampleRate);
          downloadWav(wavBlob);
          decodeCtx.close();
          resolve();
        } catch (err) {
          reject(err);
        }
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, duration * 1000);
    });
  }

  function downloadWav(blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'audio_' + Date.now() + '.wav';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function exportWav() {
    const btn = document.getElementById('wav-download-btn');
    if (!btn) return;

    const ctx = ensureCtx();
    if (!ctx) {
      alert('No AudioContext available. Play the animation first.');
      return;
    }

    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (_) {}
    }

    if (!ctx.destination.stream) {
      alert('No audio stream available. Play the animation first.');
      return;
    }

    const duration = parseFloat(document.getElementById('recMaxDur')?.value) || 5;
    const effectiveDuration = duration > 0 ? duration : 5;

    btn.disabled = true;
    btn.textContent = 'Recording...';

    try {
      await renderWavFromContext(ctx, effectiveDuration);
      btn.textContent = 'WAV Saved';
      setTimeout(() => { btn.textContent = 'Download WAV'; btn.disabled = false; }, 1500);
    } catch (err) {
      console.error(err);
      alert('WAV export failed: ' + err.message);
      btn.textContent = 'Download WAV';
      btn.disabled = false;
    }
  }

  function addButton() {
    if (document.getElementById('wav-download-btn')) return;
    const dlGroup = document.getElementById('downloadBtn')?.parentElement;
    if (!dlGroup) return;

    const btn = document.createElement('button');
    btn.id = 'wav-download-btn';
    btn.className = 'b dl';
    btn.textContent = 'Download WAV';
    btn.style.marginLeft = '6px';
    btn.onclick = exportWav;
    dlGroup.appendChild(btn);
  }

  function injectOnce() {
    if (bound) return;
    bound = true;
    hookAudioContext();
    addButton();
  }

  FengACS.registerExtension({
    id: 'wav-export',
    file: 'wav-export.js',
    type: 'hook',
    name: 'WAV Audio Export',
    onFrame: function () {
      injectOnce();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectOnce);
  } else {
    injectOnce();
  }
})();