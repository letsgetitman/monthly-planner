'use strict';

/* ---------- 날짜 도우미 ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const mondayOf = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return ymd(d); };
const monthOf = s => s.slice(0, 7);
const addMonths = (mk, n) => { const [y, m] = mk.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const todayStr = () => ymd(new Date());
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const WD = ['일', '월', '화', '수', '목', '금', '토'];
const fmtDay = s => { const d = parse(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[d.getDay()]}요일`; };
const fmtShort = s => { const d = parse(s); return `${d.getMonth() + 1}.${d.getDate()} (${WD[d.getDay()]})`; };
const fmtMonth = mk => { const [y, m] = mk.split('-'); return `${y}년 ${Number(m)}월`; };
const monthNum = mk => Number(mk.slice(5, 7));
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function relDay(s) {
  const diff = Math.round((parse(s) - parse(todayStr())) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === -1) return '어제';
  if (diff === 1) return '내일';
  return diff > 0 ? `${diff}일 후` : `${-diff}일 전`;
}
function weekLabel(ws) {
  const thu = parse(addDays(ws, 3));
  return `${thu.getMonth() + 1}월 ${Math.floor((thu.getDate() - 1) / 7) + 1}주차`;
}

/* ---------- 공통 도우미 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const safeColor = c => (/^#[0-9a-f]{6}$/i.test(c) ? c : '#8A938D');

/* ---------- 저장소 ---------- */
const KEY = 'hanthal-note.v1';

function defaultDb() {
  return {
    v: 1,
    categories: [
      { id: 'work', name: '업무', color: '#3567D6' },
      { id: 'invest', name: '투자', color: '#C08417' },
      { id: 'health', name: '건강', color: '#2F9466' },
      { id: 'personal', name: '개인', color: '#C9507A' },
    ],
    goals: [],
    tasks: [],
    reviews: {},
    settings: { notify: false, lastCat: 'work' },
    notified: {},
  };
}

function loadDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(defaultDb(), JSON.parse(raw));
  } catch (e) { /* 저장소를 쓸 수 없으면 새로 시작 */ }
  return null;
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('저장하지 못했어요. 기기 저장 공간을 확인해 주세요.'); }
  updateBadge();
}

/* 처음 열었을 때 보여 줄 예시 데이터 (설정에서 한 번에 지울 수 있음) */
function seedExamples() {
  const t = todayStr();
  const mk = monthOf(t);
  const d = n => addDays(t, n);
  const goal = (title, cat, month = mk) => { const g = { id: uid(), title, cat, month, sample: true }; db.goals.push(g); return g.id; };
  const task = (title, cat, opts = {}) => {
    const date = opts.date ?? null;
    db.tasks.push({
      id: uid(), title, cat, goal: opts.goal ?? null, date, time: opts.time ?? '',
      month: date ? monthOf(date) : (opts.month ?? mk), done: !!opts.done, remind: !!opts.remind,
      memo: '', sample: true,
    });
  };
  const sameMonth = s => (monthOf(s) === mk ? s : null);

  const g1 = goal('3분기 실적 보고서 마무리', 'work');
  task('부서별 자료 취합', 'work', { goal: g1, date: sameMonth(d(-3)), done: true });
  task('보고서 초안 작성', 'work', { goal: g1, date: t, time: '10:00', remind: true });
  task('팀장 검토 받기', 'work', { goal: g1, date: sameMonth(d(2)), time: '15:00' });

  const g2 = goal('반도체 섹터 백테스트 완료', 'invest');
  task('5년치 주가 데이터 수집', 'invest', { goal: g2, date: sameMonth(d(-5)), done: true });
  task('모멘텀 전략 3종 비교', 'invest', { goal: g2, date: sameMonth(d(1)) });
  task('결과 정리해서 메모 남기기', 'invest', { goal: g2 });

  const g3 = goal('주 3회 운동하기', 'health');
  task('러닝 5km', 'health', { goal: g3, date: sameMonth(d(-2)), done: true });
  task('헬스장 하체 운동', 'health', { goal: g3, date: t, time: '19:30', remind: true });
  task('헬스장 상체 운동', 'health', { goal: g3, date: sameMonth(d(2)) });

  const g4 = goal('책 2권 읽기', 'personal');
  task('「돈의 심리학」 완독', 'personal', { goal: g4, done: true });
  task('두 번째 책 절반까지 읽기', 'personal', { goal: g4, date: sameMonth(d(3)) });

  task('은행 방문 (적금 만기)', 'personal', { date: t, time: '13:00' });
  task('보험 청구 서류 제출', 'personal', { date: sameMonth(d(-1)) || t });

  // 지난 몇 달 기록 (통계 비교용)
  const pattern = [
    ['work', true], ['work', true], ['work', false], ['invest', true], ['invest', false],
    ['health', true], ['health', false], ['health', false], ['personal', true], ['personal', true],
  ];
  for (let back = 1; back <= 5; back++) {
    const m = addMonths(mk, -back);
    pattern.forEach(([cat, done], i) => {
      const flip = (i + back) % 4 === 0;
      const day = `${m}-${pad(3 + i * 2)}`;
      task(`${monthNum(m)}월 기록 ${i + 1}`, cat, { date: day, done: flip ? !done : done });
    });
  }
}

let db = loadDb();
const firstRun = !db;
if (firstRun) { db = defaultDb(); seedExamples(); }

/* ---------- 화면 상태 ---------- */
const ui = {
  tab: 'today',
  day: todayStr(),
  week: mondayOf(todayStr()),
  month: monthOf(todayStr()),
  sel: todayStr(),
  monthView: 'calendar',
  statsMonth: monthOf(todayStr()),
  quickCat: db.settings.lastCat || 'work',
  armed: null,
};
let lastToday = todayStr();

/* ---------- 데이터 조회 ---------- */
const cat = id => db.categories.find(c => c.id === id) || { id: '', name: '미분류', color: '#8A938D' };
const goalById = id => db.goals.find(g => g.id === id);
const taskById = id => db.tasks.find(t => t.id === id);
const tasksOfDay = s => db.tasks.filter(t => t.date === s);
const tasksOfMonth = mk => db.tasks.filter(t => t.month === mk);
const goalsOfMonth = mk => db.goals.filter(g => g.month === mk);
const goalTasks = gid => db.tasks.filter(t => t.goal === gid);
const doneCount = arr => arr.filter(t => t.done).length;
const isOpen = t => !t.done && !t.carried;

