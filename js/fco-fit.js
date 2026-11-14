// 모바일에서 '제목+부제 한 덩어리'(h1/h2.tm, 메인 #psHead)의 첫 줄이 화면 폭을 넘어 두 줄로 갈라지면,
// 첫 줄 끝 글자가 아래 줄(작은 글씨 모양)로 떨어져 깨져 보인다.
// → 화면이 좁을 때만 **첫 줄 글자 크기만** 한 줄에 들어갈 때까지 줄인다(최소 50%). 부제 크기는 그대로.
//   PC(901px 이상)와 편집 모드에서는 아무것도 바꾸지 않는다. 요소의 style 속성은 건드리지 않음
//   (별도 <style id="fco-fit-style"> 규칙만 사용 → 편집 도구 저장값과 섞이지 않음).
(function () {
  const MOBILE = 900;
  let sheet, seq = 0;

  function firstLineCount(el) {
    const br = el.querySelector('br');
    const range = document.createRange();
    range.setStart(el, 0);
    if (br) range.setEndBefore(br); else range.setEnd(el, el.childNodes.length);
    const tops = [];
    for (const r of range.getClientRects()) {
      if (r.width < 1) continue;
      if (!tops.some(t => Math.abs(t - r.top) < r.height / 2)) tops.push(r.top);
    }
    return tops.length;
  }

  function fit() {
    if (!document.body) return;
    if (!sheet) {
      sheet = document.createElement('style');
      sheet.id = 'fco-fit-style';
      document.head.appendChild(sheet);
    }
    sheet.textContent = '';   // 모두 원래 크기로
    if (window.innerWidth > MOBILE || document.body.classList.contains('fco-editing')) return;
    const rules = [];
    document.querySelectorAll('h1.tm, h2.tm, h2.ps-head').forEach(el => {
      if (!el.querySelector('br') || firstLineCount(el) <= 1) return;
      if (!el.dataset.fitId) el.dataset.fitId = String(++seq);
      const sel = `[data-fit-id="${el.dataset.fitId}"][data-fit-id][data-fit-id][data-fit-id]::first-line`;
      const base = parseFloat(getComputedStyle(el, '::first-line').fontSize);
      let rule = '';
      for (let f = 0.95; f >= 0.5; f -= 0.05) {
        rule = `${sel}{font-size:${(base * f).toFixed(1)}px !important}`;
        sheet.textContent = rules.join('\n') + '\n' + rule;
        if (firstLineCount(el) <= 1) break;
      }
      rules.push(rule);
    });
    sheet.textContent = rules.join('\n');
  }
  window.fcoFit = fit;

  let t;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 120); };
  document.addEventListener('DOMContentLoaded', () => {
    fit();
    // 편집 모드에 들어가고 나올 때 원래 크기로 되돌리고/다시 맞춤
    new MutationObserver(later).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  });
  window.addEventListener('load', fit);
  window.addEventListener('resize', later);
  if (document.fonts) document.fonts.ready.then(fit);
  setTimeout(fit, 1600);   // 관리자 수정본(page_content) 적용 뒤 한 번 더
  setTimeout(fit, 3500);
})();

// 모바일 메뉴: 하위 메뉴가 있는 항목(사업소개·후원)을 누르면 이동하지 않고 하위 메뉴를 펼치거나 접는다.
// 상위 페이지가 하위 목록에 없으면(사업소개 → projects.html) 맨 위에 '전체 보기' 링크를 넣어 그대로 갈 수 있게 한다.
// PC(901px 이상)에서는 기존처럼 마우스를 올리면 펼쳐지고, 누르면 이동한다.
(function () {
  const MOBILE = 900;
  function prepare() {
    document.querySelectorAll('.site-header .nav-links .has-sub').forEach(function (li) {
      if (li.dataset.subReady) return;
      li.dataset.subReady = '1';
      const top = li.querySelector(':scope > a');
      const sub = li.querySelector(':scope > .sub-menu');
      if (!top || !sub) return;
      const href = top.getAttribute('href');
      const has = [...sub.querySelectorAll('a')].some(a => a.getAttribute('href') === href);
      if (!has) {
        const item = document.createElement('li');
        item.className = 'sub-all';
        item.innerHTML = '<a href="' + href + '">' + top.textContent.trim() + ' 전체 보기</a>';
        sub.insertBefore(item, sub.firstChild);
      }
    });
  }
  document.addEventListener('click', function (e) {
    if (window.innerWidth > MOBILE) return;
    const top = e.target.closest('.site-header .nav-links .has-sub > a');
    if (!top) return;
    e.preventDefault();
    const li = top.parentElement;
    const willOpen = !li.classList.contains('sub-open');
    li.parentElement.querySelectorAll(':scope > .has-sub.sub-open').forEach(x => x.classList.remove('sub-open'));
    if (willOpen) li.classList.add('sub-open');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', prepare); else prepare();
})();
