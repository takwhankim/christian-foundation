// FCO 공통 DB 헬퍼 — supabase-js(UMD)와 supabase-config.js 다음에 불러옵니다.
(function () {
  const cfg = window.FCO_SUPABASE || {};
  const ready = !!(cfg.url && cfg.anonKey && window.supabase);
  const client = ready ? window.supabase.createClient(cfg.url, cfg.anonKey) : null;

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function fmtDate(v) {
    if (!v) return '';
    const d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
    if (isNaN(d)) return String(v);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }

  // 오바댜 문학상 회차: 격월(2·4·6·8·10·12월). 홀수 달 접수분은 다음 달 회차로 묶습니다.
  function obadiahRound(v) {
    const d = new Date(v);
    let y = d.getFullYear(), m = d.getMonth() + 1;
    if (m % 2 === 1) m += 1;
    return `${y}년 ${m}월 회차`;
  }

  const NOT_READY_MSG = '온라인 접수 준비 중입니다. 잠시 후 다시 시도하시거나 info@fco.or.kr 로 문의해 주세요.';

  async function submit(table, row) {
    if (!client) throw new Error(NOT_READY_MSG);
    const { error } = await client.from(table).insert(row);
    if (error) {
      console.error('[FCO] insert failed', table, error);
      throw new Error('제출 중 문제가 발생했습니다. 입력 내용을 확인하시거나 잠시 후 다시 시도해 주세요.');
    }
  }

  window.FCO = { ready, client, esc, fmtDate, obadiahRound, submit, NOT_READY_MSG };
})();
