document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;

  // --- THEME ENGINE ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');

  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if(btn) btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`${next.charAt(0).toUpperCase() + next.slice(1)} mode enabled`);
    });
  });

  // --- AUTHENTICATION LOGIC ---
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');
  const isLoggedIn = localStorage.getItem('lumora_user');

  // 1. Protect App Pages
  if (!isAuthPage && !isLandingPage && !isLoggedIn) {
    window.location.href = '../login.html';
    return;
  }

  // 2. Update Navbar based on login state
  if (isLandingPage) {
    const navActions = document.querySelector('.landing-nav .nav-actions');
    if (navActions) {
      if (isLoggedIn) {
        navActions.innerHTML = `
          <button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button>
          <a href="pages/dashboard.html" class="btn btn-primary btn-sm">Go to Dashboard</a>
        `;
        document.getElementById('landingThemeBtn').addEventListener('click', () => {
          const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          applyTheme(next);
        });
      } else {
        navActions.innerHTML = `
          <button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button>
          <a href="login.html" class="btn btn-ghost btn-sm">Sign In</a>
          <a href="login.html" class="btn btn-primary btn-sm">Get Started</a>
        `;
        document.getElementById('landingThemeBtn').addEventListener('click', () => {
          const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
          applyTheme(next);
        });
      }
    }
  }

  // 3. Handle Login/Signup Form
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
      if (isSignup) {
        authTitle.textContent = 'Create an account';
        authSubtitle.textContent = 'Start managing your finances today.';
        authSubmitBtn.textContent = 'Sign Up';
        toggleText.textContent = 'Already have an account?';
        toggleAuth.textContent = 'Log in';
        nameGroup.style.display = 'block';
      } else {
        authTitle.textContent = 'Welcome back';
        authSubtitle.textContent = 'Enter your credentials to access your account.';
        authSubmitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleAuth.textContent = 'Sign up';
        nameGroup.style.display = 'none';
      }
    });

    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const name = isSignup ? document.getElementById('authName').value : email.split('@')[0];
      
      authSubmitBtn.textContent = 'Loading...';
      authSubmitBtn.disabled = true;

      setTimeout(() => {
        localStorage.setItem('lumora_user', JSON.stringify({ email, name }));
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
  const CURRENCIES = { USD: { symbol: '$', rate: 1 }, EUR: { symbol: '€', rate: 0.92 }, GBP: { symbol: '£', rate: 0.79 }, INR: { symbol: '₹', rate: 83.2 } };
  let currentCurrency = localStorage.getItem('lumora_currency') || 'USD';
  const formatMoney = (amount) => CURRENCIES[currentCurrency].symbol + (parseFloat(amount) * CURRENCIES[currentCurrency].rate).toFixed(2);

  const getData = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
  const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  let transactions = getData('lumora_transactions', [
    { id: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' },
    { id: 3, merchant: 'Starbucks', category: 'Meals', date: '2025-10-22', amount: 8.50, status: 'pending' }
  ]);

  let categories = getData('lumora_categories', [
    { id: 1, name: 'Software', budget: 200, icon: 'fa-code', gradient: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)' },
    { id: 2, name: 'Infrastructure', budget: 500, icon: 'fa-server', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
    { id: 3, name: 'Meals', budget: 150, icon: 'fa-utensils', gradient: 'linear-gradient(135deg, #10b981, #059669)' }
  ]);

  const showToast = (msg) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if(!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fa-solid fa-check-circle"></i> ${msg}`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath.split('/').pop()) link.classList.add('active');
  });

  // --- MODAL SYSTEM ---
  if (!isLandingPage) {
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

    const openModal = (title, fieldsHTML, callback) => {
      modalTitle.textContent = title;
      modalFields.innerHTML = fieldsHTML;
      onModalSave = callback;
      modal.classList.add('open');
    };
    const closeModal = () => { modal.classList.remove('open'); modalForm.reset(); onModalSave = null; };
    
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    
    modalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (onModalSave) onModalSave(new FormData(modalForm));
      closeModal();
      showToast('Record saved successfully!');
    });

    // --- PAGE LOGIC ---
    if (document.getElementById('dashTable')) {
      const user = JSON.parse(localStorage.getItem('lumora_user'));
      document.querySelector('.page-subtitle').textContent = `Welcome back, ${user.name}`;

      const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
      document.querySelector('[data-count="revenue"]').textContent = formatMoney(48392);
      document.querySelector('[data-count="users"]').textContent = transactions.length + " Items";
      document.querySelector('[data-count="expenses"]').textContent = formatMoney(totalExpenses);

      const tbody = document.getElementById('tableBody');
      const recent = transactions.slice(0, 5);
      tbody.innerHTML = recent.map(t => `
        <tr><td><strong>${t.merchant}</strong></td><td>${t.category}</td><td>${t.date}</td><td>${formatMoney(t.amount)}</td><td><span class="status ${t.status}">${t.status}</span></td></tr>
      `).join('');
    }

    if (document.getElementById('expensesBody')) {
      let currentPage = 1; const rowsPerPage = 5;
      let sortKey = 'date', sortAsc = false;
      let searchVal = '', filterStatus = 'all', filterCat = 'all';

      const renderExpenses = () => {
        const tbody = document.getElementById('expensesBody');
        const emptyState = document.getElementById('emptyState');
        
        let filtered = transactions.filter(t => {
          const matchesSearch = t.merchant.toLowerCase().includes(searchVal) || t.category.toLowerCase().includes(searchVal);
          const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
          const matchesCat = filterCat === 'all' || t.category === filterCat;
          return matchesSearch && matchesStatus && matchesCat;
        });

        filtered.sort((a, b) => {
          let valA = a[sortKey], valB = b[sortKey];
          if(typeof valA === 'string') valA = valA.toLowerCase(), valB = valB.toLowerCase();
          if(valA < valB) return sortAsc ? -1 : 1;
          if(valA > valB) return sortAsc ? 1 : -1;
          return 0;
        });

        const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
        if(currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * rowsPerPage;
        const paginated = filtered.slice(start, start + rowsPerPage);

        if(paginated.length === 0) {
          tbody.innerHTML = '';
          if(emptyState) emptyState.style.display = 'block';
        } else {
          if(emptyState) emptyState.style.display = 'none';
          tbody.innerHTML = paginated.map(t => `
            <tr>
              <td><strong>${t.merchant}</strong></td><td>${t.category}</td><td>${t.date}</td>
              <td>${formatMoney(t.amount)}</td>
              <td><span class="status ${t.status}">${t.status}</span></td>
              <td class="actions-cell">
                <button class="icon-btn edit-btn" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
                <button class="icon-btn danger delete-btn" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
              </td>
            </tr>
          `).join('');
        }

        document.getElementById('pageInfo').textContent = `Showing ${filtered.length ? start+1 : 0}-${Math.min(start+rowsPerPage, filtered.length)} of ${filtered.length}`;
        document.getElementById('prevBtn').disabled = currentPage === 1;
        document.getElementById('nextBtn').disabled = currentPage === totalPages;

        document.querySelectorAll('.delete-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            transactions = transactions.filter(t => t.id !== id);
            setData('lumora_transactions', transactions);
            renderExpenses(); showToast('Expense deleted');
          });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            openExpenseModal(transactions.find(x => x.id === id));
          });
        });
      };

      document.getElementById('searchExpense').addEventListener('input', (e) => { searchVal = e.target.value.toLowerCase(); currentPage = 1; renderExpenses(); });
      document.getElementById('filterStatus').addEventListener('change', (e) => { filterStatus = e.target.value; currentPage = 1; renderExpenses(); });
      document.getElementById('filterCategory').addEventListener('change', (e) => { filterCat = e.target.value; currentPage = 1; renderExpenses(); });

      document.getElementById('thMerchant').addEventListener('click', () => { sortKey='merchant'; sortAsc=!sortAsc; renderExpenses(); });
      document.getElementById('thDate').addEventListener('click', () => { sortKey='date'; sortAsc=!sortAsc; renderExpenses(); });
      document.getElementById('thAmount').addEventListener('click', () => { sortKey='amount'; sortAsc=!sortAsc; renderExpenses(); });

      document.getElementById('prevBtn').addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderExpenses(); }});
      document.getElementById('nextBtn').addEventListener('click', () => { currentPage++; renderExpenses(); });

      const openExpenseModal = (existingData = null) => {
        const isEdit = !!existingData;
        const fields = `
          <div class="form-group"><label class="form-label">Merchant</label><input type="text" name="merchant" class="input-field" required value="${isEdit ? existingData.merchant : ''}"></div>
          <div class="form-group"><label class="form-label">Category</label>
            <select name="category" class="input-field">
              ${categories.map(c => `<option value="${c.name}" ${isEdit && existingData.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" name="amount" class="input-field" required value="${isEdit ? existingData.amount : ''}"></div>
          <div class="form-group"><label class="form-label">Status</label>
            <select name="status" class="input-field">
              <option value="paid" ${isEdit && existingData.status === 'paid' ? 'selected' : ''}>Paid</option>
              <option value="pending" ${isEdit && existingData.status === 'pending' ? 'selected' : ''}>Pending</option>
            </select>
          </div>
        `;
        openModal(isEdit ? 'Edit Expense' : 'Add New Expense', fields, (formData) => {
          const data = { merchant: formData.get('merchant'), category: formData.get('category'), amount: parseFloat(formData.get('amount')), status: formData.get('status') };
          if(isEdit) {
            const idx = transactions.findIndex(x => x.id === existingData.id);
            transactions[idx] = { ...transactions[idx], ...data };
          } else {
            transactions.unshift({ id: Date.now(), date: new Date().toISOString().split('T')[0], ...data });
          }
          setData('lumora_transactions', transactions);
          renderExpenses();
        });
      };

      document.getElementById('add-expense-btn').addEventListener('click', () => openExpenseModal());
      renderExpenses();
    }

    if (document.getElementById('categoriesGrid')) {
      const renderCategories = () => {
        const grid = document.getElementById('categoriesGrid');
        grid.innerHTML = categories.map(c => {
          const spent = transactions.filter(t => t.category === c.name).reduce((sum, t) => sum + t.amount, 0);
          const percentage = Math.min((spent / c.budget) * 100, 100).toFixed(0);
          const isAlert = percentage >= 80;

          return `
            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                <div style="width:44px; height:44px; border-radius:12px; background:${c.gradient}; display:grid; place-items:center; color:#fff; font-size:1.1rem;"><i class="fa-solid ${c.icon}"></i></div>
                <span style="font-weight:700; color:${isAlert ? 'var(--danger)' : 'var(--text-primary)'};">${percentage}%</span>
              </div>
              <h3 style="margin-bottom:8px;">${c.name}</h3>
              <div style="font-size:.9rem; color:var(--text-muted); margin-bottom:16px;">${formatMoney(spent)} / ${formatMoney(c.budget)}</div>
              <div class="progress-track"><div class="progress-fill ${isAlert ? 'alert' : ''}" style="width:${percentage}%"></div></div>
            </div>
          `;
        }).join('');
      };

      renderCategories();

      document.getElementById('add-category-btn').addEventListener('click', () => {
        const fields = `
          <div class="form-group"><label class="form-label">Category Name</label><input type="text" name="name" class="input-field" required placeholder="e.g. Travel"></div>
          <div class="form-group"><label class="form-label">Budget ($)</label><input type="number" name="budget" class="input-field" required min="1" placeholder="500"></div>
        `;
        openModal('Create Category', fields, (formData) => {
          categories.push({ id: Date.now(), name: formData.get('name'), budget: parseFloat(formData.get('budget')), icon: 'fa-tag', gradient: 'linear-gradient(135deg, #4f46e5 0%, #ec4899 100%)' });
          setData('lumora_categories', categories);
          renderCategories();
        });
      });
    }

    if (document.getElementById('settingsPage')) {
      const accentPicker = document.getElementById('accentPicker');
      if(accentPicker) {
        accentPicker.value = localStorage.getItem('lumora_accent') || '#4f46e5';
        accentPicker.addEventListener('input', (e) => {
          root.style.setProperty('--primary', e.target.value);
          localStorage.setItem('lumora_accent', e.target.value);
        });
      }

      const currSelect = document.getElementById('currencySelect');
      if(currSelect) {
        currSelect.value = currentCurrency;
        currSelect.addEventListener('change', (e) => {
          currentCurrency = e.target.value;
          localStorage.setItem('lumora_currency', currentCurrency);
          showToast(`Currency changed to ${currentCurrency}`);
        });
      }

      const logoutBtn = document.getElementById('logoutBtn');
      if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('lumora_user');
          window.location.href = '../login.html';
        });
      }
    }

    if (document.getElementById('exportCsvBtn')) {
      document.getElementById('exportCsvBtn').addEventListener('click', () => {
        let csv = 'Date,Merchant,Category,Amount,Status\n';
        transactions.forEach(t => { csv += `${t.date},"${t.merchant}","${t.category}",${t.amount},${t.status}\n`; });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `lumora_export_${new Date().toISOString().split('T')[0]}.csv`; a.click();
        showToast('CSV Downloaded!');
      });
    }
  }
});