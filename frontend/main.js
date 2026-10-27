document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // --- CURRENCY & FORMATTING ---
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    INR: { symbol: '₹', rate: 83.2 }
  };
  let currentCurrency = localStorage.getItem('lumora_currency') || 'USD';

  const formatMoney = (amount) => {
    const c = CURRENCIES[currentCurrency];
    return c.symbol + (parseFloat(amount) * c.rate).toFixed(2);
  };

  // --- DATA LAYER ---
  const getData = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
  const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  let transactions = getData('lumora_transactions', [
    { id: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' },
    { id: 3, merchant: 'Starbucks', category: 'Meals', date: '2025-10-22', amount: 8.50, status: 'pending' }
  ]);

  let categories = getData('lumora_categories', [
    { id: 1, name: 'Software', budget: 200, icon: 'fa-code', gradient: 'var(--gradient-1)' },
    { id: 2, name: 'Infrastructure', budget: 500, icon: 'fa-server', gradient: 'var(--gradient-2)' },
    { id: 3, name: 'Meals', budget: 150, icon: 'fa-utensils', gradient: 'linear-gradient(135deg, #10b981, #059669)' }
  ]);

  // --- UTILS ---
  const showToast = (msg) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-stack'; stack.id = 'toastStack';
    if(!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> ${msg}`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // --- THEME & ACCENT ENGINE ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');

  const savedAccent = localStorage.getItem('lumora_accent');
  if(savedAccent) {
    root.style.setProperty('--primary', savedAccent);
    // Approximate RGB for shadows (this is a simple hex to rgb conversion)
    let r = parseInt(savedAccent.slice(1,3),16), g = parseInt(savedAccent.slice(3,5),16), b = parseInt(savedAccent.slice(5,7),16);
    root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
  }

  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if(btn) btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      showToast(`${next.charAt(0).toUpperCase() + next.slice(1)} mode enabled`);
    });
  });

  // --- MOBILE MENU ---
  const menuBtn = document.getElementById('menuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', (e) => { e.stopPropagation(); navMenu.classList.toggle('open'); });
    document.addEventListener('click', (e) => { if (navMenu.classList.contains('open') && !navMenu.contains(e.target)) navMenu.classList.remove('open'); });
  }

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link, .dash-nav-item').forEach(link => {
    if (link.getAttribute('href') === currentPath) link.classList.add('active');
  });

  // --- MODAL SYSTEM ---
  const modalHTML = `
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
            <button type="submit" class="btn btn-primary">Save</button>
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

  // ==========================================
  // PAGE: DASHBOARD
  // ==========================================
  if (document.getElementById('dashTable')) {
    // Calculate Real Totals
    const totalExpenses = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalTransactions = transactions.length;
    
    document.querySelector('[data-count="revenue"]').textContent = formatMoney(48392); // Fake revenue
    document.querySelector('[data-count="users"]').textContent = totalTransactions + " Items";
    document.querySelector('[data-count="expenses"]').textContent = formatMoney(totalExpenses);

    // Render Recent
    const tbody = document.getElementById('tableBody');
    const recent = transactions.slice(0, 5);
    if(recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No recent transactions</td></tr>`;
    } else {
      tbody.innerHTML = recent.map(t => `
        <tr>
          <td><strong>${t.merchant}</strong></td>
          <td>${t.category}</td>
          <td>${t.date}</td>
          <td>${formatMoney(t.amount)}</td>
          <td><span class="status-pill status-${t.status}">${t.status}</span></td>
        </tr>
      `).join('');
    }

    // REAL Dynamic Chart
    const linePath = document.getElementById('linePath');
    const lineArea = document.getElementById('lineArea');
    if (linePath) {
      // Group by date (mocking for visual by taking last 7 transactions)
      let chartData = transactions.slice(0, 7).map(t => t.amount).reverse();
      if(chartData.length < 2) chartData = [0, 0]; // Default flat line if empty

      const W = 400, H = 180, pad = 10;
      const min = Math.min(...chartData), max = Math.max(...chartData);
      const range = (max - min) || 1;
      const stepX = (W - pad*2) / (chartData.length - 1);
      
      let d = '';
      chartData.forEach((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (1 - (v - min) / range) * (H - pad*2);
        d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
      });
      linePath.setAttribute('d', d);
      lineArea.setAttribute('d', d + ` L ${W-pad} ${H} L ${pad} ${H} Z`);
    }
  }

  // ==========================================
  // PAGE: EXPENSES (Advanced Table)
  // ==========================================
  if (document.getElementById('expensesBody')) {
    let currentPage = 1;
    const rowsPerPage = 5;
    let sortKey = 'date', sortAsc = false;
    let searchVal = '', filterStatus = 'all', filterCat = 'all';

    const renderExpenses = () => {
      const tbody = document.getElementById('expensesBody');
      const emptyState = document.getElementById('emptyState');
      
      // 1. Filter
      let filtered = transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(searchVal) || t.category.toLowerCase().includes(searchVal);
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        const matchesCat = filterCat === 'all' || t.category === filterCat;
        return matchesSearch && matchesStatus && matchesCat;
      });

      // 2. Sort
      filtered.sort((a, b) => {
        let valA = a[sortKey], valB = b[sortKey];
        if(typeof valA === 'string') valA = valA.toLowerCase(), valB = valB.toLowerCase();
        if(valA < valB) return sortAsc ? -1 : 1;
        if(valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });

      // 3. Pagination
      const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
      if(currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * rowsPerPage;
      const paginated = filtered.slice(start, start + rowsPerPage);

      // 4. Render
      if(paginated.length === 0) {
        tbody.innerHTML = '';
        if(emptyState) emptyState.style.display = 'block';
      } else {
        if(emptyState) emptyState.style.display = 'none';
        tbody.innerHTML = paginated.map(t => `
          <tr>
            <td><strong>${t.merchant}</strong></td>
            <td>${t.category}</td>
            <td>${t.date}</td>
            <td>${formatMoney(t.amount)}</td>
            <td><span class="status-pill status-${t.status}">${t.status}</span></td>
            <td class="actions-cell">
              <button class="icon-btn edit-btn" data-id="${t.id}"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete-btn" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>
        `).join('');
      }

      // Update Pagination UI
      document.getElementById('pageInfo').textContent = `Showing ${filtered.length ? start+1 : 0}-${Math.min(start+rowsPerPage, filtered.length)} of ${filtered.length}`;
      document.getElementById('prevBtn').disabled = currentPage === 1;
      document.getElementById('nextBtn').disabled = currentPage === totalPages;

      // Bind Buttons
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.currentTarget.getAttribute('data-id'));
          transactions = transactions.filter(t => t.id !== id);
          setData('lumora_transactions', transactions);
          renderExpenses();
          showToast('Expense deleted');
        });
      });

      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.currentTarget.getAttribute('data-id'));
          const t = transactions.find(x => x.id === id);
          openExpenseModal(t); // Call modal with data
        });
      });
    };

    // Search & Filter Bindings
    document.getElementById('searchExpense').addEventListener('input', (e) => { searchVal = e.target.value.toLowerCase(); currentPage = 1; renderExpenses(); });
    document.getElementById('filterStatus').addEventListener('change', (e) => { filterStatus = e.target.value; currentPage = 1; renderExpenses(); });
    document.getElementById('filterCategory').addEventListener('change', (e) => { filterCat = e.target.value; currentPage = 1; renderExpenses(); });

    // Sort Bindings
    document.getElementById('thMerchant').addEventListener('click', () => { sortKey='merchant'; sortAsc=!sortAsc; renderExpenses(); });
    document.getElementById('thDate').addEventListener('click', () => { sortKey='date'; sortAsc=!sortAsc; renderExpenses(); });
    document.getElementById('thAmount').addEventListener('click', () => { sortKey='amount'; sortAsc=!sortAsc; renderExpenses(); });

    // Pagination Bindings
    document.getElementById('prevBtn').addEventListener('click', () => { if(currentPage > 1) { currentPage--; renderExpenses(); }});
    document.getElementById('nextBtn').addEventListener('click', () => { currentPage++; renderExpenses(); });

    // Modal Logic
    const openExpenseModal = (existingData = null) => {
      const isEdit = !!existingData;
      const fields = `
        <div class="form-group"><label>Merchant</label><input type="text" name="merchant" class="form-input" required value="${isEdit ? existingData.merchant : ''}"></div>
        <div class="form-group"><label>Category</label>
          <select name="category" class="form-input">
            ${categories.map(c => `<option value="${c.name}" ${isEdit && existingData.category === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Amount ($)</label><input type="number" step="0.01" min="0.01" name="amount" class="form-input" required value="${isEdit ? existingData.amount : ''}"></div>
        <div class="form-group"><label>Status</label>
          <select name="status" class="form-input">
            <option value="paid" ${isEdit && existingData.status === 'paid' ? 'selected' : ''}>Paid</option>
            <option value="pending" ${isEdit && existingData.status === 'pending' ? 'selected' : ''}>Pending</option>
          </select>
        </div>
      `;
      openModal(isEdit ? 'Edit Expense' : 'Add New Expense', fields, (formData) => {
        const data = {
          merchant: formData.get('merchant'),
          category: formData.get('category'),
          amount: parseFloat(formData.get('amount')),
          status: formData.get('status'),
        };
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

  // ==========================================
  // PAGE: CATEGORIES (Budget Alerts)
  // ==========================================
  if (document.getElementById('categoriesGrid')) {
    const renderCategories = () => {
      const grid = document.getElementById('categoriesGrid');
      grid.innerHTML = categories.map(c => {
        // Calculate Real Spent Amount
        const spent = transactions.filter(t => t.category === c.name).reduce((sum, t) => sum + t.amount, 0);
        const percentage = Math.min((spent / c.budget) * 100, 100).toFixed(0);
        const isAlert = percentage >= 80;

        return `
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="width:40px; height:40px; border-radius:12px; background:${c.gradient}; display:grid; place-items:center; color:#fff;">
                <i class="fa-solid ${c.icon}"></i>
              </div>
              <span style="font-weight:700; color:${isAlert ? 'var(--danger)' : 'var(--text-primary)'};">${percentage}%</span>
            </div>
            <h3>${c.name}</h3>
            <div style="font-size:.85rem; color:var(--text-muted); margin-bottom:8px;">${formatMoney(spent)} / ${formatMoney(c.budget)}</div>
            <div class="progress-bar">
              <div class="progress-fill ${isAlert ? 'alert' : ''}" style="width:${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
    };

    renderCategories();

    document.getElementById('add-category-btn').addEventListener('click', () => {
      const fields = `
        <div class="form-group"><label>Category Name</label><input type="text" name="name" class="form-input" required placeholder="e.g. Travel"></div>
        <div class="form-group"><label>Budget ($)</label><input type="number" name="budget" class="form-input" required min="1" placeholder="500"></div>
      `;
      openModal('Create Category', fields, (formData) => {
        categories.push({
          id: Date.now(),
          name: formData.get('name'),
          budget: parseFloat(formData.get('budget')),
          icon: 'fa-tag',
          gradient: 'var(--gradient-1)'
        });
        setData('lumora_categories', categories);
        renderCategories();
      });
    });
  }

  // ==========================================
  // PAGE: REPORTS
  // ==========================================
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

  // ==========================================
  // PAGE: SETTINGS (Currency & Accent)
  // ==========================================
  if (document.getElementById('settingsPage')) {
    // Accent Picker
    const accentPicker = document.getElementById('accentPicker');
    if(accentPicker) {
      if(savedAccent) accentPicker.value = savedAccent;
      accentPicker.addEventListener('input', (e) => {
        root.style.setProperty('--primary', e.target.value);
        let r = parseInt(e.target.value.slice(1,3),16), g = parseInt(e.target.value.slice(3,5),16), b = parseInt(e.target.value.slice(5,7),16);
        root.style.setProperty('--primary-rgb', `${r}, ${g}, ${b}`);
        localStorage.setItem('lumora_accent', e.target.value);
      });
    }

    // Currency Picker
    const currSelect = document.getElementById('currencySelect');
    if(currSelect) {
      currSelect.value = currentCurrency;
      currSelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('lumora_currency', currentCurrency);
        showToast(`Currency changed to ${currentCurrency}`);
      });
    }

    // Fake Toggles
    document.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
      });
    });
  }

});