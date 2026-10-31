(function () {
  let ffmpeg = null;
  let loading = false;
  let originalClick = null;

  async function loadFFmpeg() {
    if (ffmpeg) return ffmpeg;
    if (loading) {
      while (loading) await new Promise(r => setTimeout(r, 100));
      return ffmpeg;
    }
    loading = true;
    try {
      const { FFmpeg } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js');
      const { toBlobURL } = await import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js');
      const inst = new FFmpeg();
      const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
      await inst.load({
        coreURL: await toBlobURL(base + '/ffmpeg-core.js', 'text/javascript'),
        wasmURL: await toBlobURL(base + '/ffmpeg-core.wasm', 'application/wasm')
      });
      ffmpeg = inst;
      return inst;
    } finally {
      loading = false;
    }
  }

  function toast(msg, type) {
    const n = document.getElementById('toast');
    if (!n) return;
    n.textContent = msg;
    n.className = 'toast show ' + (type || '');
    setTimeout(() => { n.className = 'toast'; }, 3000);
  }

  async function convertToMp4(webmBlob) {
    const ff = await loadFFmpeg();
    toast('Converting to MP4...');
    const input = new Uint8Array(await webmBlob.arrayBuffer());
    await ff.writeFile('in.webm', input);
    await ff.exec(['-i', 'in.webm', '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', 'faststart', 'out.mp4']);
    const data = await ff.readFile('out.mp4');
    await ff.deleteFile('in.webm');
    await ff.deleteFile('out.mp4');
    return new Blob([data.buffer], { type: 'video/mp4' });
  }

  function interceptDownload() {
    if (originalClick) return;
    const btn = document.getElementById('downloadBtn');
    if (!btn) return;

    originalClick = btn.onclick;
    btn.onclick = async function (e) {
      const isImage = document.getElementById('mImg') && document.getElementById('mImg').checked;
      if (isImage || FengACS.getSetting('mp4Record') !== 'on') {
        if (originalClick) return originalClick.call(this, e);
        return;
      }

      e.stopPropagation();
      const url = window.__fengACS_recUrl;
      if (!url) return;

      try {
        btn.disabled = true;
        btn.textContent = 'Converting...';
        const resp = await fetch(url);
        const webm = await resp.blob();
        const mp4 = await convertToMp4(webm);
        const a = document.createElement('a');
        a.href = URL.createObjectURL(mp4);
        a.download = 'recording_' + Date.now() + '.mp4';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        toast('MP4 saved', 'success');
      } catch (err) {
        console.error(err);
        toast('MP4 conversion failed: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Download';
      }
    };
  }

  FengACS.registerExtension({
    id: 'mp4-record',
    file: 'mp4-record.js',
    type: 'hook',
    name: 'MP4 Recording',
    settings: [
      {
        key: 'mp4Record',
        type: 'select',
        label: 'MP4 Recording',
        default: 'off',
        options: [
          { value: 'off', label: 'Off' },
          { value: 'on', label: 'On (WebM → MP4)' }
        ]
      }
    ],
    onFrame: function () {
      interceptDownload();
    }
  });
})();