function sortTasks(arr) {
  return arr.slice().sort((a, b) =>
    (a.done - b.done) ||
    (a.date || '9999').localeCompare(b.date || '9999') ||
    (a.time || '99').localeCompare(b.time || '99'));
}

/* ---------- 조각 템플릿 ---------- */
const ICON_CHECK = '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_BELL = '<svg class="bell" viewBox="0 0 24 24" aria-label="알림"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Zm4 4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';

function taskRow(t, opts = {}) {
  const c = cat(t.cat);
  const g = t.goal && goalById(t.goal);
  const late = isOpen(t) && t.date && t.date < todayStr();
  return `<li class="task ${t.done ? 'done' : ''}" style="--c:${safeColor(c.color)}">
    <button class="check" type="button" data-act="toggle" data-id="${t.id}" aria-label="${esc(t.title)} ${t.done ? '완료 취소' : '완료로 표시'}" aria-pressed="${t.done}">
      <span class="box">${ICON_CHECK}</span>
    </button>
    <button class="task-body" type="button" data-act="edit-task" data-id="${t.id}">
      <span class="task-title">${esc(t.title)}</span>
      <span class="task-meta">
        <span class="tag">${esc(c.name)}</span>
        ${opts.showDate && t.date ? `<span>${fmtShort(t.date)}</span>` : ''}
        ${t.time ? `<span>${t.time}${t.remind ? ' ' + ICON_BELL : ''}</span>` : ''}
        ${g && !opts.hideGoal ? `<span class="goal-ref">◎ ${esc(g.title)}</span>` : ''}
        ${late ? '<span class="late">기한 지남</span>' : ''}
        ${t.carried ? '<span class="moved">다음 달로 넘김</span>' : ''}
        ${t.from ? `<span class="moved">${monthNum(t.from)}월에서 이월</span>` : ''}
      </span>
    </button>
  </li>`;
}

const taskList = (arr, opts) => `<ul class="tasks">${arr.map(t => taskRow(t, opts)).join('')}</ul>`;

function ring(p, size = 68) {
  const r = 26, C = 2 * Math.PI * r;
  return `<svg class="ring" viewBox="0 0 64 64" width="${size}" height="${size}" role="img" aria-label="달성률 ${p}%">
    <circle class="ring-bg" cx="32" cy="32" r="${r}"/>
    <circle class="ring-fg" cx="32" cy="32" r="${r}" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - p / 100)).toFixed(2)}" transform="rotate(-90 32 32)"${p === 0 ? ' stroke-opacity="0"' : ''}/>
    <text x="32" y="37" text-anchor="middle">${p}%</text>
  </svg>`;
}

const bar = p => `<div class="bar" role="progressbar" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></div>`;

function catChips(name, selected) {
  return `<div class="chips" role="group" aria-label="카테고리">${db.categories.map(c =>
    `<button type="button" class="chip-btn" style="--c:${safeColor(c.color)}" data-act="pick-cat" data-name="${name}" data-cat="${c.id}" aria-pressed="${c.id === selected}">${esc(c.name)}</button>`
  ).join('')}</div>`;
}

function sampleNote() {
  if (!db.tasks.some(t => t.sample) && !db.goals.some(g => g.sample)) return '';
  return `<div class="sample-note"><span>지금 보이는 내용은 예시입니다.</span><button class="link-btn" type="button" data-act="clear-samples">예시 지우기</button></div>`;
}

/* ---------- 오늘 ---------- */
function renderToday() {
  const d = ui.day, t0 = todayStr();
  const list = sortTasks(tasksOfDay(d));
  const done = doneCount(list);
  const left = list.length - done;
  // 밀린 할 일은 이번 달 것만 (지난달 것은 월간 회고에서 다음 달로 넘김)
  const overdue = d === t0 ? sortTasks(db.tasks.filter(t => isOpen(t) && t.date && t.date < t0 && monthOf(t.date) === monthOf(t0))) : [];
  const mk = monthOf(d);
  const goals = goalsOfMonth(mk);

  let msg = '할 일을 추가해 보세요.';
  if (list.length) msg = left === 0 ? '모두 끝냈어요. 수고했어요!' : `남은 할 일 ${left}개`;

  return `
  ${sampleNote()}
  <section class="view-head">
    <div class="nav-row">
      <button class="icon-btn" type="button" data-act="day-prev" aria-label="전날">‹</button>
      <div class="head-title"><p class="eyebrow">${relDay(d)}</p><h1>${fmtDay(d)}</h1></div>
      <button class="icon-btn" type="button" data-act="day-next" aria-label="다음 날">›</button>
    </div>
    ${d !== t0 ? '<button class="link-btn" type="button" data-act="go-today">오늘로 돌아가기</button>' : ''}
  </section>

  <section class="summary card">
    ${ring(pct(done, list.length))}
    <div><strong>${list.length ? `${list.length}개 중 ${done}개 완료` : '아직 할 일이 없어요'}</strong><p>${msg}</p></div>
  </section>

  <form class="quick-add" data-form="quick" autocomplete="off">
    <div class="input-row">
      <input id="quick-input" type="text" enterkeyhint="done" placeholder="할 일 입력 (예: 14:00 회의)" aria-label="새 할 일">
      <button class="btn" type="submit">추가</button>
    </div>
    ${catChips('quick', ui.quickCat)}
  </form>

  ${overdue.length ? `
  <section>
    <div class="sec-head"><h2>밀린 할 일 <span class="count alert">${overdue.length}</span></h2>
      <button class="link-btn" type="button" data-act="overdue-to-today">모두 오늘로 옮기기</button></div>
    ${taskList(overdue, { showDate: true })}
  </section>` : ''}

  <section>
    <div class="sec-head"><h2>할 일 <span class="count">${list.length}</span></h2></div>
    ${list.length ? taskList(list) : '<p class="empty">이 날짜에 등록된 할 일이 없어요.<br>위 입력창이나 + 버튼으로 추가하세요.</p>'}
  </section>

  <section>
    <div class="sec-head"><h2>${monthNum(mk)}월 목표</h2><button class="link-btn" type="button" data-act="open-goals">전체 보기</button></div>
    ${goals.length ? `<div class="card goal-mini">${goals.map(g => {
      const ts = goalTasks(g.id), p = pct(doneCount(ts), ts.length);
      return `<button class="goal-mini-row" type="button" data-act="open-goals" style="--c:${safeColor(cat(g.cat).color)}">
        <span>${esc(g.title)}</span><span class="pct">${p}%</span>${bar(p)}</button>`;
    }).join('')}</div>` : '<p class="empty">이번 달 목표가 없어요. 월간 → 목표에서 추가하세요.</p>'}
  </section>`;
}

