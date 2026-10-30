FengACS.registerExtension({
  id: 'theme-bg',
  file: 'theme-bg.js',
  type: 'hook',
  name: 'Background Color',
  settings: [
    { key: 'bgColor', type: 'color', label: 'Background Color', default: '#000000' }
  ],
  onFrame: function (info) {
    if (!info || !info.ctx || !info.canvas) return;
    const color = FengACS.getSetting('bgColor') || '#000000';
    info.ctx.fillStyle = color;
    info.ctx.fillRect(0, 0, info.canvas.width, info.canvas.height);
  }
});