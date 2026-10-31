(function () {
  let audioCtx = null;
  let currentAudio = null;
  let bound = false;
  let origSpeakRef = null;

  const VOICES = [
    { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓 (Chinese, Female)' },
    { id: 'zh-CN-YunxiNeural', name: '云希 (Chinese, Male)' },
    { id: 'zh-CN-YunjianNeural', name: '云健 (Chinese, Male)' },
    { id: 'zh-CN-XiaoyiNeural', name: '晓伊 (Chinese, Female)' },
    { id: 'en-US-AriaNeural', name: 'Aria (English US, Female)' },
    { id: 'en-US-GuyNeural', name: 'Guy (English US, Male)' },
    { id: 'en-US-JennyNeural', name: 'Jenny (English US, Female)' },
    { id: 'en-GB-SoniaNeural', name: 'Sonia (English UK, Female)' },
    { id: 'en-GB-RyanNeural', name: 'Ryan (English UK, Male)' },
    { id: 'ja-JP-NanamiNeural', name: 'Nanami (Japanese, Female)' },
    { id: 'ja-JP-KeitaNeural', name: 'Keita (Japanese, Male)' },
    { id: 'ko-KR-SunHiNeural', name: 'Sun-Hi (Korean, Female)' },
    { id: 'ko-KR-InJoonNeural', name: 'In-Joon (Korean, Male)' },
    { id: 'fr-FR-DeniseNeural', name: 'Denise (French, Female)' },
    { id: 'fr-FR-HenriNeural', name: 'Henri (French, Male)' },
    { id: 'de-DE-KatjaNeural', name: 'Katja (German, Female)' },
    { id: 'de-DE-ConradNeural', name: 'Conrad (German, Male)' },
    { id: 'es-ES-ElviraNeural', name: 'Elvira (Spanish, Female)' },
    { id: 'es-ES-AlvaroNeural', name: 'Alvaro (Spanish, Male)' },
    { id: 'ru-RU-SvetlanaNeural', name: 'Svetlana (Russian, Female)' },
    { id: 'ru-RU-DmitryNeural', name: 'Dmitry (Russian, Male)' },
    { id: 'pt-BR-FranciscaNeural', name: 'Francisca (Portuguese BR, Female)' },
    { id: 'pt-BR-AntonioNeural', name: 'Antonio (Portuguese BR, Male)' },
    { id: 'it-IT-ElsaNeural', name: 'Elsa (Italian, Female)' },
    { id: 'it-IT-DiegoNeural', name: 'Diego (Italian, Male)' },
    { id: 'ar-SA-ZariyahNeural', name: 'Zariyah (Arabic, Female)' },
    { id: 'ar-SA-HamedNeural', name: 'Hamed (Arabic, Male)' },
    { id: 'hi-IN-SwaraNeural', name: 'Swara (Hindi, Female)' },
    { id: 'hi-IN-MadhurNeural', name: 'Madhur (Hindi, Male)' },
    { id: 'tr-TR-EmelNeural', name: 'Emel (Turkish, Female)' },
    { id: 'tr-TR-AhmetNeural', name: 'Ahmet (Turkish, Male)' },
    { id: 'nl-NL-FennaNeural', name: 'Fenna (Dutch, Female)' },
    { id: 'nl-NL-MaartenNeural', name: 'Maarten (Dutch, Male)' },
    { id: 'pl-PL-ZofiaNeural', name: 'Zofia (Polish, Female)' },
    { id: 'pl-PL-MarekNeural', name: 'Marek (Polish, Male)' },
    { id: 'sv-SE-SofieNeural', name: 'Sofie (Swedish, Female)' },
    { id: 'sv-SE-MattiasNeural', name: 'Mattias (Swedish, Male)' },
    { id: 'da-DK-ChristelNeural', name: 'Christel (Danish, Female)' },
    { id: 'da-DK-JeppeNeural', name: 'Jeppe (Danish, Male)' },
    { id: 'fi-FI-NooraNeural', name: 'Noora (Finnish, Female)' },
    { id: 'fi-FI-HarriNeural', name: 'Harri (Finnish, Male)' },
    { id: 'cs-CZ-VlastaNeural', name: 'Vlasta (Czech, Female)' },
    { id: 'cs-CZ-AntoninNeural', name: 'Antonin (Czech, Male)' },
    { id: 'hu-HU-NoemiNeural', name: 'Noemi (Hungarian, Female)' },
    { id: 'hu-HU-TamasNeural', name: 'Tamas (Hungarian, Male)' },
    { id: 'ro-RO-AlinaNeural', name: 'Alina (Romanian, Female)' },
    { id: 'ro-RO-EmilNeural', name: 'Emil (Romanian, Male)' }
  ];

  function getVoice() {
    return FengACS.getSetting('neuralTtsVoice') || 'zh-CN-XiaoxiaoNeural';
  }

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function showToast(msg, type) {
    const n = document.getElementById('toast');
    if (!n) return;
    n.textContent = msg;
    n.className = 'toast show ' + (type || '');
    setTimeout(() => { n.className = 'toast'; }, 3000);
  }

  function fallbackSpeak(text) {
    if (!origSpeakRef) return;
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN';
      origSpeakRef(u);
    } catch (_) {}
  }

  async function synthesize(text, voiceId) {
    const wsUrl = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const chunks = [];
      let settled = false;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        try { ws.close(); } catch (_) {}
        if (err) reject(err);
        else resolve(new Blob(chunks, { type: 'audio/mpeg' }));
      };

      ws.onopen = () => {
        const ts = new Date().toISOString();
        const config = `X-Timestamp:${ts}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
        ws.send(config);

        const langMatch = voiceId.match(/^([a-z]{2}-[A-Z]{2})/);
        const lang = langMatch ? langMatch[1] : 'en-US';
        const safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${lang}'><voice name='${voiceId}'><prosody rate='+0%' pitch='+0Hz'>${safeText}</prosody></voice></speak>`;
        const ssmlMsg = `X-RequestId:${crypto.randomUUID()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${ts}Z\r\nPath:ssml\r\n\r\n${ssml}`;
        ws.send(ssmlMsg);
      };

      ws.onmessage = async (e) => {
        if (typeof e.data === 'string') {
          if (e.data.includes('Path:turn.end')) finish(null);
          return;
        }
        const buf = await e.data.arrayBuffer();
        const view = new DataView(buf);
        const headerLen = view.getUint16(0);
        if (buf.byteLength > headerLen + 2) {
          chunks.push(new Uint8Array(buf, headerLen + 2));
        }
      };

      ws.onerror = () => finish(new Error('WebSocket error'));
      ws.onclose = () => { if (!settled) finish(null); };
      setTimeout(() => finish(new Error('timeout')), 20000);
    });
  }

  async function speak(text) {
    if (!text || !text.trim()) return;
    ensureAudio();
    if (currentAudio) {
      try { currentAudio.pause(); } catch (_) {}
      currentAudio = null;
    }
    try {
      const blob = await synthesize(text.trim(), getVoice());
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.volume = 1;
      currentAudio = audio;
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error('[neural-tts]', err);
      showToast('Neural TTS failed, fallback to local: ' + err.message, 'error');
      fallbackSpeak(text);
    }
  }

  function hookSpeechSynthesis() {
    if (bound) return;
    if (!window.speechSynthesis) return;
    bound = true;

    origSpeakRef = window.speechSynthesis.speak.bind(window.speechSynthesis);

    window.speechSynthesis.speak = function (utterance) {
      if (FengACS.getSetting('neuralTts') !== 'on') {
        return origSpeakRef(utterance);
      }
      if (utterance && utterance.text) {
        speak(utterance.text);
        return;
      }
      return origSpeakRef(utterance);
    };

    window.neuralSpeak = speak;
    window.__neuralTtsFallback = fallbackSpeak;
  }

  function unlockAudioOnFirstGesture() {
    const unlock = () => {
      ensureAudio();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    document.addEventListener('click', unlock);
    document.addEventListener('keydown', unlock);
    document.addEventListener('touchstart', unlock);
  }

  FengACS.registerExtension({
    id: 'neural-tts',
    file: 'neural-tts.js',
    type: 'hook',
    name: 'Neural TTS (Edge)',
    settings: [
      {
        key: 'neuralTts',
        type: 'select',
        label: 'Neural TTS',
        default: 'off',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On (Edge Neural)' }
        ]
      },
      {
        key: 'neuralTtsVoice',
        type: 'select',
        label: 'Voice',
        default: 'zh-CN-XiaoxiaoNeural',
        options: VOICES.map(v => ({ value: v.id, label: v.name }))
      }
    ],
    onFrame: function () {
      hookSpeechSynthesis();
    }
  });

  unlockAudioOnFirstGesture();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hookSpeechSynthesis);
  } else {
    hookSpeechSynthesis();
  }
})();