/* ---------- 주간 ---------- */
function renderWeek() {
  const ws = ui.week, t0 = todayStr();
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const all = days.flatMap(tasksOfDay);
  const p = pct(doneCount(all), all.length);
  const thisWeek = mondayOf(t0) === ws;

  return `
  ${sampleNote()}
  <section class="view-head">
    <div class="nav-row">
      <button class="icon-btn" type="button" data-act="week-prev" aria-label="지난주">‹</button>
      <div class="head-title"><p class="eyebrow">${thisWeek ? '이번 주' : '주간'}</p><h1>${weekLabel(ws)}</h1></div>
      <button class="icon-btn" type="button" data-act="week-next" aria-label="다음 주">›</button>
    </div>
    <p class="head-sub">${fmtShort(days[0])} – ${fmtShort(days[6])}</p>
    ${!thisWeek ? '<button class="link-btn" type="button" data-act="go-this-week">이번 주로 돌아가기</button>' : ''}
  </section>

  <section class="summary card">
    ${ring(p)}
    <div><strong>${all.length ? `${all.length}개 중 ${doneCount(all)}개 완료` : '이번 주 할 일이 없어요'}</strong>
    <p>${all.length ? `남은 할 일 ${all.length - doneCount(all)}개` : '요일별 + 추가로 계획을 세워 보세요.'}</p></div>
  </section>

  <div class="week-days">
    ${days.map(d => {
      const ts = sortTasks(tasksOfDay(d));
      const dd = parse(d);
      const dp = pct(doneCount(ts), ts.length);
      return `<article class="day-card ${d === t0 ? 'is-today' : ''}">
        <button class="day-head" type="button" data-act="open-day" data-day="${d}" aria-label="${fmtDay(d)} 보기">
          <span class="dw ${dd.getDay() === 0 ? 'sun' : ''}">${WD[dd.getDay()]}</span>
          <span class="dn">${dd.getMonth() + 1}월 ${dd.getDate()}일${d === t0 ? ' · 오늘' : ''}</span>
          ${ts.length ? `<span class="mini-bar bar"><i style="width:${dp}%"></i></span><span class="dc">${doneCount(ts)}/${ts.length}</span>` : ''}
        </button>
        ${ts.length ? taskList(ts) : ''}
        <button class="add-inline" type="button" data-act="new-task" data-day="${d}">+ 할 일 추가</button>
      </article>`;
    }).join('')}
  </div>`;
}

/* ---------- 월간 ---------- */
function renderMonth() {
  const mk = ui.month;
  const ts = tasksOfMonth(mk);
  const p = pct(doneCount(ts), ts.length);
  const views = [['calendar', '달력'], ['goals', '목표'], ['review', '회고']];
  const isThis = mk === monthOf(todayStr());

  let body = '';
  if (ui.monthView === 'calendar') body = renderCalendar(mk);
  else if (ui.monthView === 'goals') body = renderGoals(mk);
  else body = renderReview(mk);

  return `
  ${sampleNote()}
  <section class="view-head">
    <div class="nav-row">
      <button class="icon-btn" type="button" data-act="month-prev" aria-label="지난달">‹</button>
      <div class="head-title"><p class="eyebrow">${isThis ? '이번 달' : '월간'} · 달성률 ${p}%</p><h1>${fmtMonth(mk)}</h1></div>
      <button class="icon-btn" type="button" data-act="month-next" aria-label="다음 달">›</button>
    </div>
    ${!isThis ? '<button class="link-btn" type="button" data-act="go-this-month">이번 달로 돌아가기</button>' : ''}
  </section>
  ${bar(p)}
  <div class="segment" role="group" aria-label="월간 보기">
    ${views.map(([k, l]) => `<button type="button" data-act="month-view" data-view="${k}" aria-pressed="${ui.monthView === k}">${l}</button>`).join('')}
  </div>
  ${body}`;
}

function renderCalendar(mk) {
  const t0 = todayStr();
  const first = `${mk}-01`;
  const start = mondayOf(first);
  const lastDay = addDays(`${addMonths(mk, 1)}-01`, -1);
  const end = addDays(mondayOf(lastDay), 6);
  if (monthOf(ui.sel) !== mk) ui.sel = mk === monthOf(t0) ? t0 : first;

  const cells = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const ts = tasksOfDay(d);
    const colors = [...new Set(ts.map(t => safeColor(cat(t.cat).color)))].slice(0, 4);
    const allDone = ts.length > 0 && ts.every(t => t.done);
    const dd = parse(d);
    const cls = [
      'cal-cell',
      monthOf(d) !== mk && 'out',
      dd.getDay() === 0 && 'sun',
      d === t0 && 'today',
      d === ui.sel && 'sel',
      allDone && 'all-done',
    ].filter(Boolean).join(' ');
    cells.push(`<button type="button" class="${cls}" data-act="cal-sel" data-day="${d}" aria-label="${fmtDay(d)}, 할 일 ${ts.length}개" aria-pressed="${d === ui.sel}">
      <span class="num">${dd.getDate()}</span>
      <span class="dots">${colors.map(c => `<i style="--c:${c}"></i>`).join('')}</span>
    </button>`);
  }

  const selTasks = sortTasks(tasksOfDay(ui.sel));
  return `
  <div class="card cal">
    <div class="cal-grid">
      ${['월', '화', '수', '목', '금', '토', '일'].map(w => `<div class="cal-wd ${w === '일' ? 'sun' : ''}">${w}</div>`).join('')}
      ${cells.join('')}
    </div>
  </div>
  <section>
    <div class="sec-head"><h2>${fmtShort(ui.sel)} <span class="count">${selTasks.length}</span></h2>
      <button class="link-btn" type="button" data-act="open-day" data-day="${ui.sel}">이 날 크게 보기</button></div>
    ${selTasks.length ? taskList(selTasks) : '<p class="empty">할 일이 없어요. + 버튼으로 추가하세요.</p>'}
  </section>`;
}

