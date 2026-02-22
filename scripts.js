/**
 * StudySync – Smart Productivity for Students
 * scripts.js
 */

/* ─────────────────────────────────────────────
   STATE
───────────────────────────────────────────── */
let tasks       = JSON.parse(localStorage.getItem('ss_tasks')     || '[]');
let currentUser = JSON.parse(localStorage.getItem('ss_user')      || 'null');
let studyHours  = JSON.parse(localStorage.getItem('ss_hours')     || '[2,4,1,3,5,2,3]');
let totalPomodoros = parseInt(localStorage.getItem('ss_pomodoros') || '0');

// Timer state
let timerInterval    = null;
let timerRunning     = false;
let timerMode        = 'focus';
let timerSeconds     = 25 * 60;
let totalSeconds     = 25 * 60;
let sessionsCompleted = 0;

const MODES = { focus: 25 * 60, short: 5 * 60, long: 15 * 60 };

const QUOTES = [
  ['"The secret of getting ahead is getting started."',              '— Mark Twain'],
  ['"An investment in knowledge pays the best interest."',           '— Benjamin Franklin'],
  ['"Push yourself, because no one else is going to do it for you."','— Anonymous'],
  ['"Great things never come from comfort zones."',                  '— Anonymous'],
  ['"Don\'t watch the clock; do what it does. Keep going."',         '— Sam Levenson'],
  ['"Success is the sum of small efforts, repeated day in and day out."', '— Robert Collier'],
  ['"Believe you can and you\'re halfway there."',                   '— Theodore Roosevelt'],
];

/* ─────────────────────────────────────────────
   PAGE NAVIGATION
───────────────────────────────────────────── */
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  window.scrollTo(0, 0);

  if (page === 'dashboard') refreshDashboard();
  if (page === 'tasks')     renderTasks();
  if (page === 'progress')  renderProgress();
}

/* ─────────────────────────────────────────────
   THEME
───────────────────────────────────────────── */
function toggleTheme() {
  const html   = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('theme-btn').textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('ss_theme', isDark ? 'light' : 'dark');

  // Redraw pie if on progress page
  if (document.getElementById('page-progress').classList.contains('active')) {
    drawPie(
      tasks.filter(t => t.status === 'Completed').length,
      tasks.filter(t => t.status !== 'Completed').length
    );
  }
}

/* ─────────────────────────────────────────────
   TOAST
───────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3000);
}

/* ─────────────────────────────────────────────
   AUTH
───────────────────────────────────────────── */
function switchAuth(mode) {
  document.getElementById('auth-login-form').style.display  = mode === 'login'  ? 'block' : 'none';
  document.getElementById('auth-signup-form').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active',  mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('⚠️ Please fill in all fields'); return; }

  const name = email.split('@')[0];
  currentUser = { name: name.charAt(0).toUpperCase() + name.slice(1), email };
  localStorage.setItem('ss_user', JSON.stringify(currentUser));
  showToast('✅ Welcome back, ' + currentUser.name + '!');
  showPage('dashboard');
}

function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  if (!name || !email || !pass) { showToast('⚠️ Please fill in all fields'); return; }

  currentUser = { name, email };
  localStorage.setItem('ss_user', JSON.stringify(currentUser));
  showToast('🎉 Account created! Welcome, ' + name + '!');
  showPage('dashboard');
}

