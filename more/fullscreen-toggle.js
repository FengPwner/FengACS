(function () {
  let bound = false;

  FengACS.registerExtension({
    id: 'fullscreen-toggle',
    file: 'fullscreen-toggle.js',
    type: 'hook',
    name: 'Manual Fullscreen',
    settings: [
      { key: 'manualFullscreen', type: 'select', label: 'Manual Fullscreen', default: 'off', options: [
        { value: 'off', label: 'Off' },
        { value: 'on', label: 'On' }
      ] }
    ],
    onFrame: function () {
      if (bound) return;
      bound = true;

      const area = document.getElementById('previewArea');
      if (!area) return;

      area.style.cursor = '';
      area.addEventListener('click', function (e) {
        if (FengACS.getSetting('manualFullscreen') !== 'on') return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'CANVAS' || tag === 'IMG' || e.target === area || e.target.id === 'canvasWrapper') {
          if (!document.fullscreenElement) {
            area.requestFullscreen().catch(function () {});
          } else {
            document.exitFullscreen().catch(function () {});
          }
        }
      });
    }
  });

  FengACS.on('settings', function (info) {
    if (info.key !== 'manualFullscreen') return;
    const area = document.getElementById('previewArea');
    if (area) area.style.cursor = info.value === 'on' ? 'pointer' : '';
  });
})();