function renderGoals(mk) {
  const goals = goalsOfMonth(mk);
  const loose = sortTasks(tasksOfMonth(mk).filter(t => !t.goal && !t.date));
  return `
  ${goals.length ? goals.map(g => {
    const c = cat(g.cat);
    const ts = sortTasks(goalTasks(g.id));
    const dn = doneCount(ts), p = pct(dn, ts.length);
    return `<article class="card goal" style="--c:${safeColor(c.color)}">
      <div class="goal-top"><span class="tag">${esc(c.name)}${g.from ? ` · ${monthNum(g.from)}월에서 이월` : ''}</span>
        <button class="small-btn" type="button" data-act="edit-goal" data-id="${g.id}">편집</button></div>
      <h3>${esc(g.title)}</h3>
      ${bar(p)}
      <p class="goal-stat"><span>세부 할 일 ${dn}/${ts.length}</span><strong>${p}%</strong></p>
      ${ts.length ? taskList(ts, { showDate: true, hideGoal: true }) : ''}
      <form class="sub-add" data-form="subtask" data-goal="${g.id}" autocomplete="off">
        <input id="sub-${g.id}" type="text" placeholder="세부 할 일 추가" aria-label="${esc(g.title)} 세부 할 일 추가" enterkeyhint="done">
        <button class="btn" type="submit">추가</button>
      </form>
    </article>`;
  }).join('') : '<p class="empty">이 달의 목표가 없어요.<br>아래 버튼으로 첫 목표를 세워 보세요.</p>'}
  <button class="btn ghost block" type="button" data-act="new-goal">+ 목표 추가</button>
  ${loose.length ? `<section><div class="sec-head"><h2>날짜 없는 할 일</h2></div>${taskList(loose)}</section>` : ''}`;
}

function renderReview(mk) {
  const ts = tasksOfMonth(mk);
  const goals = goalsOfMonth(mk);
  const goalsDone = goals.filter(g => { const gt = goalTasks(g.id); return gt.length && gt.every(t => t.done); }).length;
  const open = ts.filter(isOpen);
  const r = db.reviews[mk] || {};
  const next = addMonths(mk, 1);
  const armed = ui.armed === 'carry';
  return `
  <div class="review-stats">
    <div class="stat"><span class="k">달성률</span><span class="v">${pct(doneCount(ts), ts.length)}<small>%</small></span></div>
    <div class="stat"><span class="k">완료한 일</span><span class="v">${doneCount(ts)}<small>/${ts.length}</small></span></div>
    <div class="stat"><span class="k">달성한 목표</span><span class="v">${goalsDone}<small>/${goals.length}</small></span></div>
  </div>
  <section class="card carry">
    <h2 style="font-size:16px">다음 달로 넘기기</h2>
    ${open.length
      ? `<p>끝내지 못한 할 일 ${open.length}개를 ${monthNum(next)}월로 복사합니다. 목표도 함께 넘어가고, 이번 달 기록은 그대로 남습니다.</p>
         <button class="btn ${armed ? '' : 'ghost'} block" type="button" data-act="carry">${armed ? `한 번 더 누르면 ${open.length}개를 넘깁니다` : `미완료 ${open.length}개 ${monthNum(next)}월로 넘기기`}</button>`
      : '<p>넘길 할 일이 없어요. 이번 달 할 일을 모두 정리했습니다.</p>'}
  </section>
  <section class="card form">
    <h2 style="font-size:16px">${monthNum(mk)}월 회고</h2>
    <div class="review-field"><label for="review-good">잘한 점</label><textarea id="review-good" data-review="good" placeholder="이번 달에 잘 해낸 일">${esc(r.good)}</textarea></div>
    <div class="review-field"><label for="review-bad">아쉬운 점</label><textarea id="review-bad" data-review="bad" placeholder="계획대로 안 된 일과 이유">${esc(r.bad)}</textarea></div>
    <div class="review-field"><label for="review-next">다음 달에는</label><textarea id="review-next" data-review="next" placeholder="다음 달에 바꿔 볼 것">${esc(r.next)}</textarea></div>
    <p class="head-sub" style="text-align:left">입력하면 자동으로 저장됩니다.</p>
  </section>`;
}

/* ---------- 통계 ---------- */
function monthRate(mk, catId) {
  const ts = tasksOfMonth(mk).filter(t => !catId || t.cat === catId);
  return { total: ts.length, done: doneCount(ts), rate: pct(doneCount(ts), ts.length) };
}

