document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;

  // --- UTILS & SECURITY ---
  const showToast = (msg, isError = false) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if (!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';

    const icon = document.createElement('i');
    icon.className = isError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    icon.style.color = isError ? "var(--danger)" : "var(--success)";

    const text = document.createElement('span');
    text.textContent = msg;

    el.appendChild(icon);
    el.appendChild(text);
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // --- THEME ENGINE ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');

  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if (btn) btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });

  // --- AUTH & ROUTING GUARD ---
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');

  let session = null;
  try {
    const raw = localStorage.getItem('lumora_session');
    if (raw) session = JSON.parse(atob(raw));
  } catch (e) { session = null; }

  if (!isAuthPage && !isLandingPage && !session) {
    window.location.href = '../login.html';
    return;
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('lumora_session');
      window.location.href = '../login.html';
    });
  }

  // --- LANDING PAGE NAVBAR ---
  if (isLandingPage) {
    const navActions = document.getElementById('landingNavActions');
    if (navActions) {
      if (session) {
        navActions.innerHTML = `
          <button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button>
          <a href="pages/dashboard.html" class="btn btn-primary">Go to Dashboard</a>
        `;
      } else {
        navActions.innerHTML = `
          <button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button>
          <a href="login.html" class="btn btn-outline">Sign In</a>
          <a href="login.html" class="btn btn-primary">Get Started</a>
        `;
      }
      document.getElementById('landingThemeBtn').addEventListener('click', () => {
        applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    }
  }

  // --- AUTH FORM ---
  if (isAuthPage) {
    let isSignup = false;
    const authForm = document.getElementById('authForm');
    const nameGroup = document.getElementById('nameGroup');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const toggleText = document.getElementById('toggleText');
    const toggleAuth = document.getElementById('toggleAuth');

    toggleAuth.addEventListener('click', () => {
      isSignup = !isSignup;
      authTitle.textContent = isSignup ? 'Create an account' : 'Welcome back';
      authSubtitle.textContent = isSignup ? 'Start managing your finances today.' : 'Enter your credentials to access your account.';
      authSubmitBtn.textContent = isSignup ? 'Sign Up' : 'Sign In';
      toggleText.textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
      toggleAuth.textContent = isSignup ? 'Log in' : 'Sign up';
      nameGroup.style.display = isSignup ? 'block' : 'none';
    });

    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Invalid email format', true); return; }
      if (password.length < 8) { showToast('Password must be 8+ characters', true); return; }

      const name = isSignup ? document.getElementById('authName').value : email.split('@')[0];
      if (isSignup && name.length < 2) { showToast('Name too short', true); return; }

      authSubmitBtn.textContent = 'Loading...';
      authSubmitBtn.disabled = true;

      setTimeout(() => {
        const mockToken = btoa(JSON.stringify({ email, name }));
        localStorage.setItem('lumora_session', mockToken);
        window.location.href = 'pages/dashboard.html';
      }, 800);
    });
    return;
  }

  // --- MOBILE SIDEBAR ---
  const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  if (mobileSidebarBtn && appSidebar) {
    mobileSidebarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      appSidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (appSidebar.classList.contains('open') && !appSidebar.contains(e.target) && !mobileSidebarBtn.contains(e.target)) {
        appSidebar.classList.remove('open');
      }
    });
  }

  // --- DATA LAYER ---
  let transactions = JSON.parse(localStorage.getItem('lumora_transactions')) || [
    { id: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' }
  ];
  const saveData = () => localStorage.setItem('lumora_transactions', JSON.stringify(transactions));

  // --- MODAL INJECTION ---
  if (!isLandingPage && !isAuthPage) {
    const modalHTML = `
      <div class="modal-overlay" id="globalModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Add Record</h3>
            <button class="icon-btn modal-close"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form id="modalForm">
            <input type="hidden" id="recordId">
            <div class="form-group">
              <label class="form-label">Merchant</label>
              <input type="text" id="merchantInput" class="input-field" required minlength="2" placeholder="e.g. Apple Store">
            </div>
            <div class="form-group">
              <label class="form-label">Amount ($)</label>
              <input type="number" step="0.01" min="0.01" id="amountInput" class="input-field" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="categoryInput" class="input-field">
                <option value="Software">Software</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Meals">Meals</option>
                <option value="Travel">Travel</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="statusInput" class="input-field">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline modal-close">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Record</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // --- DASHBOARD PAGE ---
  if (document.getElementById('dashTable')) {
    if (session) document.querySelector('.page-subtitle').textContent = `Welcome back, ${session.name}`;

    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('[data-count="revenue"]').textContent = '$48,392';
    document.querySelector('[data-count="users"]').textContent = transactions.length + " Items";
    document.querySelector('[data-count="expenses"]').textContent = '$' + totalExpenses.toFixed(2);

    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = ''; // Safe clear

    transactions.slice(0, 5).forEach(t => {
      const tr = document.createElement('tr');
      ['merchant', 'category', 'date'].forEach(key => {
        const td = document.createElement('td');
        if (key === 'merchant') {
          const strong = document.createElement('strong');
          strong.textContent = t[key]; // XSS SAFE
          td.appendChild(strong);
        } else {
          td.textContent = t[key];
        }
        tr.appendChild(td);
      });

      const tdAmount = document.createElement('td');
      tdAmount.textContent = '$' + parseFloat(t.amount).toFixed(2);
      tr.appendChild(tdAmount);

      const tdStatus = document.createElement('td');
      const span = document.createElement('span');
      span.className = `status ${t.status}`;
      span.textContent = t.status;
      tdStatus.appendChild(span);
      tr.appendChild(tdStatus);

      tbody.appendChild(tr);
    });
  }

  // --- EXPENSES PAGE (CRUD) ---
  if (document.getElementById('expensesBody')) {
    const tbody = document.getElementById('expensesBody');

    const renderTable = () => {
      tbody.innerHTML = ''; // Safe clear

      transactions.forEach(t => {
        const tr = document.createElement('tr');

        const tdMerchant = document.createElement('td');
        tdMerchant.textContent = t.merchant; // XSS SAFE
        tr.appendChild(tdMerchant);

        const tdCat = document.createElement('td');
        tdCat.textContent = t.category;
        tr.appendChild(tdCat);

        const tdDate = document.createElement('td');
        tdDate.textContent = t.date;
        tr.appendChild(tdDate);

        const tdAmount = document.createElement('td');
        tdAmount.textContent = '$' + parseFloat(t.amount).toFixed(2);
        tr.appendChild(tdAmount);

        const tdStatus = document.createElement('td');
        const span = document.createElement('span');
        span.className = `status ${t.status}`;
        span.textContent = t.status;
        tdStatus.appendChild(span);
        tr.appendChild(tdStatus);

        const tdActions = document.createElement('td');
        tdActions.className = 'actions-cell';

        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>'; // static HTML
        editBtn.addEventListener('click', () => {
          document.getElementById('modalTitle').textContent = 'Edit Expense';
          document.getElementById('recordId').value = t.id;
          document.getElementById('merchantInput').value = t.merchant;
          document.getElementById('amountInput').value = t.amount;
          document.getElementById('categoryInput').value = t.category;
          document.getElementById('statusInput').value = t.status;
          document.getElementById('globalModal').classList.add('open');
        });

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn danger';
        delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        delBtn.addEventListener('click', () => {
          if (confirm('Delete this record?')) {
            transactions = transactions.filter(item => item.id !== t.id);
            saveData(); renderTable(); showToast('Record deleted');
          }
        });

        tdActions.appendChild(editBtn);
        tdActions.appendChild(delBtn);
        tr.appendChild(tdActions);

        tbody.appendChild(tr);
      });
    };

    renderTable();

    document.getElementById('add-expense-btn').addEventListener('click', () => {
      document.getElementById('modalTitle').textContent = 'Add New Expense';
      document.getElementById('modalForm').reset();
      document.getElementById('recordId').value = '';
      document.getElementById('globalModal').classList.add('open');
    });

    // Handle Form Submit (Create/Update)
    document.getElementById('modalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('recordId').value;
      const merchant = document.getElementById('merchantInput').value.trim();
      const amount = parseFloat(document.getElementById('amountInput').value);
      const category = document.getElementById('categoryInput').value;
      const status = document.getElementById('statusInput').value;

      if (id) {
        // UPDATE
        const idx = transactions.findIndex(t => t.id === parseInt(id));
        transactions[idx] = { ...transactions[idx], merchant, amount, category, status };
        showToast('Record updated');
      } else {
        // CREATE
        transactions.unshift({ id: Date.now(), merchant, amount, category, status, date: new Date().toISOString().split('T')[0] });
        showToast('Record created');
      }
      saveData();
      document.getElementById('globalModal').classList.remove('open');
      renderTable();
    });
  }

  // --- MODAL CLOSE LOGIC ---
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => document.getElementById('globalModal').classList.remove('open'));
  });

  // --- REPORTS PAGE ---
  if (document.getElementById('exportCsvBtn')) {
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      let csv = 'Date,Merchant,Category,Amount,Status\n';
      transactions.forEach(t => { csv += `${t.date},"${t.merchant}","${t.category}",${t.amount},${t.status}\n`; });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `export_${Date.now()}.csv`; a.click();
      showToast('CSV Downloaded!');
    });
  }

  // --- SETTINGS PAGE ---
  if (document.getElementById('settingsPage')) {
    const accentPicker = document.getElementById('accentPicker');
    if (accentPicker) {
      accentPicker.value = localStorage.getItem('lumora_accent') || '#4f46e5';
      accentPicker.addEventListener('input', (e) => {
        root.style.setProperty('--primary', e.target.value);
        localStorage.setItem('lumora_accent', e.target.value);
      });
    }
    if (localStorage.getItem('lumora_accent')) {
      root.style.setProperty('--primary', localStorage.getItem('lumora_accent'));
    }
  }
});