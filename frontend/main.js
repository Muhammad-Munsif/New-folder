document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;

  // --- DATA LAYER (LocalStorage) ---
  const getData = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
  const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  let transactions = getData('lumora_transactions', [
    { id: 1, merchant: 'AWS Hosting', category: 'Infrastructure', date: '2025-10-24', amount: 124.50, status: 'paid' },
    { id: 2, merchant: 'Figma Pro', category: 'Software', date: '2025-10-23', amount: 15.00, status: 'paid' },
    { id: 3, merchant: 'Starbucks', category: 'Meals', date: '2025-10-22', amount: 8.50, status: 'pending' }
  ]);

  let categories = getData('lumora_categories', [
    { id: 1, name: 'Software', budget: 200, spent: 15, icon: 'fa-code', gradient: 'var(--gradient-1)' },
    { id: 2, name: 'Infrastructure', budget: 500, spent: 124.50, icon: 'fa-server', gradient: 'var(--gradient-2)' },
    { id: 3, name: 'Meals', budget: 150, spent: 8.50, icon: 'fa-utensils', gradient: 'linear-gradient(135deg, #10b981, #059669)' }
  ]);

  // --- UTILS ---
  const showToast = (msg) => {
    let stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toastStack'; stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--success);"></i> ${msg}`;
    stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  const formatCurrency = (num) => '$' + parseFloat(num).toFixed(2);

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

  // --- MOBILE MENU ---
  const menuBtn = document.getElementById('menuBtn');
  const navMenu = document.getElementById('navMenu');
  if (menuBtn && navMenu) {
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navMenu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (navMenu.classList.contains('open') && !navMenu.contains(e.target)) navMenu.classList.remove('open');
    });
  }

  // Active Nav Highlighting
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

  const closeModal = () => {
    modal.classList.remove('open');
    modalForm.reset();
    onModalSave = null;
  };

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
    // Animate Counters
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.getAttribute('data-count'));
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / 1200, 1);
        el.textContent = formatCurrency(target * progress).replace('.00','');
        if (progress < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    });

    // Render Recent Transactions (Top 5)
    const tbody = document.getElementById('tableBody');
    const recent = transactions.slice(0, 5);
    tbody.innerHTML = recent.map(t => `
      <tr>
        <td><strong>${t.merchant}</strong></td>
        <td>${t.category}</td>
        <td>${t.date}</td>
        <td>${formatCurrency(t.amount)}</td>
        <td><span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span></td>
      </tr>
    `).join('');

    // Draw Chart (Simple SVG Path)
    const linePath = document.getElementById('linePath');
    const lineArea = document.getElementById('lineArea');
    if (linePath) {
      const vals = [22, 30, 42, 38, 55, 48, 62, 58, 74, 68, 78, 84];
      const W = 400, H = 180, pad = 10;
      const min = Math.min(...vals), max = Math.max(...vals);
      const stepX = (W - pad*2) / (vals.length - 1);
      let d = '';
      vals.forEach((v, i) => {
        const x = pad + i * stepX;
        const y = pad + (1 - (v - min) / (max - min)) * (H - pad*2);
        d += (i === 0 ? 'M ' : ' L ') + x + ' ' + y;
      });
      linePath.setAttribute('d', d);
      lineArea.setAttribute('d', d + ` L ${W-pad} ${H} L ${pad} ${H} Z`);
    }
  }

  // ==========================================
  // PAGE: EXPENSES
  // ==========================================
  if (document.getElementById('expensesBody')) {
    const renderExpenses = (filterText = '') => {
      const tbody = document.getElementById('expensesBody');
      const filtered = transactions.filter(t => 
        t.merchant.toLowerCase().includes(filterText.toLowerCase()) || 
        t.category.toLowerCase().includes(filterText.toLowerCase())
      );

      tbody.innerHTML = filtered.map(t => `
        <tr>
          <td><strong>${t.merchant}</strong></td>
          <td>${t.category}</td>
          <td>${t.date}</td>
          <td>${formatCurrency(t.amount)}</td>
          <td><span class="status-pill status-${t.status}">${t.status.toUpperCase()}</span></td>
          <td><button class="btn btn-ghost btn-sm delete-btn" data-id="${t.id}"><i class="fa-solid fa-trash" style="color:var(--danger)"></i></button></td>
        </tr>
      `).join('');

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = parseInt(e.currentTarget.getAttribute('data-id'));
          transactions = transactions.filter(t => t.id !== id);
          setData('lumora_transactions', transactions);
          renderExpenses(document.getElementById('searchExpense').value);
          showToast('Expense deleted');
        });
      });
    };

    renderExpenses();

    // Search Feature
    const searchInput = document.getElementById('searchExpense');
    if(searchInput) searchInput.addEventListener('input', (e) => renderExpenses(e.target.value));

    // Add Expense Feature
    const addBtn = document.getElementById('add-expense-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const fields = `
          <div class="form-group"><label>Merchant</label><input type="text" name="merchant" class="form-input" required placeholder="e.g. Apple Store"></div>
          <div class="form-group"><label>Category</label>
            <select name="category" class="form-input">
              ${categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Amount ($)</label><input type="number" step="0.01" name="amount" class="form-input" required></div>
          <div class="form-group"><label>Status</label>
            <select name="status" class="form-input"><option value="paid">Paid</option><option value="pending">Pending</option></select>
          </div>
        `;
        openModal('Add New Expense', fields, (formData) => {
          const newTx = {
            id: Date.now(),
            merchant: formData.get('merchant'),
            category: formData.get('category'),
            amount: parseFloat(formData.get('amount')),
            status: formData.get('status'),
            date: new Date().toISOString().split('T')[0]
          };
          transactions.unshift(newTx);
          setData('lumora_transactions', transactions);
          renderExpenses();
        });
      });
    }
  }

  // ==========================================
  // PAGE: CATEGORIES
  // ==========================================
  if (document.getElementById('categoriesGrid')) {
    const renderCategories = () => {
      const grid = document.getElementById('categoriesGrid');
      grid.innerHTML = categories.map(c => {
        const percentage = Math.min((c.spent / c.budget) * 100, 100).toFixed(0);
        return `
          <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <div style="width:40px; height:40px; border-radius:12px; background:${c.gradient}; display:grid; place-items:center; color:#fff;">
                <i class="fa-solid ${c.icon}"></i>
              </div>
              <span style="font-weight:700; color:var(--text-primary);">${percentage}%</span>
            </div>
            <h3>${c.name}</h3>
            <div style="font-size:.85rem; color:var(--text-muted); margin-bottom:8px;">${formatCurrency(c.spent)} / ${formatCurrency(c.budget)}</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${percentage}%"></div></div>
          </div>
        `;
      }).join('');
    };

    renderCategories();

    const addBtn = document.getElementById('add-category-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const fields = `
          <div class="form-group"><label>Category Name</label><input type="text" name="name" class="form-input" required placeholder="e.g. Travel"></div>
          <div class="form-group"><label>Budget ($)</label><input type="number" name="budget" class="form-input" required placeholder="500"></div>
        `;
        openModal('Create Category', fields, (formData) => {
          categories.push({
            id: Date.now(),
            name: formData.get('name'),
            budget: parseFloat(formData.get('budget')),
            spent: 0,
            icon: 'fa-tag',
            gradient: 'var(--gradient-1)'
          });
          setData('lumora_categories', categories);
          renderCategories();
        });
      });
    }
  }

  // ==========================================
  // PAGE: REPORTS (CSV Export)
  // ==========================================
  if (document.getElementById('exportCsvBtn')) {
    document.getElementById('exportCsvBtn').addEventListener('click', () => {
      let csv = 'Date,Merchant,Category,Amount,Status\n';
      transactions.forEach(t => {
        csv += `${t.date},"${t.merchant}","${t.category}",${t.amount},${t.status}\n`;
      });
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lumora_report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      showToast('Report downloaded!');
    });
  }

  // ==========================================
  // PAGE: SETTINGS (Accent Color & Toggles)
  // ==========================================
  if (document.getElementById('settingsPage')) {
    document.querySelectorAll('.switch').forEach(sw => {
      sw.addEventListener('click', () => {
        sw.setAttribute('aria-checked', sw.getAttribute('aria-checked') !== 'true');
      });
    });

    const accentPicker = document.getElementById('accentPicker');
    if(accentPicker) {
      accentPicker.addEventListener('input', (e) => {
        root.style.setProperty('--primary', e.target.value);
        root.style.setProperty('--primary-rgb', hexToRgb(e.target.value));
      });
    }
  }

  // Helper for hex to rgb
  function hexToRgb(hex) {
    let r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

});