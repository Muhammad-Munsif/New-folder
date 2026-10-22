(function () {
  'use strict';
  var root = document.documentElement;
  // Helpers
  function savePref(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function readPref(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function showToast(msg) {
    var stack = document.getElementById('toastStack');
    if (!stack) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> ' + msg;
    stack.appendChild(el);
    setTimeout(function () { el.style.opacity = '0'; setTimeout(function () { el.remove() }, 300); }, 3000);
  }
  // --- THEME ENGINE ---
  var THEME_KEY = 'lumora-theme-mode', ACCENT_KEY = 'lumora-accent';
  var mq = matchMedia('(prefers-color-scheme: dark)');

  function resolveTheme(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    if (mode === 'system') return mq.matches ? 'dark' : 'light';
    return mq.matches ? 'dark' : 'light';
  }
  function applyThemeMode(mode, persist) {
    if (persist) savePref(THEME_KEY, mode);
    var resolved = resolveTheme(mode);
    root.setAttribute('data-theme', resolved);
    root.setAttribute('data-theme-mode', mode);

    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.setAttribute('aria-pressed', String(resolved === 'dark'));
  }
  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyThemeMode(next, true);
    showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
  }
  function applyAccent(accent, persist) {
    if (persist) savePref(ACCENT_KEY, accent);
    root.setAttribute('data-accent', accent);
  }
  // Init Theme
  applyThemeMode(readPref(THEME_KEY) || 'system', false);
  applyAccent(readPref(ACCENT_KEY) || 'indigo', false);

  // Bind Theme Toggles (check if they exist on the page)
  var toggles = ['themeToggle', 'dashThemeBtn', 'mobileThemeBtn'];
  toggles.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', toggleTheme);
  });
  // --- MOBILE MENU ---
  var menuBtn = document.getElementById('menuBtn');
  var navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navMenu.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && !menuBtn.contains(e.target)) {
        navMenu.classList.remove('open');
      }
    });
  }

  // --- ACTIVE NAV HIGHLIGHTING ---
  var currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dash-nav-item').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href && href.includes(currentPath)) {
      link.classList.add('active');
    }
  });
  // --- DASHBOARD SPECIFIC (Only runs if ID exists) ---
  var dashTable = document.getElementById('dashTable');
  if (dashTable) {
    // 1. KPI Counter Animation
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var start = performance.now();
      function frame(now) {
        var p = Math.min((now - start) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    // 2. Line Chart Drawing
    var linePath = document.getElementById('linePath');
    var lineArea = document.getElementById('lineArea');
    if (linePath) {
      var values = [22, 30, 42, 38, 55, 48, 62, 58, 74, 68, 78, 84];
      var W = 400, H = 180, pad = 10;
      var min = Math.min(...values), max = Math.max(...values);
      var span = max - min, stepX = (W - pad * 2) / (values.length - 1);

      var d = '';
      values.forEach(function (v, i) {
        var x = pad + i * stepX;
        var y = pad + (1 - (v - min) / span) * (H - pad * 2);
        d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
      });
      linePath.setAttribute('d', d);
      if (lineArea) lineArea.setAttribute('d', d + ' L ' + (W - pad) + ' ' + H + ' L ' + pad + ' ' + H + ' Z');
    }
    // 3. Populate Data Table
    var transactions = [
      { name: 'Elena Martinez', product: 'Pro plan', date: 'Oct 14', amount: 49, status: 'paid', color: '#6366f1' },
      { name: 'James Chen', product: 'Starter', date: 'Oct 14', amount: 19, status: 'paid', color: '#ec4899' },
      { name: 'Sofia Reyes', product: 'Pro plan', date: 'Oct 13', amount: 49, status: 'pending', color: '#10b981' },
      { name: 'Marcus Kim', product: 'Enterprise', date: 'Oct 13', amount: 99, status: 'paid', color: '#0ea5e9' }
    ];
    var tbody = document.getElementById('tableBody');
    tbody.innerHTML = transactions.map(function (t) {
      return `<tr>
        <td><div class="td-user"><span class="td-avatar" style="background:${t.color}">${t.name.charAt(0)}</span> ${t.name}</div></td>
        <td>${t.product}</td>
        <td>${t.date}</td>
        <td>$${t.amount}</td>
        <td><span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span></td>
      </tr>`;
    }).join('');
  }
  // --- EXPENSES PAGE SPECIFIC ---
  var expensesTable = document.getElementById('expensesTable');
  if (expensesTable) {
    var expenses = [
      { merchant: 'Figma Pro', category: 'Software', date: 'Oct 15, 2025', amount: 15.00, status: 'paid' },
      { merchant: 'AWS Hosting', category: 'Infrastructure', date: 'Oct 14, 2025', amount: 124.50, status: 'paid' },
      { merchant: 'Starbucks', category: 'Meals', date: 'Oct 14, 2025', amount: 12.80, status: 'pending' },
      { merchant: 'Adobe CC', category: 'Software', date: 'Oct 12, 2025', amount: 54.99, status: 'paid' },
      { merchant: 'Uber', category: 'Travel', date: 'Oct 11, 2025', amount: 24.00, status: 'paid' }
    ];
    var expBody = document.getElementById('expensesBody');
    expBody.innerHTML = expenses.map(function (e) {
      return `<tr>
        <td><strong>${e.merchant}</strong></td>
        <td>${e.category}</td>
        <td>${e.date}</td>
        <td>$${e.amount.toFixed(2)}</td>
        <td><span class="status-pill status-${e.status}">${e.status.toUpperCase()}</span></td>
      </tr>`;
    }).join('');
  }
  // --- SETTINGS SPECIFIC ---
  document.querySelectorAll('.switch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      var isChecked = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', !isChecked);
    });
  });
})();