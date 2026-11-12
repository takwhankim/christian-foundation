// FCO 페이지 글 직접 편집
// - 모든 방문자: 관리자가 고친 문구를 불러와 페이지에 적용
// - 관리자 로그인 상태: 오른쪽 아래 [✏️ 페이지 편집] 버튼 → 글을 클릭해 고치고 저장
(function () {
  // 페이지 깜빡임 방지: <head>에서 숨겨 둔 화면을 수정 내용 적용 뒤에 보여줌
  const reveal = () => document.documentElement.classList.remove('fco-wait');
  if (!window.FCO?.ready) return reveal();
  const db = FCO.client;
  const PAGE = (location.pathname.split('/').pop() || 'index.html');

  // 편집 대상에서 빼는 곳: 메뉴·푸터·입력폼·관리자 메뉴에서 따로 관리하는 영역
  const EXCLUDE = [
    'header', 'footer', 'nav', 'script', 'style', 'noscript', 'form', 'select', 'button', 'textarea',
    '.form-group', '.apply-form', '.hk-card', '.support-card', '.modal-overlay', '.modal',
    '#heroTitle', '#projectsGrid', '#noticeList', '#pressList',
    '#newsList', '.category-list', '.news-toolbar', '.programs', '.amount-select', '#fco-edit-bar',
    '[data-no-edit]',
  ].join(',');
  const TAGS = 'h1,h2,h3,h4,h5,h6,p,li,span,strong,em,b,a,dt,dd,td,th,div,label,small,blockquote,figcaption';

  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(36); };
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const textOf = el => el.innerText.replace(/ /g, ' ').replace(/[ \t]+\n/g, '\n').trim();
  const esc = FCO.esc;

  // 글자만 들어 있는(하위 태그가 <br> 뿐인) 요소를 편집 대상으로
  function collect() {
    const seen = {};
    const items = [];
    document.querySelectorAll(TAGS).forEach(el => {
      if (el.closest(EXCLUDE)) return;
      if ([...el.children].some(c => c.tagName !== 'BR')) return;
      const t = norm(el.textContent);
      if (!t || /^[\d\s.,·→›«»<>()\-:/]+$/.test(t)) return;
      const base = hash(t);
      seen[base] = (seen[base] || 0) + 1;
      el.dataset.fcoKey = base + '-' + seen[base];
      el.dataset.fcoOrig = t;
      items.push(el);
    });
    return items;
  }

  const items = collect();
  const byKey = Object.fromEntries(items.map(el => [el.dataset.fcoKey, el]));

  function setText(el, text) { el.innerHTML = esc(text).replace(/\n/g, '<br>'); }
  const STYLE_KEYS = ['fontSize', 'color', 'fontWeight', 'fontStyle', 'lineHeight'];
  // 관리자가 지정한 스타일은 사이트 기본 스타일(!important 포함)보다 항상 우선
  const CSS_PROP = { fontSize: 'font-size', color: 'color', fontWeight: 'font-weight', fontStyle: 'font-style', lineHeight: 'line-height' };
  const rgbOf = c => (c.match(/[\d.]+/g) || []).map(Number);
  function bgOf(el) {           // 실제로 보이는 배경색 (투명이면 부모로 올라감)
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const c = rgbOf(getComputedStyle(n).backgroundColor);
      if (c.length >= 3 && (c[3] === undefined || c[3] > 0.5)) return c;
    }
    return [255, 255, 255];
  }
  function applyStyle(el, st) {
    STYLE_KEYS.forEach(k => {
      const v = st && st[k];
      if (v) el.style.setProperty(CSS_PROP[k] || k, v, 'important');
      else el.style.removeProperty(CSS_PROP[k] || k);
    });
    // 안전장치: 글자색이 배경색과 거의 같아 안 보이게 되면 그 색 지정은 적용하지 않음
    if (st && st.color) {
      const fg = rgbOf(getComputedStyle(el).color), bg = bgOf(el);
      const d = Math.hypot(fg[0] - bg[0], fg[1] - bg[1], fg[2] - bg[2]);
      if (d < 60) { el.style.removeProperty('color'); el.dataset.fcoColorSkipped = st.color; }
    }
  }

  // 저장된 수정 내용 적용 (이 브라우저에 기억해 둔 것 먼저 → DB 최신본으로 갱신)
  const CACHE_KEY = 'fco_pc:' + PAGE;
  const applied = new Set();
  function applyRows(rows) {
    const keys = new Set(rows.map(r => r.key));
    applied.forEach(k => {           // 이전에 적용했지만 지금은 없어진 수정 → 원래대로
      if (keys.has(k)) return;
      const el = byKey[k]; if (!el) return;
      setText(el, el.dataset.fcoOrig); applyStyle(el, null);
      delete el.dataset.fcoStyle; delete el.dataset.fcoSaved; applied.delete(k);
    });
    rows.forEach(r => {
      const el = byKey[r.key];
      if (!el || el.dataset.fcoOrig !== r.original) return;
      if (norm(r.content) !== r.original) setText(el, r.content);
      if (r.style) { applyStyle(el, r.style); el.dataset.fcoStyle = JSON.stringify(r.style); }
      el.dataset.fcoSaved = '1'; applied.add(r.key);
    });
  }
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (Array.isArray(cached)) { applyRows(cached); reveal(); }
  } catch (e) { /* 저장소 사용 불가 → DB 응답을 기다림 */ }
  (async () => {
    try {
      const { data, error } = await db.from('page_content').select('key,original,content,style').eq('page', PAGE);
      if (!error) {
        applyRows(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch (e) {}
      }
    } finally { reveal(); }
  })();

  // ── 관리자 편집 도구 ──
  (async () => {
    const { data: sess } = await db.auth.getSession();
    if (!sess.session) return;
    const { data: isAdmin } = await db.rpc('is_admin');
    if (!isAdmin) return;

    const css = document.createElement('style');
    css.textContent = `
      #fco-edit-bar { position: fixed; right: 20px; bottom: 20px; z-index: 9999; display: flex; gap: 8px; align-items: center;
        font-family: "Pretendard", sans-serif; font-size: 14px; }
      #fco-edit-bar button { border: 0; border-radius: 999px; padding: 12px 20px; font: inherit; font-weight: 700; cursor: pointer;
        box-shadow: 0 6px 24px rgba(0,0,0,.2); }
      #fco-edit-bar .pri { background: #2563EB; color: #fff; }
      #fco-edit-bar .sec { background: #fff; color: #1a1f3c; }
      #fco-edit-bar .msg { background: #1a1f3c; color: #fff; border-radius: 999px; padding: 10px 16px; box-shadow: 0 6px 24px rgba(0,0,0,.2); }
      body.fco-editing [data-fco-key] { outline: 2px dashed #2563EB; outline-offset: 3px; cursor: text; border-radius: 2px; box-shadow: 0 0 0 5px rgba(255,255,255,.55); }
      body.fco-editing [data-fco-key]:hover { outline: 2px solid #2563EB; background: rgba(37,99,235,.06); }
      body.fco-editing [data-fco-key]:focus { outline: 2px solid #2563EB; background: rgba(37,99,235,.08); }
      body.fco-editing [data-fco-dirty] { outline: 2px solid #f97316 !important; }
      #fco-style-bar { position: absolute; z-index: 10000; display: none; align-items: center; gap: 6px; padding: 6px 8px;
        background: #1a1f3c; color: #fff; border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.28);
        font-family: "Pretendard", sans-serif; font-size: 13px; font-weight: 500; letter-spacing: normal; line-height: 1; white-space: nowrap; }
      #fco-style-bar.show { display: flex; }
      #fco-style-bar button { border: 0; background: rgba(255,255,255,.12); color: #fff; border-radius: 6px; height: 28px; min-width: 28px;
        padding: 0 8px; font: inherit; font-weight: 700; cursor: pointer; }
      #fco-style-bar button:hover { background: rgba(255,255,255,.25); }
      #fco-style-bar button.on { background: #fff; color: #1a1f3c; }
      #fco-style-bar input[type=number] { width: 52px; height: 28px; border: 0; border-radius: 6px; text-align: center; font: inherit; color: #1a1f3c; }
      #fco-style-bar .sep { width: 1px; height: 20px; background: rgba(255,255,255,.2); margin: 0 2px; }
      #fco-style-bar .sw { width: 22px; height: 22px; min-width: 22px; padding: 0; border-radius: 50%; border: 2px solid rgba(255,255,255,.6); }
      #fco-style-bar input[type=color] { width: 28px; height: 28px; padding: 0; border: 0; background: none; cursor: pointer; }
    `;
    document.head.appendChild(css);

    const bar = document.createElement('div');
    bar.id = 'fco-edit-bar';
    document.body.appendChild(bar);

    let editing = false;
    const dirty = new Set();

    const blockLinks = e => { if (editing && e.target.closest('[data-fco-key]')) e.preventDefault(); };
    document.addEventListener('click', blockLinks, true);

    // ── 글자 크기·색상 도구 ──
    const SWATCHES = ['#000000', '#333333', '#666666', '#999999', '#ffffff', '#6B2D8C', '#1a1f3c', '#2563EB', '#c0392b', '#f97316', '#16a34a'];
    const sbar = document.createElement('div');
    sbar.id = 'fco-style-bar';
    sbar.innerHTML = `
      <span>크기</span><button data-s="dec" title="작게">−</button><input type="number" min="8" max="160" data-s="size"><button data-s="inc" title="크게">+</button>
      <span class="sep"></span><span>행간</span><button data-s="lhdec" title="행간 좁게">−</button><input type="number" min="0.8" max="3" step="0.1" data-s="lh" style="width:52px"><button data-s="lhinc" title="행간 넓게">+</button>
      <span class="sep"></span><button data-s="bold" title="굵게 (700)">B</button><button data-s="normal" title="일반 (400)" style="font-weight:400">B</button>
      <span class="sep"></span><button data-s="italic" title="이탤릭" style="font-style:italic">I</button>
      <span class="sep"></span>${SWATCHES.map(c => `<button class="sw" data-s="color" data-c="${c}" style="background:${c}" title="${c}"></button>`).join('')}
      <input type="color" data-s="pick" title="다른 색 고르기">
      <span class="sep"></span><button data-s="reset" title="크기·색상·굵기·이탤릭을 원래대로">원래 스타일</button>`;
    document.body.appendChild(sbar);
    let cur = null;
    const getStyle = el => (el.dataset.fcoStyle ? JSON.parse(el.dataset.fcoStyle) : {});
    function setStyle(el, patch) {
      const st = { ...getStyle(el), ...patch };
      STYLE_KEYS.forEach(k => { if (!st[k]) delete st[k]; });
      if (Object.keys(st).length) el.dataset.fcoStyle = JSON.stringify(st); else delete el.dataset.fcoStyle;
      applyStyle(el, st);
      el.dataset.fcoDirty = '1'; dirty.add(el); render(); syncBar();
    }
    function lhRatio(el) {
      const cs = getComputedStyle(el);
      const lh = parseFloat(cs.lineHeight), fs = parseFloat(cs.fontSize);
      return isNaN(lh) ? 1.2 : lh / fs;
    }
    const setLh = v => setStyle(cur, { lineHeight: String(Math.round(Math.min(3, Math.max(0.8, v)) * 10) / 10) });
    function syncBar() {
      if (!cur) return;
      const cs = getComputedStyle(cur);
      sbar.querySelector('[data-s=size]').value = Math.round(parseFloat(cs.fontSize));
      sbar.querySelector('[data-s=bold]').classList.toggle('on', parseInt(cs.fontWeight, 10) >= 600);
      sbar.querySelector('[data-s=lh]').value = lhRatio(cur).toFixed(1);
      sbar.querySelector('[data-s=normal]').classList.toggle('on', parseInt(cs.fontWeight, 10) < 600);
      sbar.querySelector('[data-s=italic]').classList.toggle('on', cs.fontStyle === 'italic');
      const rgb = cs.color.match(/\d+/g) || [0, 0, 0];
      sbar.querySelector('[data-s=pick]').value = '#' + rgb.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
    }
    function placeBar() {
      if (!cur) return;
      const r = cur.getBoundingClientRect();
      const top = window.scrollY + r.top - sbar.offsetHeight - 10;
      const left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - sbar.offsetWidth - 8));
      sbar.style.top = (top < window.scrollY + 90 ? window.scrollY + r.bottom + 10 : top) + 'px';
      sbar.style.left = left + 'px';
    }
    function showBar(el) { cur = el; sbar.classList.add('show'); syncBar(); placeBar(); }
    sbar.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') e.preventDefault(); });
    sbar.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || !cur) return;
      const size = parseFloat(getComputedStyle(cur).fontSize);
      if (b.dataset.s === 'dec') setStyle(cur, { fontSize: Math.max(8, Math.round(size) - 1) + 'px' });
      if (b.dataset.s === 'inc') setStyle(cur, { fontSize: Math.min(160, Math.round(size) + 1) + 'px' });
      if (b.dataset.s === 'lhdec') setLh(lhRatio(cur) - 0.1);
      if (b.dataset.s === 'lhinc') setLh(lhRatio(cur) + 0.1);
      if (b.dataset.s === 'bold') setStyle(cur, { fontWeight: '700' });
      if (b.dataset.s === 'normal') setStyle(cur, { fontWeight: '400' });
      if (b.dataset.s === 'italic') setStyle(cur, { fontStyle: getComputedStyle(cur).fontStyle === 'italic' ? 'normal' : 'italic' });
      if (b.dataset.s === 'color') setStyle(cur, { color: b.dataset.c });
      if (b.dataset.s === 'reset') { delete cur.dataset.fcoStyle; applyStyle(cur, null); cur.dataset.fcoDirty = '1'; dirty.add(cur); render(); syncBar(); }
    });
    sbar.querySelector('[data-s=size]').addEventListener('change', e => {
      const v = Math.min(160, Math.max(8, parseInt(e.target.value, 10) || 0)); if (cur && v) setStyle(cur, { fontSize: v + 'px' });
    });
    sbar.querySelector('[data-s=lh]').addEventListener('change', e => { const v = parseFloat(e.target.value); if (cur && v) setLh(v); });
    sbar.querySelector('[data-s=pick]').addEventListener('input', e => { if (cur) setStyle(cur, { color: e.target.value }); });
    window.addEventListener('scroll', placeBar, { passive: true });
    window.addEventListener('resize', placeBar);

    function render() {
      bar.innerHTML = editing
        ? `<span class="msg">${dirty.size ? `${dirty.size}곳 수정됨` : '고칠 글을 클릭하세요'}</span>
           <button class="sec" data-act="cancel">취소</button>
           <button class="sec" data-act="reset" title="이 페이지에서 고친 내용을 모두 원래대로">원래대로</button>
           <button class="pri" data-act="save">저장</button>`
        : `<button class="pri" data-act="start">✏️ 페이지 편집</button>`;
    }
    bar.addEventListener('click', e => {
      const act = e.target.dataset.act;
      if (act === 'start') start();
      if (act === 'cancel') { if (!dirty.size || confirm('저장하지 않은 수정 내용을 버릴까요?')) location.reload(); }
      if (act === 'save') save();
      if (act === 'reset') resetAll();
    });

    function start() {
      editing = true;
      document.body.classList.add('fco-editing');
      items.forEach(el => {
        el.setAttribute('contenteditable', 'plaintext-only');
        if (el.contentEditable !== 'plaintext-only') el.setAttribute('contenteditable', 'true');
        el.addEventListener('input', () => { el.dataset.fcoDirty = '1'; dirty.add(el); render(); placeBar(); });
        el.addEventListener('focus', () => showBar(el));
        el.addEventListener('paste', ev => {
          if (el.getAttribute('contenteditable') === 'true') {
            ev.preventDefault();
            document.execCommand('insertText', false, ev.clipboardData.getData('text/plain'));
          }
        });
      });
      render();
    }

    async function save() {
      if (!dirty.size) { toastMsg('수정한 곳이 없습니다.'); return; }
      const rows = [], removes = [];
      dirty.forEach(el => {
        const content = textOf(el) || el.dataset.fcoOrig;
        const style = el.dataset.fcoStyle ? JSON.parse(el.dataset.fcoStyle) : null;
        if (norm(content) === el.dataset.fcoOrig && !style) removes.push(el.dataset.fcoKey); // 글·스타일 모두 원래대로
        else rows.push({ page: PAGE, key: el.dataset.fcoKey, original: el.dataset.fcoOrig, content, style, updated_at: new Date().toISOString() });
      });
      const btn = bar.querySelector('[data-act=save]'); btn.disabled = true; btn.textContent = '저장 중…';
      try {
        // 로그인 상태 확인 (만료됐으면 저장이 거부되므로 먼저 안내)
        const { data: ok } = await db.rpc('is_admin');
        if (!ok) throw new Error('관리자 로그인이 만료되었습니다. 관리자 페이지에서 다시 로그인한 뒤 저장해 주세요. (수정 내용은 이 창을 닫기 전까지 남아 있습니다)');
        if (rows.length) { const { error } = await db.from('page_content').upsert(rows); if (error) throw error; }
        if (removes.length) { const { error } = await db.from('page_content').delete().eq('page', PAGE).in('key', removes); if (error) throw error; }
        // 저장 확인: DB에서 다시 읽어 실제로 들어갔는지 검사
        if (rows.length) {
          const { data: back, error: e2 } = await db.from('page_content').select('key,content').eq('page', PAGE).in('key', rows.map(r => r.key));
          if (e2 || (back || []).length !== rows.length) throw new Error('저장 확인에 실패했습니다. 잠시 후 다시 저장해 주세요.');
        }
        try { localStorage.removeItem(CACHE_KEY); } catch (e) {}
        dirty.forEach(el => delete el.dataset.fcoDirty);
        dirty.clear();
        render();
        toastMsg('저장되었습니다. 방문자에게 바로 보입니다.');
      } catch (err) {
        console.error(err);
        alert('저장하지 못했습니다.\n' + (err.code === '42501' ? '관리자 권한이 확인되지 않습니다. 다시 로그인해 주세요.' : (err.message || err)));
        render();
      }
    }

    async function resetAll() {
      if (!confirm('이 페이지에서 고친 글·크기·색상을 모두 원래대로 되돌릴까요?')) return;
      const { error } = await db.from('page_content').delete().eq('page', PAGE);
      if (error) return alert('되돌리지 못했습니다: ' + error.message);
      location.reload();
    }

    function toastMsg(m) {
      const msg = bar.querySelector('.msg'); if (msg) { msg.textContent = m; setTimeout(render, 2500); }
    }

    window.addEventListener('beforeunload', e => { if (dirty.size) { e.preventDefault(); e.returnValue = ''; } });
    render();
  })();
})();