/* ─────────────────────────────────────────────
   DASHBOARD
───────────────────────────────────────────── */
function refreshDashboard() {
  // Random quote
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  document.getElementById('quote-text').textContent   = q[0];
  document.getElementById('quote-author').textContent = q[1];

  // User name
  if (currentUser) {
    document.getElementById('student-name').textContent = currentUser.name;
  }

  // Stats
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === 'Completed').length;
  const hrs   = studyHours.reduce((a, b) => a + b, 0);

  document.getElementById('stat-total').textContent  = total;
  document.getElementById('stat-done').textContent   = done;
  document.getElementById('stat-hours').textContent  = hrs + 'h';
  document.getElementById('stat-streak').textContent = 1;

  // Recent tasks
  const list = document.getElementById('dash-tasks-list');
  if (tasks.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;font-size:0.9rem">No tasks yet. Add some tasks!</div>';
    return;
  }
  list.innerHTML = tasks.slice(-4).reverse().map(t => `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div class="badge badge-${t.priority.toLowerCase()}">${t.priority}</div>
      <div style="flex:1;font-size:0.9rem;font-weight:500;${t.status === 'Completed' ? 'text-decoration:line-through;color:var(--text2)' : ''}">
        ${escHtml(t.name)}
      </div>
      <div class="badge badge-${t.status === 'Completed' ? 'done' : 'pending'}">${t.status}</div>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────
   TASK MANAGER
───────────────────────────────────────────── */
function addTask() {
  const name = document.getElementById('task-name').value.trim();
  if (!name) { showToast('⚠️ Task name is required!'); return; }

  const task = {
    id:       Date.now(),
    name,
    subject:  document.getElementById('task-subject').value.trim()   || 'General',
    deadline: document.getElementById('task-deadline').value,
    priority: document.getElementById('task-priority').value,
    status:   document.getElementById('task-status').value,
    created:  new Date().toISOString()
  };

  tasks.unshift(task);
  saveTasks();
  renderTasks();

  // Clear form
  document.getElementById('task-name').value    = '';
  document.getElementById('task-subject').value = '';
  document.getElementById('task-deadline').value = '';
  showToast('✅ Task added!');
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showToast('🗑️ Task deleted');
}

function toggleTaskDone(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
  saveTasks();
  renderTasks();
  if (task.status === 'Completed') showToast('🎉 Task completed!');
}

function saveTasks() {
  localStorage.setItem('ss_tasks', JSON.stringify(tasks));
}

function renderTasks() {
  const fp = document.getElementById('filter-priority').value;
  const fs = document.getElementById('filter-status').value;
  const filtered = tasks.filter(t =>
    (!fp || t.priority === fp) && (!fs || t.status === fs)
  );

  document.getElementById('task-count').textContent = `(${filtered.length})`;
  const list = document.getElementById('task-list');

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div style="font-weight:600;margin-bottom:8px">No tasks found</div>
        <div style="font-size:0.875rem">Add a task above to get started!</div>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(t => `
    <div class="task-item ${t.status === 'Completed' ? 'done' : ''}">
      <div class="task-check ${t.status === 'Completed' ? 'checked' : ''}"
           onclick="toggleTaskDone(${t.id})">
        ${t.status === 'Completed' ? '✓' : ''}
      </div>
      <div class="task-info">
        <div class="task-name">${escHtml(t.name)}</div>
        <div class="task-meta">
          <span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span>
          <span class="badge badge-${t.status === 'Completed' ? 'done' : 'pending'}">${t.status}</span>
          <span class="task-date">📚 ${escHtml(t.subject)}</span>
          ${t.deadline ? `<span class="task-date">📅 ${formatDate(t.deadline)}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="btn btn-sm btn-ghost" onclick="toggleTaskDone(${t.id})">
          ${t.status === 'Completed' ? '↩' : '✓'}
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteTask(${t.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

/* ─────────────────────────────────────────────
   POMODORO TIMER
───────────────────────────────────────────── */
function setMode(mode) {
  if (timerRunning) return;
  timerMode    = mode;
  timerSeconds = totalSeconds = MODES[mode];

  document.querySelectorAll('.mode-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + mode).classList.add('active');

  document.getElementById('start-btn').textContent = '▶ Start';
  updateTimerDisplay();
  updateRing();
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('start-btn').textContent = '▶ Resume';
  } else {
    timerRunning = true;
    document.getElementById('start-btn').textContent = '⏸ Pause';
    timerInterval = setInterval(tick, 1000);
  }
}

function tick() {
  timerSeconds--;
  updateTimerDisplay();
  updateRing();
  if (timerSeconds <= 0) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('start-btn').textContent = '▶ Start';
    onTimerEnd();
  }
}

function onTimerEnd() {
  if (timerMode === 'focus') {
    sessionsCompleted = Math.min(sessionsCompleted + 1, 4);
    totalPomodoros++;
    localStorage.setItem('ss_pomodoros', totalPomodoros);
    document.getElementById('total-pomodoros').textContent = totalPomodoros;
    updateSessionDots();

    // Credit 0.5h study time for today
    const idx = new Date().getDay(); // 0=Sun … 6=Sat
    studyHours[idx === 0 ? 6 : idx - 1] += 0.5;
    localStorage.setItem('ss_hours', JSON.stringify(studyHours));

    showToast('🎉 Focus session complete! Time for a break.');
    setMode('short');
  } else {
    showToast('☕ Break over! Ready to focus?');
    setMode('focus');
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds = totalSeconds = MODES[timerMode];
  document.getElementById('start-btn').textContent = '▶ Start';
  updateTimerDisplay();
  updateRing();
}

function updateTimerDisplay() {
  const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
  const s = String(timerSeconds % 60).padStart(2, '0');
  document.getElementById('timer-display').textContent = `${m}:${s}`;
  document.title = `${m}:${s} – StudySync`;

  const labels = { focus: `Session ${sessionsCompleted + 1} of 4`, short: 'Short Break', long: 'Long Break' };
  document.getElementById('timer-session-label').textContent = labels[timerMode];
}

function updateRing() {
  const circ   = 2 * Math.PI * 108;
  const offset = circ * (1 - timerSeconds / totalSeconds);
  document.getElementById('ring-progress').style.strokeDashoffset = offset;
}

function updateSessionDots() {
  for (let i = 0; i < 4; i++) {
    document.getElementById('dot' + i).classList.toggle('filled', i < sessionsCompleted);
  }
}

/* ─────────────────────────────────────────────
   PROGRESS
───────────────────────────────────────────── */
function renderProgress() {
  renderBarChart();
  const done    = tasks.filter(t => t.status === 'Completed').length;
  const pending = tasks.length - done;
  drawPie(done, pending);
  renderSubjectProgress();
}

function renderBarChart() {
  const max   = Math.max(...studyHours, 1);
  const today = new Date().getDay(); // 0=Sun
  const chart = document.getElementById('bar-chart');
  chart.innerHTML = studyHours.map((h, i) => {
    const isToday = (i === (today === 0 ? 6 : today - 1));
    return `
      <div class="bar-item">
        <div class="bar-val">${h}h</div>
        <div class="bar" style="height:${(h / max) * 120}px;background:${isToday ? 'var(--accent)' : 'var(--accent2)'}"></div>
      </div>`;
  }).join('');
}

function drawPie(done, pending) {
  const canvas = document.getElementById('pie-chart');
  if (!canvas) return;
  const ctx   = canvas.getContext('2d');
  const style = getComputedStyle(document.documentElement);
  const cardBg = style.getPropertyValue('--card').trim() || '#fff';

  ctx.clearRect(0, 0, 140, 140);

  const total  = done + pending || 1;
  const colors = ['#2d9e6b', '#e84855'];
  const data   = [done, pending];
  let start    = -Math.PI / 2;

  data.forEach((val, i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(70, 70);
    ctx.arc(70, 70, 60, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    start += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(70, 70, 35, 0, 2 * Math.PI);
  ctx.fillStyle = cardBg;
  ctx.fill();

  // Centre text
  ctx.fillStyle   = style.getPropertyValue('--text').trim() || '#111';
  ctx.font        = 'bold 15px Syne, sans-serif';
  ctx.textAlign   = 'center';
  ctx.fillText(`${done}/${done + pending}`, 70, 75);
}

function renderSubjectProgress() {
  const subjects = {};
  tasks.forEach(t => {
    if (!subjects[t.subject]) subjects[t.subject] = { total: 0, done: 0 };
    subjects[t.subject].total++;
    if (t.status === 'Completed') subjects[t.subject].done++;
  });

  const sp = document.getElementById('subject-progress');
  if (Object.keys(subjects).length === 0) {
    sp.innerHTML = '<div style="text-align:center;color:var(--text2);padding:20px;font-size:0.9rem">Add tasks to see subject progress</div>';
    return;
  }

  sp.innerHTML = Object.entries(subjects).map(([sub, data]) => {
    const pct = Math.round((data.done / data.total) * 100);
    return `
      <div class="progress-bar-wrap">
        <div class="progress-bar-label">
          <span>${escHtml(sub)}</span>
          <span>${data.done}/${data.total}</span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" style="width:${pct}%;background:var(--accent)"></div>
        </div>
      </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────────── */
function submitContact() {
  const name    = document.getElementById('contact-name').value.trim();
  const email   = document.getElementById('contact-email').value.trim();
  const message = document.getElementById('contact-message').value.trim();
  if (!name || !email || !message) { showToast('⚠️ Please fill in all required fields'); return; }
  showToast('✅ Message sent! We\'ll get back to you soon. 🎉');
  document.getElementById('contact-name').value    = '';
  document.getElementById('contact-email').value   = '';
  document.getElementById('contact-message').value = '';
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
(function init() {
  // Restore theme
  const savedTheme = localStorage.getItem('ss_theme');
  if (savedTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.getElementById('theme-btn').textContent = '☀️';
  }

  // Restore user name
  if (currentUser) {
    document.getElementById('student-name').textContent = currentUser.name;
  }

  // Timer UI
  document.getElementById('total-pomodoros').textContent = totalPomodoros;
  updateTimerDisplay();
  updateRing();

  // Keyboard shortcut: Space = start/pause timer when on timer page
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (document.getElementById('page-timer').classList.contains('active')) {
        e.preventDefault();
        toggleTimer();
      }
    }
  });
})();
