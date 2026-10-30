// FengACS i18n Demo Extension
// A demonstration of multi-language support in animation code.
// Load this via Extensions > i18n.js

const LANGS = {
  en: {
    greeting: 'Hello, World!',
    subtitle: 'Feng-Animation Code Studio',
    footer: 'Press any key to switch language'
  },
  zh: {
    greeting: '你好，世界！',
    subtitle: 'Feng-动画代码工作室',
    footer: '按任意键切换语言'
  },
  ja: {
    greeting: 'こんにちは、世界！',
    subtitle: 'Feng アニメーションコードスタジオ',
    footer: '任意のキーを押して言語を切り替え'
  },
  ko: {
    greeting: '안녕하세요, 세계!',
    subtitle: 'Feng 애니메이션 코드 스튜디오',
    footer: '아무 키나 눌러 언어 전환'
  },
  fr: {
    greeting: 'Bonjour, le monde !',
    subtitle: 'Feng - Studio de Code d\'Animation',
    footer: 'Appuyez sur une touche pour changer de langue'
  },
  de: {
    greeting: 'Hallo, Welt!',
    subtitle: 'Feng Animationscode-Studio',
    footer: 'Beliebige Taste drücken zum Sprachwechsel'
  },
  es: {
    greeting: '¡Hola, Mundo!',
    subtitle: 'Estudio de Código de Animación Feng',
    footer: 'Pulsa cualquier tecla para cambiar idioma'
  },
  ru: {
    greeting: 'Привет, мир!',
    subtitle: 'Feng - Студия анимационного кода',
    footer: 'Нажмите любую клавишу для смены языка'
  }
};

const LANG_ORDER = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru'];
const LANG_NAMES = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  ru: 'Русский'
};

let langIndex = 0;
let keyBound = false;

function currentLang() {
  return LANG_ORDER[langIndex];
}

function cycleLang() {
  langIndex = (langIndex + 1) % LANG_ORDER.length;
}

function bindKeySwitch() {
  if (keyBound) return;
  keyBound = true;
  window.addEventListener('keydown', function (e) {
    if (e.target && e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowRight') {
      cycleLang();
    }
  });
}

function drawCentered(text, y, size, color, weight) {
  ctx.fillStyle = color;
  ctx.font = (weight || '400') + ' ' + size + 'px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, y);
}

function animate() {
  bindKeySwitch();

  const lang = currentLang();
  const strings = LANGS[lang];
  const cx = width / 2;
  const cy = height / 2;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.6);
  g.addColorStop(0, 'rgba(233,69,96,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  const pulse = 0.5 + 0.5 * Math.sin(t * 2);

  ctx.strokeStyle = 'rgba(233,69,96,' + (0.3 + pulse * 0.4) + ')';
  ctx.lineWidth = Math.max(2, height * 0.002);
  ctx.beginPath();
  ctx.arc(cx, cy, Math.min(width, height) * 0.35 + pulse * height * 0.02, 0, Math.PI * 2);
  ctx.stroke();

  const titleSize = Math.floor(height * 0.11);
  const subSize = Math.floor(height * 0.045);
  const footSize = Math.floor(height * 0.028);
  const badgeSize = Math.floor(height * 0.032);

  drawCentered(strings.greeting, cy - height * 0.08, titleSize, '#e94560', '700');
  drawCentered(strings.subtitle, cy + height * 0.05, subSize, '#c8d6e5', '400');

  ctx.fillStyle = 'rgba(0,184,148,0.15)';
  const bw = width * 0.22;
  const bh = height * 0.06;
  const bx = cx - bw / 2;
  const by = cy + height * 0.13;
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#00b894';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);

  ctx.fillStyle = '#00b894';
  ctx.font = '600 ' + badgeSize + 'px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(LANG_NAMES[lang] + '  (' + (langIndex + 1) + '/' + LANG_ORDER.length + ')', cx, by + bh / 2);

  drawCentered(strings.footer, height * 0.9, footSize, '#666', '400');

  const dotY = height * 0.85;
  const dotSpacing = width * 0.025;
  const totalW = dotSpacing * (LANG_ORDER.length - 1);
  const startX = cx - totalW / 2;
  for (let i = 0; i < LANG_ORDER.length; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * dotSpacing, dotY, Math.max(3, height * 0.006), 0, Math.PI * 2);
    ctx.fillStyle = i === langIndex ? '#e94560' : '#333';
    ctx.fill();
  }

  const tSize = Math.floor(height * 0.025);
  ctx.fillStyle = '#444';
  ctx.font = '400 ' + tSize + 'px monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('t = ' + t.toFixed(2) + 's', width - width * 0.02, height - height * 0.02);
}