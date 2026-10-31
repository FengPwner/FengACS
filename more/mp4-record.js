(function () {
  function showInfoDialog() {
    if (document.getElementById('mp4-info-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'mp4-info-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10002;display:flex;align-items:center;justify-content:center;padding:20px';

    const box = document.createElement('div');
    box.style.cssText = 'background:#111128;border:2px solid #e94560;padding:24px;max-width:560px;width:100%;max-height:80vh;overflow-y:auto;color:#ccc;font-size:13px;line-height:1.8';

    const title = document.createElement('div');
    title.textContent = 'MP4 Recording — Not Available';
    title.style.cssText = 'color:#e94560;font-size:16px;font-weight:700;margin-bottom:14px';

    const body = document.createElement('div');
    body.innerHTML = [
      '<p style="margin-bottom:10px">MP4 recording is not supported as an offline feature in the current architecture.</p>',
      '<p style="margin-bottom:10px">The browser does not ship an MP4 (H.264) encoder by default. MediaRecorder can only produce WebM in most Chromium builds. Converting WebM to MP4 in the browser requires ffmpeg.wasm, which needs a ~25MB core download from a CDN and cannot be bundled into a single extension file.</p>',
      '<p style="margin-bottom:10px">Therefore, WebM remains the default and only recording format in FengACS.</p>',
      '<p style="margin-bottom:10px"><b style="color:#e0e0e0">If your target software requires MP4:</b></p>',
      '<ul style="margin:0 0 10px 20px;padding:0">',
      '<li style="margin-bottom:6px">Record as WebM in FengACS.</li>',
      '<li style="margin-bottom:6px">Convert the WebM file to MP4 with a desktop tool such as HandBrake, uTools file converter, or a local FFmpeg build.</li>',
      '<li>This is reliable and fully offline on your side.</li>',
      '</ul>',
      '<p style="margin-bottom:10px"><b style="color:#e0e0e0">Check native MP4 support in your browser:</b></p>',
      '<p style="margin-bottom:10px;background:#0a0a15;padding:8px 10px;font-family:monospace;font-size:12px;color:#00b894;border-left:3px solid #00b894">MediaRecorder.isTypeSupported(\'video/mp4;codecs=avc1\')</p>',
      '<p style="margin-bottom:10px">If it returns <b style="color:#00b894">true</b>, your browser can record MP4 natively and you can request it directly in the recording settings.</p>',
      '<p>If it returns <b style="color:#e74c3c">false</b>, native MP4 is not available and desktop conversion is recommended.</p>'
    ].join('');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;margin-top:18px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Got it';
    closeBtn.style.cssText = 'padding:6px 18px;border:none;cursor:pointer;font-size:12px;font-weight:600;background:#e94560;color:#fff';
    closeBtn.onclick = function () { overlay.remove(); };

    actions.appendChild(closeBtn);
    box.appendChild(title);
    box.appendChild(body);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.remove();
    });

    const onEsc = function (e) {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', onEsc);
      }
    };
    document.addEventListener('keydown', onEsc);
  }

  FengACS.registerExtension({
    id: 'mp4-info',
    file: 'mp4-info.js',
    type: 'hook',
    name: 'MP4 Info',
    onFrame: function () {
      showInfoDialog();
    }
  });
})();