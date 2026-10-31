(function () {
  let ctx = null;
  let bound = false;
  let counter = 0;

  const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const TYPES = ['sine', 'triangle', 'square', 'sawtooth'];

  function ensureAudio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function playClick() {
    const ac = ensureAudio();
    if (!ac) return;

    const idx = counter++ % SCALE.length;
    const baseFreq = SCALE[idx];
    const type = TYPES[(idx + Math.floor(counter / SCALE.length)) % TYPES.length];
    const now = ac.currentTime;
    const dur = 0.12 + Math.random() * 0.08;

    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(baseFreq * 2, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.04);

    const peak = 0.08 + Math.random() * 0.04;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  FengACS.registerExtension({
    id: 'click-sound',
    file: 'click-sound.js',
    type: 'hook',
    name: 'Click Sound',
    settings: [
      {
        key: 'clickSound',
        type: 'select',
        label: 'Click Sound',
        default: 'off',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On' }
        ]
      }
    ],
    onFrame: function () {
      if (bound) return;
      bound = true;

      document.addEventListener('click', function () {
        if (FengACS.getSetting('clickSound') !== 'on') return;
        playClick();
      }, true);
    }
  });
})();