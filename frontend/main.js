document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;

  // ==========================================
  // 1. THEME ENGINE
  // ==========================================
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
      showToast(`${next.charAt(0).toUpperCase() + next.slice(1)} mode enabled`);
    });
  });

  // ==========================================
  // 2. AUTHENTICATION & ROUTING GUARD
  // ==========================================
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');
  const session = JSON.parse(localStorage.getItem('lumora_session'));

  // Route Guard: Kick unauthenticated users out of the app pages
  if (!isAuthPage && !isLandingPage && !session) {
    window.location.href = '../login.html';
    return;
  }

  // Update Navbar on Landing Page
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
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        applyTheme(next);
      });
    }
  }

  // Handle Login / Signup Form
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
      const email = document.getElementById('authEmail').value;
      const name = isSignup ? document.getElementById('authName').value : email.split('@')[0];

      authSubmitBtn.textContent = 'Loading...';
      authSubmitBtn.disabled = true;

      // Simulate network request
      setTimeout(() => {
        localStorage.setItem('lumora_session', JSON.stringify({ email, name }));
        window.location.href = 'pages/dashboard.html';
      }, 800);
    });
    return;
  }

  // Logout Logic
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('lumora_session');
      window.location.href = '../login.html';
    });
  }

  // ==========================================
  // 3. MOBILE SIDEBAR
  // ==========================================
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

  // ==========================================
  // 4. DATABASE & CRUD LOGIC
  // ==========================================
  const getData = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
  const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  let transactions = getData('lumora_transactions', [
    { id: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' },
    { id: 3, merchant: 'Starbucks', category: 'Meals', date: '2025-10-22', amount: 8.50, status: 'pending' }
  ]);

  let categories = getData('lumora_categories', [
    { id: 1, name: 'Software' }, { id: 2, name: 'Infrastructure' }, { id: 3, name: 'Meals' }
  ]);

  const showToast = (msg) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if (!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> ${msg}`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // Render Dashboard Stats
  if (document.getElementById('dashTable')) {
    const user = JSON.parse(localStorage.getItem('lumora_session'));
    document.querySelector('.page-subtitle').textContent = `Welcome back, ${user.name}`;

    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.querySelector('[data-count="revenue"]').textContent = '$48,392';
    document.querySelector('[data-count="users"]').textContent = transactions.length + " Items";
    document.querySelector('[data-count="expenses"]').textContent = '$' + totalExpenses.toFixed(2);

    const tbody = document.getElementById('tableBody');
    const recent = transactions.slice(0, 5);
    tbody.innerHTML = recent.map(t => `
      <tr>
        <td><strong>${t.merchant}</strong></td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>$${parseFloat(t.amount).toFixed(2)}</td>
        <td><span class="status ${t.status}">${t.status}</span></td>
      </tr>
    `).join('');
  }

  // Render Full CRUD Table (Expenses)
  if (document.getElementById('expensesBody')) {
    const renderTable = () => {
      const tbody = document.getElementById('expensesBody');
      tbody.innerHTML = transactions.map(t => `
        <tr>
          <td><strong>${t.merchant}</strong></td>
          <td>${t.category}</td>
          <td>${t.date}</td>
          <td>$${parseFloat(t.amount).toFixed(2)}</td>
          <td><span class="status ${t.status}">${t.status}</span></td>
          <td class="actions-cell">
            <button class="icon-btn edit-btn" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="icon-btn danger delete-btn" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
          </td>
        </tr>
      `).join('');

      // Bind DELETE
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (!confirm('Are you sure you want to delete this expense?')) return;
          const id = parseInt(e.currentTarget.getAttribute('data-id'));
          transactions = transactions.filter(t => t.id !== id);
          setData('lumora_transactions', transactions);
          renderTable();
          showToast('Expense deleted successfully');
        });
      });

      // Bind UPDATE
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.currentTarget.getAttribute('data-id'));
          const data = transactions.find(t => t.id === id);

          const fields = `
            <div class="form-group"><label class="form-label">Merchant</label><input type="text" name="merchant" class="input-field" required value="${data.merchant}"></div>
            <div class="form-group"><label class="form-label">Category</label>
              <select name="category" class="input-field">
                ${categories.map(c => `<option value="${c.name}" ${data.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" name="amount" class="input-field" required value="${data.amount}"></div>
            <div class="form-group"><label class="form-label">Status</label>
              <select name="status" class="input-field">
                <option value="paid" ${data.status === 'paid' ? 'selected' : ''}>Paid</option>
                <option value="pending" ${data.status === 'pending' ? 'selected' : ''}>Pending</option>
              </select>
            </div>
          `;
          openModal('Edit Expense', fields, (formData) => {
            const idx = transactions.findIndex(t => t.id === id);
            transactions[idx] = {
              ...transactions[idx],
              merchant: formData.get('merchant'),
              category: formData.get('category'),
              amount: parseFloat(formData.get('amount')),
              status: formData.get('status')
            };
            setData('lumora_transactions', transactions);
            renderTable();
          });
        });
      });
    };

    // Bind CREATE
    document.getElementById('add-expense-btn').addEventListener('click', () => {
      const fields = `
        <div class="form-group"><label class="form-label">Merchant</label><input type="text" name="merchant" class="input-field" required placeholder="e.g. Apple Store"></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select name="category" class="input-field">
            ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" name="amount" class="input-field" required placeholder="0.00"></div>
        <div class="form-group"><label class="form-label">Status</label>
          <select name="status" class="input-field">
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      `;
      openModal('Add New Expense', fields, (formData) => {
        transactions.unshift({
          id: Date.now(),
          merchant: formData.get('merchant'),
          category: formData.get('category'),
          amount: parseFloat(formData.get('amount')),
          status: formData.get('status'),
          date: new Date().toISOString().split('T')[0]
        });
        setData('lumora_transactions', transactions);
        renderTable();
      });
    });

    renderTable();
  }

  // ==========================================
  // 5. MODAL SYSTEM
  // ==========================================
  if (!isLandingPage && !isAuthPage) {
    const modalHTML = `
      <div class="modal-overlay" id="globalModal">
        <div class="modal-box">
          <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">Add Record</h3>
            <button class="icon-btn" id="modalClose"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <form id="modalForm">
            <div id="modalFields"></div>
            <div class="modal-actions">
              <button type="button" class="btn btn-outline" id="modalCancel">Cancel</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById('globalModal');
    const modalForm = document.getElementById('modalForm');
    const modalFields = document.getElementById('modalFields');
    const modalTitle = document.getElementById('modalTitle');
    let onModalSave = null;

    window.openModal = (title, fieldsHTML, callback) => {
      modalTitle.textContent = title;
      modalFields.innerHTML = fieldsHTML;
      onModalSave = callback;
      modal.classList.add('open');
    };
    window.closeModal = () => { modal.classList.remove('open'); modalForm.reset(); onModalSave = null; };

    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);

    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (onModalSave) onModalSave(new FormData(modalForm));
      closeModal();
      showToast('Record saved successfully!');
    });
  }
});