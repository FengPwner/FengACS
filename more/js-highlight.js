(function () {
  let bound = false;
  let overlay = null;
  let ta = null;

  const KEYWORDS = new Set([
    'var','let','const','function','return','if','else','for','while','do','switch','case','break','continue',
    'new','typeof','instanceof','in','of','this','class','extends','super','try','catch','finally','throw',
    'delete','void','yield','await','async','import','export','from','default','null','undefined','true','false'
  ]);

  const BUILTINS = new Set([
    'Math','Date','Array','Object','String','Number','Boolean','JSON','RegExp','Map','Set','WeakMap','WeakSet',
    'Promise','Symbol','Error','console','window','document','canvas','ctx','performance','requestAnimationFrame',
    'cancelAnimationFrame','setTimeout','setInterval','clearTimeout','clearInterval','Image','Audio','AudioContext'
  ]);

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function highlight(src) {
    let out = '';
    let i = 0;
    const n = src.length;

    while (i < n) {
      const ch = src[i];
      const rest = src.slice(i);

      // block comment
      if (rest.startsWith('/*')) {
        const end = src.indexOf('*/', i + 2);
        const stop = end === -1 ? n : end + 2;
        out += '<span class="hl-com">' + esc(src.slice(i, stop)) + '</span>';
        i = stop;
        continue;
      }

      // line comment
      if (rest.startsWith('//')) {
        const end = src.indexOf('\n', i);
        const stop = end === -1 ? n : end;
        out += '<span class="hl-com">' + esc(src.slice(i, stop)) + '</span>';
        i = stop;
        continue;
      }

      // string
      if (ch === '"' || ch === "'" || ch === '`') {
        const quote = ch;
        let j = i + 1;
        while (j < n) {
          if (src[j] === '\\') { j += 2; continue; }
          if (src[j] === quote) { j++; break; }
          j++;
        }
        out += '<span class="hl-str">' + esc(src.slice(i, j)) + '</span>';
        i = j;
        continue;
      }

      // number
      if (/[0-9]/.test(ch)) {
        let j = i + 1;
        while (j < n && /[0-9a-fA-FxX._]/.test(src[j])) j++;
        out += '<span class="hl-num">' + esc(src.slice(i, j)) + '</span>';
        i = j;
        continue;
      }

      // identifier
      if (/[A-Za-z_$]/.test(ch)) {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const word = src.slice(i, j);

        if (KEYWORDS.has(word)) {
          out += '<span class="hl-kw">' + word + '</span>';
        } else if (BUILTINS.has(word)) {
          out += '<span class="hl-bi">' + word + '</span>';
        } else if (src[j] === '(') {
          out += '<span class="hl-fn">' + word + '</span>';
        } else {
          out += esc(word);
        }
        i = j;
        continue;
      }

      // punctuation
      if (/[{}()\[\];,.]/.test(ch)) {
        out += '<span class="hl-p">' + esc(ch) + '</span>';
        i++;
        continue;
      }

      if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
        out += '<span class="hl-op">' + esc(ch) + '</span>';
        i++;
        continue;
      }

      out += esc(ch);
      i++;
    }

    return out + '\n';
  }

  function ensureStyle() {
    if (document.getElementById('hl-style')) return;
    const st = document.createElement('style');
    st.id = 'hl-style';
    st.textContent = `
.hl-wrap{position:relative}
.hl-overlay{position:absolute;inset:0;margin:0;padding:16px;font-family:'JetBrains Mono',monospace;font-size:13px;line-height:1.7;tab-size:2;white-space:pre;overflow:hidden;pointer-events:none;color:#c8d6e5;background:transparent;border:none;z-index:1}
.hl-wrap textarea{position:relative;z-index:2;background:transparent!important;color:transparent!important;caret-color:#c8d6e5}
.hl-kw{color:#c678dd}
.hl-str{color:#98c379}
.hl-num{color:#d19a66}
.hl-com{color:#5c6370;font-style:italic}
.hl-fn{color:#61afef}
.hl-bi{color:#e5c07b}
.hl-op{color:#56b6c2}
.hl-p{color:#abb2bf}
`;
    document.head.appendChild(st);
  }

  function buildOverlay() {
    if (!ta) return;
    if (overlay) return;
    ensureStyle();

    const parent = ta.parentNode;
    if (!parent) return;
    if (parent.classList.contains('hl-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'hl-wrap';
    parent.insertBefore(wrap, ta);
    wrap.appendChild(ta);

    overlay = document.createElement('pre');
    overlay.className = 'hl-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    wrap.insertBefore(overlay, ta);

    ta.style.background = 'transparent';
    ta.style.color = 'transparent';
    ta.style.caretColor = '#c8d6e5';
    ta.style.position = 'relative';
    ta.style.zIndex = '2';

    const sync = function () {
      overlay.innerHTML = highlight(ta.value);
      overlay.scrollTop = ta.scrollTop;
      overlay.scrollLeft = ta.scrollLeft;
    };

    ta.addEventListener('input', sync);
    ta.addEventListener('scroll', sync);
    ta.addEventListener('change', sync);
    new MutationObserver(sync).observe(ta, { attributes: true, attributeFilter: ['value'] });

    // 外部程序修改 textarea.value 时同步
    const origDesc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
    Object.defineProperty(ta, 'value', {
      get: function () { return origDesc.get.call(this); },
      set: function (v) { origDesc.set.call(this, v); sync(); }
    });

    sync();
  }

  function destroy() {
    if (!overlay || !ta) return;
    overlay.remove();
    overlay = null;
    ta.style.background = '';
    ta.style.color = '';
    ta.style.caretColor = '';
    ta.style.position = '';
    ta.style.zIndex = '';
    const wrap = ta.parentNode;
    if (wrap && wrap.classList.contains('hl-wrap')) {
      wrap.parentNode.insertBefore(ta, wrap);
      wrap.remove();
    }
  }

  function apply() {
    if (FengACS.getSetting('jsHighlight') === 'on') buildOverlay();
    else destroy();
  }

  FengACS.registerExtension({
    id: 'js-highlight',
    file: 'js-highlight.js',
    type: 'hook',
    name: 'JS Syntax Highlight',
    settings: [
      {
        key: 'jsHighlight',
        type: 'select',
        label: 'JS Syntax Highlight',
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
      ta = document.getElementById('codeEditor');
      if (!ta) return;
      apply();
    }
  });

  FengACS.on('settings', function (info) {
    if (info.key !== 'jsHighlight') return;
    if (!ta) ta = document.getElementById('codeEditor');
    if (!ta) return;
    apply();
  });
})();