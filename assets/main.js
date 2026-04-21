// main.js — 잡학다식 프론트엔드 렌더러

const TAG_MAP = {
  econ: '경제', fin: '금융', tech: '기술', int: '국제', def: '기타'
};

const ISSUE_TAG_KR = {
  war: '분쟁', eco: '경제', pol: '정치', cli: '기후'
};

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.col-main').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
  });
});

async function loadData(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function renderNews(data) {
  const leads = data.items.slice(0, 2);
  const more  = data.items.slice(2);

  document.getElementById('news-lead-container').innerHTML = leads.map(item => `
    <div class="news-lead">
      <span class="news-tag ${item.tag}">${TAG_MAP[item.tag] || item.tag}</span>
      <div class="news-lead-title">${item.title}</div>
      ${item.summary ? `<div class="news-lead-desc">${item.summary}</div>` : ''}
      <div class="news-lead-meta">${item.category} · ${item.time} · AI 요약</div>
    </div>
  `).join('');

  document.getElementById('news-more-container').innerHTML = more.map((item, i) => `
    <div class="news-more-item">
      <div class="news-more-idx">${i + 3}</div>
      <div>
        <div class="news-more-title">${item.title}</div>
        <div class="news-more-meta">${item.category} · ${item.time}</div>
      </div>
    </div>
  `).join('');
}

function renderEconSidebar(data) {
  const points = (data.points || []).map(p => `
    <div class="econ-block">
      <div class="econ-label">${p.icon} ${p.text}</div>
    </div>
  `).join('');

  const watchlist = (data.watchlist || []).map(w => `
    <span class="news-tag def" style="margin-right:4px;margin-bottom:4px;display:inline-block">${w}</span>
  `).join('');

  document.getElementById('econ-sidebar-container').innerHTML = `
    <div class="ai-comment">
      <div class="ai-comment-label">AI COMMENT</div>
      <div class="ai-comment-text">${data.summary || ''}</div>
    </div>
    ${points}
    ${watchlist ? `<div style="margin-top:10px">${watchlist}</div>` : ''}
  `;
}

function renderEconDetail(data) {
  const points = (data.points || []).map(p => `
    <div class="econ-detail-card">
      <div class="econ-detail-name">${p.icon}</div>
      <div class="econ-detail-val" style="font-size:14px;color:var(--ink)">${p.text}</div>
    </div>
  `).join('');

  const watchlist = (data.watchlist || []).map(w => `
    <span class="news-tag def" style="margin-right:6px;margin-bottom:6px;display:inline-block">${w}</span>
  `).join('');

  document.getElementById('economy-detail-container').innerHTML = `
    <div class="econ-detail-grid">${points}</div>
    <div class="section-label" style="margin-top:20px">주목 키워드</div>
    <div style="margin-top:10px">${watchlist}</div>
    <div class="ai-comment" style="margin-top:16px">
      <div class="ai-comment-label">AI MARKET ANALYSIS</div>
      <div class="ai-comment-text">${data.summary || ''}</div>
    </div>
  `;
}

function renderIssues(data) {
  document.getElementById('issues-sidebar-container').innerHTML = data.issues.slice(0, 4).map(issue => `
    <div class="issue-item">
      <span class="issue-tag ${issue.tag}">${ISSUE_TAG_KR[issue.tag] || issue.tag}</span>
      <div class="issue-title">${issue.title}</div>
      <div class="issue-desc">${issue.summary}</div>
    </div>
  `).join('');

  document.getElementById('issues-detail-container').innerHTML = data.issues.map(issue => `
    <div class="news-lead">
      <span class="issue-tag ${issue.tag}" style="margin-bottom:8px;display:inline-block">${ISSUE_TAG_KR[issue.tag] || issue.tag}</span>
      <div class="news-lead-title" style="font-size:17px">${issue.title}</div>
      <div class="news-lead-desc">${issue.detail}</div>
      <div class="news-lead-meta">${issue.status} · 최종 업데이트: ${issue.updated}</div>
    </div>
  `).join('');
}

function renderMeta(news) {
  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
  const days = ['일','월','화','수','목','금','토'];
  document.getElementById('issue-num').textContent = `VOL. 1 · ${dateStr} ${days[today.getDay()]}요일`;
  document.getElementById('updated-at').textContent = news.updated_at ? `${news.updated_at} KST 기준` : '업데이트 완료';
}

async function init() {
  try {
    const [news, economy, issues] = await Promise.all([
      loadData('data/news.json'),
      loadData('data/economy.json'),
      loadData('data/issues.json'),
    ]);
    renderMeta(news);
    renderNews(news);
    renderEconSidebar(economy);
    renderEconDetail(economy);
    renderIssues(issues);
  } catch (err) {
    console.error('데이터 로드 실패:', err);
    try { const n = await loadData('data/news.json'); renderMeta(n); renderNews(n); }
    catch(e) { document.getElementById('news-lead-container').innerHTML = '<div class="loading-placeholder">데이터를 불러오지 못했습니다.</div>'; }
    try { const e = await loadData('data/economy.json'); renderEconSidebar(e); renderEconDetail(e); } catch(e) {}
    try { const i = await loadData('data/issues.json'); renderIssues(i); } catch(e) {}
  }
}

init();
