(function () {
  let bound = false;
  let capturedCtx = null;
  let captureDest = null;

  function patchAudioContext() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || AC.__fengacsWavPatched) return;

    const origCreateGain = AC.prototype.createGain;
    AC.prototype.createGain = function () {
      const gain = origCreateGain.call(this);
      try {
        if (!capturedCtx || capturedCtx !== this) {
          capturedCtx = this;
          captureDest = this.createMediaStreamDestination();
        }
        gain.connect(captureDest);
      } catch (_) {}
      return gain;
    };

    AC.__fengacsWavPatched = true;
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

    if (!capturedCtx || !captureDest) {
      alert('No audio captured yet. Play the animation first.');
      return;
    }

    if (capturedCtx.state === 'suspended') {
      try { await capturedCtx.resume(); } catch (_) {}
    }

    const duration = parseFloat(document.getElementById('recMaxDur')?.value) || 5;
    const effectiveDuration = duration > 0 ? duration : 5;

    btn.disabled = true;
    btn.textContent = 'Recording...';

    try {
      const stream = captureDest.stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

      const done = new Promise((resolve, reject) => {
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
        recorder.onerror = (e) => reject(e.error);
      });

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, effectiveDuration * 1000);

      await done;
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
    patchAudioContext();
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