function trendChart(mk) {
  const months = Array.from({ length: 6 }, (_, i) => addMonths(mk, i - 5));
  const W = 320, H = 170, L = 30, R = 8, T = 18, B = 26;
  const iw = W - L - R, ih = H - T - B;
  const step = iw / months.length, bw = Math.min(30, step * 0.55);
  const y = v => T + ih - (v / 100) * ih;
  const grid = [0, 50, 100].map(v =>
    `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const bars = months.map((m, i) => {
    const s = monthRate(m);
    const cx = L + step * i + step / 2;
    const h = (s.rate / 100) * ih;
    return `<rect class="b ${m === mk ? 'cur' : ''}" x="${(cx - bw / 2).toFixed(1)}" y="${(T + ih - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(h, s.total ? 1.5 : 0).toFixed(1)}" rx="4"/>
      ${s.total ? `<text class="val" x="${cx.toFixed(1)}" y="${(T + ih - h - 5).toFixed(1)}" text-anchor="middle">${s.rate}</text>` : ''}
      <text class="axis" x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle">${monthNum(m)}월</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="최근 6개월 달성률">${grid}${bars}</svg>`;
}

function renderStats() {
  const mk = ui.statsMonth, prev = addMonths(mk, -1);
  const cur = monthRate(mk), last = monthRate(prev);
  const diff = cur.rate - last.rate;
  const deltaTxt = !last.total ? '지난달 기록 없음'
    : diff === 0 ? '지난달과 같아요'
    : `지난달보다 ${Math.abs(diff)}%p ${diff > 0 ? '↑' : '↓'}`;

  return `
  ${sampleNote()}
  <section class="view-head">
    <div class="nav-row">
      <button class="icon-btn" type="button" data-act="stats-prev" aria-label="이전 달">‹</button>
      <div class="head-title"><p class="eyebrow">통계</p><h1>${fmtMonth(mk)}</h1></div>
      <button class="icon-btn" type="button" data-act="stats-next" aria-label="다음 달">›</button>
    </div>
  </section>

  <div class="compare">
    <div class="stat"><span class="k">${monthNum(mk)}월 달성률</span><span class="v">${cur.rate}<small>%</small></span>
      <span class="delta ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}">${deltaTxt}</span></div>
    <div class="stat"><span class="k">${monthNum(prev)}월 달성률</span><span class="v">${last.rate}<small>%</small></span>
      <span class="delta">${last.done}/${last.total}개 완료</span></div>
  </div>

  <section class="card">
    <div class="sec-head"><h2>카테고리별 비교</h2>
      <div class="legend"><span><i></i>${monthNum(mk)}월</span><span><i class="prev"></i>${monthNum(prev)}월</span></div></div>
    <div class="cat-compare">
      ${db.categories.map(c => {
        const a = monthRate(mk, c.id), b = monthRate(prev, c.id);
        return `<div class="cat-row" style="--c:${safeColor(c.color)}">
          <span class="name">${esc(c.name)}</span>
          <div class="hbar"><span class="track"><i style="width:${a.rate}%"></i></span><span>${a.rate}% · ${a.done}/${a.total}</span></div>
          <div class="hbar prev"><span class="track"><i style="width:${b.rate}%"></i></span><span>${b.rate}% · ${b.done}/${b.total}</span></div>
        </div>`;
      }).join('')}
    </div>
  </section>

  <section class="card">
    <div class="sec-head"><h2>최근 6개월 달성률 (%)</h2></div>
    ${trendChart(mk)}
  </section>`;
}

/* ---------- 렌더 ---------- */
const view = $('#view');
const fab = $('#fab');

function render() {
  const html = { today: renderToday, week: renderWeek, month: renderMonth, stats: renderStats }[ui.tab]();
  view.innerHTML = html;
  document.querySelectorAll('.tab').forEach(b => {
    if (b.dataset.tab === ui.tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  fab.hidden = ui.tab === 'stats' || (ui.tab === 'month' && ui.monthView === 'review');
  fab.setAttribute('aria-label', ui.tab === 'month' && ui.monthView === 'goals' ? '새 목표' : '새 할 일');
}

function setTab(tab) {
  ui.tab = tab;
  ui.armed = null;
  render();
  window.scrollTo(0, 0);
}

/* ---------- 바텀 시트 ---------- */
const sheet = $('#sheet');
const sheetBody = $('#sheet-body');
let sheetState = null;

function openSheet(html, state) {
  sheetState = state;
  sheetBody.innerHTML = html;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  const first = sheetBody.querySelector('[data-autofocus]');
  if (first && !first.value) setTimeout(() => first.focus(), 60);
}
function closeSheet() {
  sheet.hidden = true;
  sheetState = null;
  sheetBody.innerHTML = '';
  document.body.style.overflow = '';
}

function goalOptions(month, selected) {
  return `<option value="">목표 없음</option>${goalsOfMonth(month).map(g =>
    `<option value="${g.id}" ${g.id === selected ? 'selected' : ''}>${esc(g.title)}</option>`).join('')}`;
}

function openTaskSheet(task, defaults = {}) {
  const t = task || {
    title: '', cat: defaults.cat || ui.quickCat, goal: defaults.goal || '',
    date: defaults.date ?? ui.day, time: '', remind: false, memo: '',
    month: defaults.month || monthOf(defaults.date || ui.day),
  };
  const month = t.date ? monthOf(t.date) : t.month;
  openSheet(`
    <form class="form" data-form="task" autocomplete="off">
      <div class="sheet-head"><h2 id="sheet-title">${task ? '할 일 수정' : '새 할 일'}</h2>
        <button class="icon-btn" type="button" data-act="close-sheet" aria-label="닫기">×</button></div>
      <div class="form-field"><label for="f-title">할 일</label>
        <input id="f-title" class="field" type="text" required maxlength="120" value="${esc(t.title)}" placeholder="무엇을 할까요?" data-autofocus></div>
      <div class="form-field"><span class="form-label">카테고리</span>${catChips('sheet', t.cat)}</div>
      <div class="form-row">
        <div class="form-field"><label for="f-date">날짜</label><input id="f-date" type="date" value="${t.date || ''}"></div>
        <div class="form-field"><label for="f-time">시간</label><input id="f-time" type="time" value="${t.time || ''}"></div>
      </div>
      <div class="form-field"><label for="f-goal">연결할 목표 (<span id="f-goal-month">${monthNum(month)}</span>월)</label>
        <select id="f-goal">${goalOptions(month, t.goal)}</select></div>
      <label class="toggle-row" for="f-remind">
        <span>시간에 알림 받기<small>날짜와 시간이 있어야 울립니다</small></span>
        <span class="switch"><input id="f-remind" type="checkbox" ${t.remind ? 'checked' : ''}><span></span></span>
      </label>
      <div class="form-field"><label for="f-memo">메모</label><textarea id="f-memo" placeholder="필요한 내용을 적어 두세요">${esc(t.memo)}</textarea></div>
      <div class="form-actions">
        ${task ? '<button class="btn danger" type="button" data-act="delete-task">삭제</button>' : ''}
        <button class="btn" type="submit">저장</button>
      </div>
    </form>`, { kind: 'task', id: task?.id, cat: t.cat, month });
}

function openGoalSheet(goal) {
  const g = goal || { title: '', cat: ui.quickCat, month: ui.month };
  openSheet(`
    <form class="form" data-form="goal" autocomplete="off">
      <div class="sheet-head"><h2 id="sheet-title">${goal ? '목표 수정' : '새 목표'}</h2>
        <button class="icon-btn" type="button" data-act="close-sheet" aria-label="닫기">×</button></div>
      <div class="form-field"><label for="g-title">목표</label>
        <input id="g-title" class="field" type="text" required maxlength="120" value="${esc(g.title)}" placeholder="예: 비상금 100만 원 모으기" data-autofocus></div>
      <div class="form-field"><span class="form-label">카테고리</span>${catChips('sheet', g.cat)}</div>
      <div class="form-field"><label for="g-month">월</label><input id="g-month" type="month" required value="${g.month}"></div>
      ${goal ? '' : '<div class="form-field"><label for="g-subs">세부 할 일 (한 줄에 하나씩)</label><textarea id="g-subs" placeholder="자료 조사&#10;계획표 만들기&#10;중간 점검"></textarea></div>'}
      <div class="form-actions">
        ${goal ? '<button class="btn danger" type="button" data-act="delete-goal">삭제</button>' : ''}
        <button class="btn" type="submit">저장</button>
      </div>
      ${goal ? '<p class="head-sub" style="text-align:left">목표를 삭제해도 세부 할 일은 남고, 목표 연결만 풀립니다.</p>' : ''}
    </form>`, { kind: 'goal', id: goal?.id, cat: g.cat });
}

function notifyStatus() {
  if (!('Notification' in window)) return '이 환경에서는 알림을 쓸 수 없어요. 아이폰에서는 홈 화면에 추가한 앱에서 켤 수 있습니다.';
  if (Notification.permission === 'denied') return '알림이 차단되어 있어요. 아이폰 설정 → 알림 → 한달노트에서 허용해 주세요.';
  if (db.settings.notify && Notification.permission === 'granted') return '알림이 켜져 있어요. 앱이 열려 있거나 백그라운드에 있을 때 할 일 시간에 알려 드립니다.';
  return '할 일에 시간과 알림을 설정하면 그 시간에 알려 드립니다.';
}

function openSettings() {
  const hasSamples = db.tasks.some(t => t.sample) || db.goals.some(g => g.sample);
  const notifyOn = db.settings.notify && 'Notification' in window && Notification.permission === 'granted';
  openSheet(`
    <div class="sheet-head"><h2 id="sheet-title">설정</h2>
      <button class="icon-btn" type="button" data-act="close-sheet" aria-label="닫기">×</button></div>

    <div class="settings-group">
      <h3>알림</h3>
      <p>${notifyStatus()}</p>
      <button class="btn ${notifyOn ? 'ghost' : ''}" type="button" data-act="toggle-notify">${notifyOn ? '알림 끄기' : '알림 켜기'}</button>
    </div>

    <div class="settings-group">
      <h3>카테고리</h3>
      <div class="form" style="gap:8px">
        ${db.categories.map(c => `<div class="cat-edit">
          <input type="color" id="cc-${c.id}" value="${safeColor(c.color)}" data-cat-color="${c.id}" aria-label="${esc(c.name)} 색상">
          <input type="text" class="field" id="cn-${c.id}" value="${esc(c.name)}" data-cat-name="${c.id}" maxlength="12" aria-label="카테고리 이름">
          <button class="icon-btn" type="button" data-act="del-cat" data-cat="${c.id}" aria-label="${esc(c.name)} 삭제" ${db.categories.length <= 1 ? 'disabled' : ''}>${ui.armed === 'cat-' + c.id ? '✓' : '×'}</button>
        </div>`).join('')}
      </div>
      ${ui.armed?.startsWith('cat-') ? '<p>한 번 더 누르면 삭제합니다. 그 카테고리의 할 일은 첫 번째 카테고리로 옮겨집니다.</p>' : ''}
      <form class="input-row" data-form="new-cat" autocomplete="off">
        <input id="new-cat" type="text" class="field" maxlength="12" placeholder="새 카테고리 이름" aria-label="새 카테고리 이름">
        <button class="btn" type="submit">추가</button>
      </form>
    </div>

    <div class="settings-group">
      <h3>백업</h3>
      <p>데이터는 이 기기에만 저장됩니다. 기기를 바꾸거나 앱을 지우기 전에 백업 파일을 저장해 두세요.</p>
      <div class="btn-row">
        <button class="btn ghost" type="button" data-act="export">백업 파일 저장</button>
        <label class="btn ghost" for="import-file" style="text-align:center">백업 불러오기</label>
        <input id="import-file" type="file" accept="application/json,.json" hidden>
      </div>
    </div>

    <div class="settings-group">
      <h3>아이폰 홈 화면에 추가하기</h3>
      <ol class="steps">
        <li>Safari로 이 페이지를 엽니다.</li>
        <li>아래쪽 공유 버튼(□↑)을 누릅니다.</li>
        <li>‘홈 화면에 추가’를 누르면 앱 아이콘이 생깁니다.</li>
      </ol>
    </div>

    <div class="settings-group">
      <h3>데이터 정리</h3>
      <div class="btn-row">
        ${hasSamples ? '<button class="btn ghost" type="button" data-act="clear-samples">예시 데이터 지우기</button>' : ''}
        <button class="btn danger ${ui.armed === 'reset' ? 'armed' : ''}" type="button" data-act="reset">${ui.armed === 'reset' ? '한 번 더 누르면 모두 지워집니다' : '전체 초기화'}</button>
      </div>
    </div>`, { kind: 'settings' });
}

/* ---------- 동작 ---------- */
function toggleTask(id) {
  const t = taskById(id);
  if (!t) return;
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  save();
  render();
}

function parseQuick(text) {
  let time = '';
  let title = text.trim();
  const m = title.match(/^(\d{1,2})(?::(\d{2})|시(?:\s*(\d{1,2})분)?)\s*/);
  if (m) {
    const h = Number(m[1]), mi = Number(m[2] || m[3] || 0);
    if (h < 24 && mi < 60) { time = `${pad(h)}:${pad(mi)}`; title = title.slice(m[0].length).trim(); }
  }
  return { title, time };
}

function addTask(fields) {
  const date = fields.date || null;
  const t = {
    id: uid(), title: fields.title, cat: fields.cat, goal: fields.goal || null, date,
    time: fields.time || '', month: date ? monthOf(date) : fields.month, done: false,
    remind: !!fields.remind, memo: fields.memo || '',
  };
  db.tasks.push(t);
  return t;
}

function carryOver(mk) {
  const next = addMonths(mk, 1);
  const open = tasksOfMonth(mk).filter(isOpen);
  const goalMap = {};
  open.forEach(t => {
    let goal = null;
    if (t.goal) {
      if (!goalMap[t.goal]) {
        const g = goalById(t.goal);
        let ng = g && db.goals.find(x => x.month === next && x.title === g.title);
        if (g && !ng) { ng = { id: uid(), title: g.title, cat: g.cat, month: next, from: mk }; db.goals.push(ng); }
        goalMap[t.goal] = ng ? ng.id : null;
      }
      goal = goalMap[t.goal];
    }
    db.tasks.push({
      id: uid(), title: t.title, cat: t.cat, goal, date: t.date ? `${next}-01` : null, time: t.time,
      month: next, done: false, remind: t.remind, memo: t.memo, from: mk,
    });
    t.carried = true;
  });
  save();
  return open.length;
}

function exportData() {
  const json = JSON.stringify(db, null, 2);
  const name = `한달노트-백업-${todayStr()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file], title: '한달노트 백업' }).catch(() => {});
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('백업 파일을 저장했어요.');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.tasks) || !Array.isArray(data.categories)) throw new Error('format');
      db = Object.assign(defaultDb(), data);
      save();
      closeSheet();
      render();
      toast(`백업을 불러왔어요. 할 일 ${db.tasks.length}개`);
    } catch (e) {
      toast('한달노트 백업 파일이 아니에요. 파일을 확인해 주세요.');
    }
  };
  reader.readAsText(file);
}

/* ---------- 알림 ---------- */
async function enableNotify() {
  if (!('Notification' in window)) { toast('아이폰에서는 홈 화면에 추가한 앱에서 알림을 켤 수 있어요.'); return; }
  const p = await Notification.requestPermission();
  db.settings.notify = p === 'granted';
  save();
  toast(p === 'granted' ? '알림을 켰어요.' : '알림이 허용되지 않았어요.');
}

async function showNotice(title, body, tag) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png' }); return; }
    new Notification(title, { body, tag });
  } catch (e) { /* 알림 실패 시 화면 안내만 */ }
}

function checkReminders() {
  const t0 = todayStr(), hm = nowHM();
  db.tasks.forEach(t => {
    if (!t.remind || t.done || t.date !== t0 || !t.time || t.time > hm) return;
    const key = `${t.id}@${t0}T${t.time}`;
    if (db.notified[key]) return;
    db.notified[key] = 1;
    toast(`⏰ ${t.time} ${t.title}`);
    if (db.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
      showNotice(`${t.time} ${t.title}`, `${cat(t.cat).name} · 한달노트`, key);
    }
    save();
  });
  // 오래된 알림 기록 정리
  const keys = Object.keys(db.notified);
  if (keys.length > 300) keys.slice(0, keys.length - 200).forEach(k => delete db.notified[k]);
}

function updateBadge() {
  const left = tasksOfDay(todayStr()).filter(t => !t.done).length;
  try {
    if (navigator.setAppBadge) left ? navigator.setAppBadge(left) : navigator.clearAppBadge();
  } catch (e) { /* 배지 미지원 */ }
}

/* ---------- 토스트 ---------- */
const toastEl = $('#toast');
let toastTimer;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2600);
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', e => {
  const tabBtn = e.target.closest('[data-tab]');
  if (tabBtn) { setTab(tabBtn.dataset.tab); return; }
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const id = el.dataset.id;
  if (act !== 'carry' && act !== 'reset' && act !== 'del-cat' && act !== 'delete-task' && act !== 'delete-goal') {
    if (ui.armed) { ui.armed = null; }
  }

  switch (act) {
    case 'toggle': toggleTask(id); break;
    case 'edit-task': openTaskSheet(taskById(id)); break;
    case 'edit-goal': openGoalSheet(goalById(id)); break;
    case 'new-goal': openGoalSheet(null); break;
    case 'new-task': openTaskSheet(null, { date: el.dataset.day }); break;
    case 'fab':
      if (ui.tab === 'month' && ui.monthView === 'goals') openGoalSheet(null);
      else if (ui.tab === 'month') openTaskSheet(null, { date: ui.sel });
      else if (ui.tab === 'week') openTaskSheet(null, { date: mondayOf(todayStr()) === ui.week ? todayStr() : ui.week });
      else openTaskSheet(null, { date: ui.day });
      break;
    case 'settings': openSettings(); break;
    case 'close-sheet': closeSheet(); break;

    case 'day-prev': ui.day = addDays(ui.day, -1); render(); break;
    case 'day-next': ui.day = addDays(ui.day, 1); render(); break;
    case 'go-today': ui.day = todayStr(); render(); break;
    case 'week-prev': ui.week = addDays(ui.week, -7); render(); break;
    case 'week-next': ui.week = addDays(ui.week, 7); render(); break;
    case 'go-this-week': ui.week = mondayOf(todayStr()); render(); break;
    case 'month-prev': ui.month = addMonths(ui.month, -1); render(); break;
    case 'month-next': ui.month = addMonths(ui.month, 1); render(); break;
    case 'go-this-month': ui.month = monthOf(todayStr()); render(); break;
    case 'stats-prev': ui.statsMonth = addMonths(ui.statsMonth, -1); render(); break;
    case 'stats-next': ui.statsMonth = addMonths(ui.statsMonth, 1); render(); break;
    case 'month-view': ui.monthView = el.dataset.view; render(); break;
    case 'cal-sel': ui.sel = el.dataset.day; render(); break;
    case 'open-day':
      ui.day = el.dataset.day; ui.tab = 'today'; render(); window.scrollTo(0, 0); break;
    case 'open-goals':
      ui.month = monthOf(ui.day); ui.monthView = 'goals'; setTab('month'); break;

    case 'pick-cat': {
      const group = el.closest('.chips');
      group.querySelectorAll('.chip-btn').forEach(b => b.setAttribute('aria-pressed', String(b === el)));
      if (el.dataset.name === 'quick') { ui.quickCat = el.dataset.cat; db.settings.lastCat = el.dataset.cat; save(); }
      else if (sheetState) sheetState.cat = el.dataset.cat;
      break;
    }

    case 'overdue-to-today': {
      const t0 = todayStr();
      let n = 0;
      db.tasks.forEach(t => {
        if (isOpen(t) && t.date && t.date < t0 && monthOf(t.date) === monthOf(t0)) { t.date = t0; n++; }
      });
      save(); render(); toast(`${n}개를 오늘로 옮겼어요.`);
      break;
    }

    case 'carry':
      if (ui.armed !== 'carry') { ui.armed = 'carry'; render(); break; }
      ui.armed = null;
      toast(`${carryOver(ui.month)}개를 ${monthNum(addMonths(ui.month, 1))}월로 넘겼어요.`);
      render();
      break;

    case 'delete-task':
      if (ui.armed !== 'del-task') { ui.armed = 'del-task'; el.textContent = '한 번 더 누르면 삭제'; el.classList.add('armed'); break; }
      ui.armed = null;
      db.tasks = db.tasks.filter(t => t.id !== sheetState.id);
      save(); closeSheet(); render(); toast('할 일을 삭제했어요.');
      break;

    case 'delete-goal':
      if (ui.armed !== 'del-goal') { ui.armed = 'del-goal'; el.textContent = '한 번 더 누르면 삭제'; el.classList.add('armed'); break; }
      ui.armed = null;
      db.tasks.forEach(t => { if (t.goal === sheetState.id) t.goal = null; });
      db.goals = db.goals.filter(g => g.id !== sheetState.id);
      save(); closeSheet(); render(); toast('목표를 삭제했어요.');
      break;

    case 'toggle-notify':
      if (db.settings.notify && 'Notification' in window && Notification.permission === 'granted') {
        db.settings.notify = false; save(); openSettings(); toast('알림을 껐어요.');
      } else enableNotify().then(() => openSettings());
      break;

    case 'del-cat': {
      const cid = el.dataset.cat;
      if (ui.armed !== 'cat-' + cid) { ui.armed = 'cat-' + cid; openSettings(); break; }
      ui.armed = null;
      db.categories = db.categories.filter(c => c.id !== cid);
      const fallback = db.categories[0].id;
      db.tasks.forEach(t => { if (t.cat === cid) t.cat = fallback; });
      db.goals.forEach(g => { if (g.cat === cid) g.cat = fallback; });
      if (ui.quickCat === cid) ui.quickCat = fallback;
      save(); openSettings(); render();
      break;
    }

    case 'export': exportData(); break;
    case 'clear-samples':
      db.tasks = db.tasks.filter(t => !t.sample);
      db.goals = db.goals.filter(g => !g.sample);
      save(); if (sheetState) openSettings(); render(); toast('예시 데이터를 지웠어요.');
      break;
    case 'reset':
      if (ui.armed !== 'reset') { ui.armed = 'reset'; openSettings(); break; }
      ui.armed = null;
      db = defaultDb(); save(); closeSheet(); render(); toast('모든 데이터를 지웠어요.');
      break;
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'quick') {
    const input = $('#quick-input');
    const { title, time } = parseQuick(input.value);
    if (!title) { input.focus(); return; }
    addTask({ title, time, cat: ui.quickCat, date: ui.day });
    save(); render();
    $('#quick-input')?.focus();
  }

  if (kind === 'subtask') {
    const g = goalById(form.dataset.goal);
    const input = form.querySelector('input');
    const title = input.value.trim();
    if (!g || !title) return;
    addTask({ title, cat: g.cat, goal: g.id, month: g.month });
    save(); render();
    $(`#sub-${g.id}`)?.focus();
  }

  if (kind === 'task') {
    const title = $('#f-title').value.trim();
    if (!title) { $('#f-title').focus(); return; }
    const date = $('#f-date').value || null;
    const fields = {
      title, cat: sheetState.cat, date, time: $('#f-time').value, goal: $('#f-goal').value || null,
      remind: $('#f-remind').checked, memo: $('#f-memo').value.trim(),
    };
    if (sheetState.id) {
      const t = taskById(sheetState.id);
      const timeChanged = t.time !== fields.time || t.date !== date;
      Object.assign(t, fields, { month: date ? monthOf(date) : sheetState.month });
      if (timeChanged) Object.keys(db.notified).forEach(k => { if (k.startsWith(t.id + '@')) delete db.notified[k]; });
    } else {
      addTask({ ...fields, month: sheetState.month });
      db.settings.lastCat = fields.cat;
    }
    if (fields.remind && !db.settings.notify) toast('설정에서 알림을 켜면 휴대폰 알림으로도 받을 수 있어요.');
    save(); closeSheet(); render();
  }

  if (kind === 'goal') {
    const title = $('#g-title').value.trim();
    const month = $('#g-month').value || ui.month;
    if (!title) { $('#g-title').focus(); return; }
    if (sheetState.id) {
      const g = goalById(sheetState.id);
      const catChanged = g.cat !== sheetState.cat;
      Object.assign(g, { title, cat: sheetState.cat, month });
      db.tasks.forEach(t => {
        if (t.goal !== g.id) return;
        if (catChanged) t.cat = g.cat;
        if (!t.date) t.month = month;
      });
    } else {
      const g = { id: uid(), title, cat: sheetState.cat, month };
      db.goals.push(g);
      ($('#g-subs')?.value || '').split('\n').map(s => s.trim()).filter(Boolean)
        .forEach(s => addTask({ title: s, cat: g.cat, goal: g.id, month }));
      ui.month = month;
    }
    save(); closeSheet(); render();
  }

  if (kind === 'new-cat') {
    const name = $('#new-cat').value.trim();
    if (!name) return;
    const palette = ['#6B5BD2', '#D2672E', '#1C8C9C', '#7A8B2A', '#B0469E'];
    db.categories.push({ id: uid(), name, color: palette[db.categories.length % palette.length] });
    save(); openSettings(); render();
  }
});

/* 날짜를 바꾸면 그 달의 목표 목록으로 갱신 */
document.addEventListener('change', e => {
  if (e.target.id === 'f-date' && sheetState?.kind === 'task') {
    const month = e.target.value ? monthOf(e.target.value) : sheetState.month;
    const sel = $('#f-goal');
    const keep = sel.value;
    sheetState.month = month;
    sel.innerHTML = goalOptions(month, keep);
    $('#f-goal-month').textContent = monthNum(month);
  }
  if (e.target.id === 'import-file' && e.target.files[0]) importData(e.target.files[0]);
  if (e.target.dataset.catColor) {
    const c = db.categories.find(x => x.id === e.target.dataset.catColor);
    if (c) { c.color = safeColor(e.target.value); save(); render(); }
  }
  if (e.target.dataset.catName) {
    const c = db.categories.find(x => x.id === e.target.dataset.catName);
    const name = e.target.value.trim();
    if (c && name) { c.name = name; save(); render(); }
  }
});

/* 회고는 입력하는 대로 저장 */
let reviewTimer;
document.addEventListener('input', e => {
  const field = e.target.dataset.review;
  if (!field) return;
  const mk = ui.month;
  db.reviews[mk] = db.reviews[mk] || {};
  db.reviews[mk][field] = e.target.value;
  clearTimeout(reviewTimer);
  reviewTimer = setTimeout(save, 400);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !sheet.hidden) closeSheet();
});

/* 좌우로 밀어서 날짜·주·달 넘기기 */
let touch = null;
view.addEventListener('touchstart', e => {
  if (e.touches.length !== 1 || e.target.closest('input, textarea, select')) { touch = null; return; }
  touch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });
view.addEventListener('touchend', e => {
  if (!touch) return;
  const dx = e.changedTouches[0].clientX - touch.x;
  const dy = e.changedTouches[0].clientY - touch.y;
  touch = null;
  if (Math.abs(dx) < 70 || Math.abs(dy) > 45) return;
  const dir = dx < 0 ? 1 : -1;
  if (ui.tab === 'today') ui.day = addDays(ui.day, dir);
  else if (ui.tab === 'week') ui.week = addDays(ui.week, dir * 7);
  else if (ui.tab === 'month') ui.month = addMonths(ui.month, dir);
  else ui.statsMonth = addMonths(ui.statsMonth, dir);
  render();
}, { passive: true });

/* 앱으로 돌아왔을 때 날짜가 바뀌었으면 오늘로 맞춤 */
function onWake() {
  const t0 = todayStr();
  if (t0 !== lastToday) {
    if (ui.day === lastToday) ui.day = t0;
    if (ui.week === mondayOf(lastToday)) ui.week = mondayOf(t0);
    if (ui.month === monthOf(lastToday)) ui.month = monthOf(t0);
    lastToday = t0;
    render();
  }
  checkReminders();
  updateBadge();
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) onWake(); });
setInterval(onWake, 30000);

/* ---------- 시작 ---------- */
if (firstRun) save();
render();
updateBadge();
checkReminders();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
navigator.storage?.persist?.().catch(() => {});
