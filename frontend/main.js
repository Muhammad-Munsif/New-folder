(function () {
  'use strict';

  var root = document.documentElement;

  // --- HELPERS ---
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
  var THEME_KEY = 'lumora-theme-mode';
  var mq = matchMedia('(prefers-color-scheme: dark)');

  function resolveTheme(mode) {
    if (mode === 'light' || mode === 'dark') return mode;
    return mq.matches ? 'dark' : 'light';
  }

  function applyThemeMode(mode, persist) {
    if (persist) savePref(THEME_KEY, mode);
    var resolved = resolveTheme(mode);
    root.setAttribute('data-theme', resolved);
    var toggle = document.getElementById('themeToggle');
    if (toggle) toggle.setAttribute('aria-pressed', String(resolved === 'dark'));
  }

  function toggleTheme() {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyThemeMode(next, true);
    showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
  }

  applyThemeMode(readPref(THEME_KEY) || 'system', false);

  ['themeToggle', 'dashThemeBtn'].forEach(function (id) {
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
    if (href && href.includes(currentPath)) link.classList.add('active');
  });

  // --- MODAL SYSTEM ---
  var modalHTML = `
    <div class="modal-overlay" id="globalModal">
      <div class="modal-box">
        <div class="modal-header">
          <h3 id="modalTitle">Add Record</h3>
          <button class="modal-close" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <form id="modalForm">
          <div id="modalFields"></div>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" id="modalCancel">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Record</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  var modal = document.getElementById('globalModal');
  var modalForm = document.getElementById('modalForm');
  var modalFields = document.getElementById('modalFields');
  var modalTitle = document.getElementById('modalTitle');
  var currentSaveCallback = null;

  function openModal(title, fieldsHTML, onSave) {
    modalTitle.textContent = title;
    modalFields.innerHTML = fieldsHTML;
    currentSaveCallback = onSave;
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    modalForm.reset();
    currentSaveCallback = null;
  }

  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalCancel').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

  modalForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (currentSaveCallback) currentSaveCallback(new FormData(modalForm));
    closeModal();
    showToast('Record saved successfully!');
  });

  // --- DASHBOARD LOGIC ---
  var dashTable = document.getElementById('dashTable');
  if (dashTable) {
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

    var transactions = [
      { name: 'Elena Martinez', product: 'Pro plan', date: 'Oct 14', amount: 49, status: 'paid', color: '#6366f1' },
      { name: 'James Chen', product: 'Starter', date: 'Oct 14', amount: 19, status: 'paid', color: '#ec4899' }
    ];
    var tbody = document.getElementById('tableBody');
    if (tbody) {
      tbody.innerHTML = transactions.map(function (t) {
        return `<tr>
          <td><div class="td-user"><span class="td-avatar" style="background:${t.color}">${t.name.charAt(0)}</span> ${t.name}</div></td>
          <td>${t.product}</td><td>${t.date}</td><td>$${t.amount}</td>
          <td><span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span></td>
        </tr>`;
      }).join('');
    }
  }

  // --- EXPENSES PAGE ---
  var expensesBody = document.getElementById('expensesBody');
  if (expensesBody) {
    var expenses = [
      { merchant: 'Figma Pro', category: 'Software', date: 'Oct 15, 2025', amount: 15.00, status: 'paid' },
      { merchant: 'AWS Hosting', category: 'Infrastructure', date: 'Oct 14, 2025', amount: 124.50, status: 'paid' }
    ];

    function renderExpenses() {
      expensesBody.innerHTML = expenses.map(function (e) {
        return `<tr>
          <td><strong>${e.merchant}</strong></td><td>${e.category}</td><td>${e.date}</td>
          <td>$${parseFloat(e.amount).toFixed(2)}</td>
          <td><span class="status-pill status-${e.status}">${e.status.toUpperCase()}</span></td>
        </tr>`;
      }).join('');
    }
    renderExpenses();

    var addExpBtn = document.getElementById('add-expense-btn');
    if (addExpBtn) {
      addExpBtn.addEventListener('click', function () {
        var fields = `
          <div class="form-group"><label>Merchant Name</label><input type="text" name="merchant" class="form-input" required placeholder="e.g. Starbucks"></div>
          <div class="form-group"><label>Category</label>
            <select name="category" class="form-input">
              <option>Software</option><option>Meals</option><option>Travel</option><option>Infrastructure</option>
            </select>
          </div>
          <div class="form-group"><label>Amount ($)</label><input type="number" step="0.01" name="amount" class="form-input" required placeholder="0.00"></div>
          <div class="form-group"><label>Status</label>
            <select name="status" class="form-input">
              <option value="paid">Paid</option><option value="pending">Pending</option>
            </select>
          </div>
        `;

        openModal('Add New Expense', fields, function (formData) {
          var newExp = {
            merchant: formData.get('merchant'),
            category: formData.get('category'),
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            amount: parseFloat(formData.get('amount')),
            status: formData.get('status')
          };
          expenses.unshift(newExp);
          renderExpenses();
        });
      });
    }
  }

  // --- CATEGORIES PAGE ---
  var categoriesGrid = document.getElementById('categoriesGrid');
  if (categoriesGrid) {
    var addCatBtn = document.getElementById('add-category-btn');
    if (addCatBtn) {
      addCatBtn.addEventListener('click', function () {
        var fields = `
          <div class="form-group"><label>Category Name</label><input type="text" name="name" class="form-input" required placeholder="e.g. Marketing"></div>
          <div class="form-group"><label>Budget Amount ($)</label><input type="number" name="budget" class="form-input" required placeholder="500"></div>
        `;

        openModal('Create New Category', fields, function (formData) {
          var name = formData.get('name');
          var budget = formData.get('budget');

          var newCard = document.createElement('div');
          newCard.className = 'card';
          newCard.innerHTML = `
            <div class="card-icon" style="background: linear-gradient(135deg, #a855f7, #6366f1);"><i class="fa-solid fa-tag"></i></div>
            <h3>${name}</h3>
            <p style="color:var(--text-muted); font-size:.85rem; margin-top:4px;">$${budget} allocated this month</p>
          `;
          categoriesGrid.prepend(newCard);
        });
      });
    }
  }

  // --- SETTINGS TOGGLES ---
  document.querySelectorAll('.switch').forEach(function (sw) {
    sw.addEventListener('click', function () {
      var isChecked = sw.getAttribute('aria-checked') === 'true';
      sw.setAttribute('aria-checked', !isChecked);
    });
  });

})();