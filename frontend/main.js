document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;
  const API_URL = 'http://localhost:3000/api';
  
  // --- TOKEN & AUTH STATE ---
  const getToken = () => localStorage.getItem('lumora_token');
  const getUser = () => JSON.parse(localStorage.getItem('lumora_user'));

  const showToast = (msg, isError = false) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if(!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = document.createElement('i');
    icon.className = isError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    icon.style.color = isError ? "var(--danger)" : "var(--success)";
    const text = document.createElement('span'); text.textContent = msg;
    el.appendChild(icon); el.appendChild(text); stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // --- THEME ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');
  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if(btn) btn.addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  });

  // --- ROUTING GUARD ---
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');

  if (!isAuthPage && !isLandingPage && !getToken()) { window.location.href = '../login.html'; return; }
  
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem('lumora_token'); localStorage.removeItem('lumora_user'); window.location.href = '../login.html'; });

  // --- MOBILE SIDEBAR ---
  const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  if (mobileSidebarBtn && appSidebar && sidebarBackdrop) {
    const toggle = () => { appSidebar.classList.toggle('open'); sidebarBackdrop.classList.toggle('show'); };
    mobileSidebarBtn.addEventListener('click', toggle);
    sidebarBackdrop.addEventListener('click', toggle);
  }

  // --- LANDING PAGE ---
  if (isLandingPage) {
    const navActions = document.getElementById('landingNavActions');
    if (navActions) {
      if (getToken()) navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="pages/dashboard.html" class="btn btn-primary">Dashboard</a>`;
      else navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="login.html" class="btn btn-outline hide-mobile">Sign In</a><a href="login.html" class="btn btn-primary">Get Started</a>`;
      document.getElementById('landingThemeBtn').addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    }
  }

  // --- AUTH FORM (Login / Signup) ---
  if (isAuthPage) {
    let isSignup = false;
    const form = document.getElementById('authForm');
    document.getElementById('toggleAuth').addEventListener('click', () => {
      isSignup = !isSignup;
      document.getElementById('authTitle').textContent = isSignup ? 'Create an account' : 'Welcome back';
      document.getElementById('authSubtitle').textContent = isSignup ? 'Start managing your finances.' : 'Enter your credentials to access your account.';
      document.getElementById('authSubmitBtn').textContent = isSignup ? 'Sign Up' : 'Sign In';
      document.getElementById('toggleText').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
      document.getElementById('toggleAuth').textContent = isSignup ? 'Log in' : 'Sign up';
      document.getElementById('nameGroup').style.display = isSignup ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('authSubmitBtn');
      btn.textContent = 'Loading...'; btn.disabled = true;
      
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = isSignup ? document.getElementById('authName').value : '';
      
      const endpoint = isSignup ? '/register' : '/login';
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        localStorage.setItem('lumora_token', data.token);
        localStorage.setItem('lumora_user', JSON.stringify({ name: data.name, email }));
        window.location.href = 'pages/dashboard.html';
      } catch (err) {
        showToast(err.message, true);
        btn.textContent = isSignup ? 'Sign Up' : 'Sign In'; btn.disabled = false;
      }
    });
    return;
  }

  // --- APP PAGES (Dashboard, Expenses, Settings, Reports) ---
  if (!isLandingPage && !isAuthPage) {
    const user = getUser();
    if(user && document.querySelector('.page-subtitle')) document.querySelector('.page-subtitle').textContent = `Welcome back, ${user.name}`;

    let transactions = [];

    // Fetch initial data from Backend
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (res.status === 401 || res.status === 403) { window.location.href = '../login.html'; return; }
        transactions = await res.json();
        if (document.getElementById('dashTable')) renderDash();
        if (document.getElementById('expensesBody')) renderExpPage();
      } catch (err) {
        console.error('Failed to fetch', err);
      }
    };

    // --- MODAL LOGIC ---
    const modalHTML = `
      <div class="modal-overlay" id="globalModal">
        <div class="modal-box">
          <div class="modal-header"><h3 class="modal-title" id="modalTitle">Add Record</h3><button class="icon-btn modal-close"><i class="fa-solid fa-xmark"></i></button></div>
          <form id="modalForm">
            <input type="hidden" id="recordId">
            <div class="form-group"><label class="form-label">Merchant</label><input type="text" id="merchantInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" id="amountInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Category</label><select id="categoryInput" class="input-field"><option>Software</option><option>Infrastructure</option><option>Meals</option><option>Travel</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select id="statusInput" class="input-field"><option value="paid">Paid</option><option value="pending">Pending</option></select></div>
            <div class="modal-actions"><button type="button" class="btn btn-outline modal-close">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => document.getElementById('globalModal').classList.remove('open')));
    
    const openAdd = () => { document.getElementById('modalTitle').textContent = 'Add Expense'; document.getElementById('modalForm').reset(); document.getElementById('recordId').value = ''; document.getElementById('globalModal').classList.add('open'); };
    const openEdit = (t) => { document.getElementById('modalTitle').textContent = 'Edit Expense'; document.getElementById('recordId').value = t.id; document.getElementById('merchantInput').value = t.merchant; document.getElementById('amountInput').value = t.amount; document.getElementById('categoryInput').value = t.category; document.getElementById('statusInput').value = t.status; document.getElementById('globalModal').classList.add('open'); };

    document.getElementById('modalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('recordId').value;
      const data = {
        merchant: document.getElementById('merchantInput').value.trim(),
        amount: parseFloat(document.getElementById('amountInput').value),
        category: document.getElementById('categoryInput').value,
        status: document.getElementById('statusInput').value
      };
      
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_URL}/transactions/${id}` : `${API_URL}/transactions`;
      
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(data)
        });
        document.getElementById('globalModal').classList.remove('open'); 
        showToast('Saved successfully!');
        fetchTransactions(); // Refresh UI
      } catch (err) { showToast('Failed to save', true); }
    });

    const deleteTx = async (id) => {
      if(!confirm('Delete?')) return;
      try {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        showToast('Deleted');
        fetchTransactions();
      } catch (err) { showToast('Failed to delete', true); }
    };

    const createActionsCell = (t) => {
      const td = document.createElement('td'); td.className = 'actions-cell'; td.setAttribute('data-label', 'Actions');
      const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.innerHTML = '<i class="fa-solid fa-pen"></i>'; edit.onclick = () => openEdit(t);
      const del = document.createElement('button'); del.className = 'icon-btn danger'; del.innerHTML = '<i class="fa-solid fa-trash"></i>'; del.onclick = () => deleteTx(t.id);
      td.appendChild(edit); td.appendChild(del); return td;
    };

    // --- DASHBOARD RENDER ---
    const renderDash = () => {
      document.getElementById('kpi-rev').textContent = '$48,392';
      document.getElementById('kpi-items').textContent = transactions.length;
      document.getElementById('kpi-exp').textContent = '$' + transactions.reduce((s,t)=>s+parseFloat(t.amount),0).toFixed(2);
      
      const tbody = document.getElementById('tableBody'); tbody.innerHTML = '';
      transactions.slice(0, 5).forEach(t => {
        const tr = document.createElement('tr');
        const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
        const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
        const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
        const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
        const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
        tr.appendChild(createActionsCell(t));
        tbody.appendChild(tr);
      });
      const addBtn = document.getElementById('add-dash-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    // --- EXPENSES PAGE RENDER ---
    let expState = { search: '', filterStatus: 'all', sortKey: 'date', sortAsc: false, page: 1, perPage: 5 };

    const renderExpPage = () => {
      let filtered = transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(expState.search) || t.category.toLowerCase().includes(expState.search);
        const matchesStatus = expState.filterStatus === 'all' || t.status === expState.filterStatus;
        return matchesSearch && matchesStatus;
      });

      filtered.sort((a, b) => {
        let valA = a[expState.sortKey], valB = b[expState.sortKey];
        if(typeof valA === 'string') valA = valA.toLowerCase(), valB = valB.toLowerCase();
        if(valA < valB) return expState.sortAsc ? -1 : 1;
        if(valA > valB) return expState.sortAsc ? 1 : -1;
        return 0;
      });

      const totalPages = Math.ceil(filtered.length / expState.perPage) || 1;
      if(expState.page > totalPages) expState.page = totalPages;
      const start = (expState.page - 1) * expState.perPage;
      const paginated = filtered.slice(start, start + expState.perPage);

      const tbody = document.getElementById('expensesBody'); tbody.innerHTML = '';
      
      if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No expenses found.</td></tr>`;
      } else {
        paginated.forEach(t => {
          const tr = document.createElement('tr');
          const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
          const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
          const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
          const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
          const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
          tr.appendChild(createActionsCell(t));
          tbody.appendChild(tr);
        });
      }

      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) pageInfo.textContent = `Showing ${filtered.length ? start+1 : 0}-${Math.min(start+expState.perPage, filtered.length)} of ${filtered.length}`;
      const prevBtn = document.getElementById('prevBtn'); if(prevBtn) prevBtn.disabled = expState.page === 1;
      const nextBtn = document.getElementById('nextBtn'); if(nextBtn) nextBtn.disabled = expState.page === totalPages;

      const addBtn = document.getElementById('add-expense-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    if (document.getElementById('expensesBody')) {
      document.getElementById('searchExpense').addEventListener('input', (e) => { expState.search = e.target.value.toLowerCase(); expState.page = 1; renderExpPage(); });
      document.getElementById('filterStatus').addEventListener('change', (e) => { expState.filterStatus = e.target.value; expState.page = 1; renderExpPage(); });
      
      const sortHeader = (key) => { if(expState.sortKey === key) expState.sortAsc = !expState.sortAsc; else { expState.sortKey = key; expState.sortAsc = true; } renderExpPage(); };
      document.getElementById('thMerchant').onclick = () => sortHeader('merchant');
      document.getElementById('thDate').onclick = () => sortHeader('date');
      document.getElementById('thAmount').onclick = () => sortHeader('amount');

      document.getElementById('prevBtn').onclick = () => { if(expState.page > 1) { expState.page--; renderExpPage(); }};
      document.getElementById('nextBtn').onclick = () => { expState.page++; renderExpPage(); };
    }

    fetchTransactions();
  }
});document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;
  const API_URL = 'http://localhost:3000/api';
  
  // --- TOKEN & AUTH STATE ---
  const getToken = () => localStorage.getItem('lumora_token');
  const getUser = () => JSON.parse(localStorage.getItem('lumora_user'));

  const showToast = (msg, isError = false) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if(!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = document.createElement('i');
    icon.className = isError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    icon.style.color = isError ? "var(--danger)" : "var(--success)";
    const text = document.createElement('span'); text.textContent = msg;
    el.appendChild(icon); el.appendChild(text); stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // --- THEME ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');
  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if(btn) btn.addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  });

  // --- ROUTING GUARD ---
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');

  if (!isAuthPage && !isLandingPage && !getToken()) { window.location.href = '../login.html'; return; }
  
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem('lumora_token'); localStorage.removeItem('lumora_user'); window.location.href = '../login.html'; });

  // --- MOBILE SIDEBAR ---
  const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  if (mobileSidebarBtn && appSidebar && sidebarBackdrop) {
    const toggle = () => { appSidebar.classList.toggle('open'); sidebarBackdrop.classList.toggle('show'); };
    mobileSidebarBtn.addEventListener('click', toggle);
    sidebarBackdrop.addEventListener('click', toggle);
  }

  // --- LANDING PAGE ---
  if (isLandingPage) {
    const navActions = document.getElementById('landingNavActions');
    if (navActions) {
      if (getToken()) navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="pages/dashboard.html" class="btn btn-primary">Dashboard</a>`;
      else navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="login.html" class="btn btn-outline hide-mobile">Sign In</a><a href="login.html" class="btn btn-primary">Get Started</a>`;
      document.getElementById('landingThemeBtn').addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    }
  }

  // --- AUTH FORM (Login / Signup) ---
  if (isAuthPage) {
    let isSignup = false;
    const form = document.getElementById('authForm');
    document.getElementById('toggleAuth').addEventListener('click', () => {
      isSignup = !isSignup;
      document.getElementById('authTitle').textContent = isSignup ? 'Create an account' : 'Welcome back';
      document.getElementById('authSubtitle').textContent = isSignup ? 'Start managing your finances.' : 'Enter your credentials to access your account.';
      document.getElementById('authSubmitBtn').textContent = isSignup ? 'Sign Up' : 'Sign In';
      document.getElementById('toggleText').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
      document.getElementById('toggleAuth').textContent = isSignup ? 'Log in' : 'Sign up';
      document.getElementById('nameGroup').style.display = isSignup ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('authSubmitBtn');
      btn.textContent = 'Loading...'; btn.disabled = true;
      
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = isSignup ? document.getElementById('authName').value : '';
      
      const endpoint = isSignup ? '/register' : '/login';
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        localStorage.setItem('lumora_token', data.token);
        localStorage.setItem('lumora_user', JSON.stringify({ name: data.name, email }));
        window.location.href = 'pages/dashboard.html';
      } catch (err) {
        showToast(err.message, true);
        btn.textContent = isSignup ? 'Sign Up' : 'Sign In'; btn.disabled = false;
      }
    });
    return;
  }

  // --- APP PAGES (Dashboard, Expenses, Settings, Reports) ---
  if (!isLandingPage && !isAuthPage) {
    const user = getUser();
    if(user && document.querySelector('.page-subtitle')) document.querySelector('.page-subtitle').textContent = `Welcome back, ${user.name}`;

    let transactions = [];

    // Fetch initial data from Backend
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (res.status === 401 || res.status === 403) { window.location.href = '../login.html'; return; }
        transactions = await res.json();
        if (document.getElementById('dashTable')) renderDash();
        if (document.getElementById('expensesBody')) renderExpPage();
      } catch (err) {
        console.error('Failed to fetch', err);
      }
    };

    // --- MODAL LOGIC ---
    const modalHTML = `
      <div class="modal-overlay" id="globalModal">
        <div class="modal-box">
          <div class="modal-header"><h3 class="modal-title" id="modalTitle">Add Record</h3><button class="icon-btn modal-close"><i class="fa-solid fa-xmark"></i></button></div>
          <form id="modalForm">
            <input type="hidden" id="recordId">
            <div class="form-group"><label class="form-label">Merchant</label><input type="text" id="merchantInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" id="amountInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Category</label><select id="categoryInput" class="input-field"><option>Software</option><option>Infrastructure</option><option>Meals</option><option>Travel</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select id="statusInput" class="input-field"><option value="paid">Paid</option><option value="pending">Pending</option></select></div>
            <div class="modal-actions"><button type="button" class="btn btn-outline modal-close">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => document.getElementById('globalModal').classList.remove('open')));
    
    const openAdd = () => { document.getElementById('modalTitle').textContent = 'Add Expense'; document.getElementById('modalForm').reset(); document.getElementById('recordId').value = ''; document.getElementById('globalModal').classList.add('open'); };
    const openEdit = (t) => { document.getElementById('modalTitle').textContent = 'Edit Expense'; document.getElementById('recordId').value = t.id; document.getElementById('merchantInput').value = t.merchant; document.getElementById('amountInput').value = t.amount; document.getElementById('categoryInput').value = t.category; document.getElementById('statusInput').value = t.status; document.getElementById('globalModal').classList.add('open'); };

    document.getElementById('modalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('recordId').value;
      const data = {
        merchant: document.getElementById('merchantInput').value.trim(),
        amount: parseFloat(document.getElementById('amountInput').value),
        category: document.getElementById('categoryInput').value,
        status: document.getElementById('statusInput').value
      };
      
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_URL}/transactions/${id}` : `${API_URL}/transactions`;
      
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(data)
        });
        document.getElementById('globalModal').classList.remove('open'); 
        showToast('Saved successfully!');
        fetchTransactions(); // Refresh UI
      } catch (err) { showToast('Failed to save', true); }
    });

    const deleteTx = async (id) => {
      if(!confirm('Delete?')) return;
      try {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        showToast('Deleted');
        fetchTransactions();
      } catch (err) { showToast('Failed to delete', true); }
    };

    const createActionsCell = (t) => {
      const td = document.createElement('td'); td.className = 'actions-cell'; td.setAttribute('data-label', 'Actions');
      const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.innerHTML = '<i class="fa-solid fa-pen"></i>'; edit.onclick = () => openEdit(t);
      const del = document.createElement('button'); del.className = 'icon-btn danger'; del.innerHTML = '<i class="fa-solid fa-trash"></i>'; del.onclick = () => deleteTx(t.id);
      td.appendChild(edit); td.appendChild(del); return td;
    };

    // --- DASHBOARD RENDER ---
    const renderDash = () => {
      document.getElementById('kpi-rev').textContent = '$48,392';
      document.getElementById('kpi-items').textContent = transactions.length;
      document.getElementById('kpi-exp').textContent = '$' + transactions.reduce((s,t)=>s+parseFloat(t.amount),0).toFixed(2);
      
      const tbody = document.getElementById('tableBody'); tbody.innerHTML = '';
      transactions.slice(0, 5).forEach(t => {
        const tr = document.createElement('tr');
        const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
        const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
        const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
        const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
        const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
        tr.appendChild(createActionsCell(t));
        tbody.appendChild(tr);
      });
      const addBtn = document.getElementById('add-dash-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    // --- EXPENSES PAGE RENDER ---
    let expState = { search: '', filterStatus: 'all', sortKey: 'date', sortAsc: false, page: 1, perPage: 5 };

    const renderExpPage = () => {
      let filtered = transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(expState.search) || t.category.toLowerCase().includes(expState.search);
        const matchesStatus = expState.filterStatus === 'all' || t.status === expState.filterStatus;
        return matchesSearch && matchesStatus;
      });

      filtered.sort((a, b) => {
        let valA = a[expState.sortKey], valB = b[expState.sortKey];
        if(typeof valA === 'string') valA = valA.toLowerCase(), valB = valB.toLowerCase();
        if(valA < valB) return expState.sortAsc ? -1 : 1;
        if(valA > valB) return expState.sortAsc ? 1 : -1;
        return 0;
      });

      const totalPages = Math.ceil(filtered.length / expState.perPage) || 1;
      if(expState.page > totalPages) expState.page = totalPages;
      const start = (expState.page - 1) * expState.perPage;
      const paginated = filtered.slice(start, start + expState.perPage);

      const tbody = document.getElementById('expensesBody'); tbody.innerHTML = '';
      
      if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No expenses found.</td></tr>`;
      } else {
        paginated.forEach(t => {
          const tr = document.createElement('tr');
          const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
          const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
          const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
          const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
          const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
          tr.appendChild(createActionsCell(t));
          tbody.appendChild(tr);
        });
      }

      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) pageInfo.textContent = `Showing ${filtered.length ? start+1 : 0}-${Math.min(start+expState.perPage, filtered.length)} of ${filtered.length}`;
      const prevBtn = document.getElementById('prevBtn'); if(prevBtn) prevBtn.disabled = expState.page === 1;
      const nextBtn = document.getElementById('nextBtn'); if(nextBtn) nextBtn.disabled = expState.page === totalPages;

      const addBtn = document.getElementById('add-expense-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    if (document.getElementById('expensesBody')) {
      document.getElementById('searchExpense').addEventListener('input', (e) => { expState.search = e.target.value.toLowerCase(); expState.page = 1; renderExpPage(); });
      document.getElementById('filterStatus').addEventListener('change', (e) => { expState.filterStatus = e.target.value; expState.page = 1; renderExpPage(); });
      
      const sortHeader = (key) => { if(expState.sortKey === key) expState.sortAsc = !expState.sortAsc; else { expState.sortKey = key; expState.sortAsc = true; } renderExpPage(); };
      document.getElementById('thMerchant').onclick = () => sortHeader('merchant');
      document.getElementById('thDate').onclick = () => sortHeader('date');
      document.getElementById('thAmount').onclick = () => sortHeader('amount');

      document.getElementById('prevBtn').onclick = () => { if(expState.page > 1) { expState.page--; renderExpPage(); }};
      document.getElementById('nextBtn').onclick = () => { expState.page++; renderExpPage(); };
    }

    fetchTransactions();
  }
});document.addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const currentPath = window.location.pathname;
  const API_URL = 'http://localhost:3000/api';
  
  // --- TOKEN & AUTH STATE ---
  const getToken = () => localStorage.getItem('lumora_token');
  const getUser = () => JSON.parse(localStorage.getItem('lumora_user'));

  const showToast = (msg, isError = false) => {
    let stack = document.getElementById('toastStack') || document.createElement('div');
    stack.className = 'toast-container'; stack.id = 'toastStack';
    if(!stack.parentElement) document.body.appendChild(stack);
    const el = document.createElement('div');
    el.className = 'toast';
    const icon = document.createElement('i');
    icon.className = isError ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
    icon.style.color = isError ? "var(--danger)" : "var(--success)";
    const text = document.createElement('span'); text.textContent = msg;
    el.appendChild(icon); el.appendChild(text); stack.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 3000);
  };

  // --- THEME ---
  const applyTheme = (mode) => {
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('lumora_theme', mode);
  };
  applyTheme(localStorage.getItem('lumora_theme') || 'system');
  document.querySelectorAll('#themeToggle, #dashThemeBtn').forEach(btn => {
    if(btn) btn.addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
  });

  // --- ROUTING GUARD ---
  const isAuthPage = currentPath.includes('login.html');
  const isLandingPage = currentPath.endsWith('index.html') || currentPath.endsWith('/frontend/') || currentPath.endsWith('/');

  if (!isAuthPage && !isLandingPage && !getToken()) { window.location.href = '../login.html'; return; }
  
  const logoutBtn = document.getElementById('logoutBtn');
  if(logoutBtn) logoutBtn.addEventListener('click', () => { localStorage.removeItem('lumora_token'); localStorage.removeItem('lumora_user'); window.location.href = '../login.html'; });

  // --- MOBILE SIDEBAR ---
  const mobileSidebarBtn = document.getElementById('mobileSidebarBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  if (mobileSidebarBtn && appSidebar && sidebarBackdrop) {
    const toggle = () => { appSidebar.classList.toggle('open'); sidebarBackdrop.classList.toggle('show'); };
    mobileSidebarBtn.addEventListener('click', toggle);
    sidebarBackdrop.addEventListener('click', toggle);
  }

  // --- LANDING PAGE ---
  if (isLandingPage) {
    const navActions = document.getElementById('landingNavActions');
    if (navActions) {
      if (getToken()) navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="pages/dashboard.html" class="btn btn-primary">Dashboard</a>`;
      else navActions.innerHTML = `<button class="icon-btn" id="landingThemeBtn"><i class="fa-solid fa-circle-half-stroke"></i></button><a href="login.html" class="btn btn-outline hide-mobile">Sign In</a><a href="login.html" class="btn btn-primary">Get Started</a>`;
      document.getElementById('landingThemeBtn').addEventListener('click', () => applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
    }
  }

  // --- AUTH FORM (Login / Signup) ---
  if (isAuthPage) {
    let isSignup = false;
    const form = document.getElementById('authForm');
    document.getElementById('toggleAuth').addEventListener('click', () => {
      isSignup = !isSignup;
      document.getElementById('authTitle').textContent = isSignup ? 'Create an account' : 'Welcome back';
      document.getElementById('authSubtitle').textContent = isSignup ? 'Start managing your finances.' : 'Enter your credentials to access your account.';
      document.getElementById('authSubmitBtn').textContent = isSignup ? 'Sign Up' : 'Sign In';
      document.getElementById('toggleText').textContent = isSignup ? 'Already have an account?' : "Don't have an account?";
      document.getElementById('toggleAuth').textContent = isSignup ? 'Log in' : 'Sign up';
      document.getElementById('nameGroup').style.display = isSignup ? 'block' : 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('authSubmitBtn');
      btn.textContent = 'Loading...'; btn.disabled = true;
      
      const email = document.getElementById('authEmail').value.trim();
      const password = document.getElementById('authPassword').value;
      const name = isSignup ? document.getElementById('authName').value : '';
      
      const endpoint = isSignup ? '/register' : '/login';
      try {
        const res = await fetch(`${API_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error);
        
        localStorage.setItem('lumora_token', data.token);
        localStorage.setItem('lumora_user', JSON.stringify({ name: data.name, email }));
        window.location.href = 'pages/dashboard.html';
      } catch (err) {
        showToast(err.message, true);
        btn.textContent = isSignup ? 'Sign Up' : 'Sign In'; btn.disabled = false;
      }
    });
    return;
  }

  // --- APP PAGES (Dashboard, Expenses, Settings, Reports) ---
  if (!isLandingPage && !isAuthPage) {
    const user = getUser();
    if(user && document.querySelector('.page-subtitle')) document.querySelector('.page-subtitle').textContent = `Welcome back, ${user.name}`;

    let transactions = [];

    // Fetch initial data from Backend
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_URL}/transactions`, { headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (res.status === 401 || res.status === 403) { window.location.href = '../login.html'; return; }
        transactions = await res.json();
        if (document.getElementById('dashTable')) renderDash();
        if (document.getElementById('expensesBody')) renderExpPage();
      } catch (err) {
        console.error('Failed to fetch', err);
      }
    };

    // --- MODAL LOGIC ---
    const modalHTML = `
      <div class="modal-overlay" id="globalModal">
        <div class="modal-box">
          <div class="modal-header"><h3 class="modal-title" id="modalTitle">Add Record</h3><button class="icon-btn modal-close"><i class="fa-solid fa-xmark"></i></button></div>
          <form id="modalForm">
            <input type="hidden" id="recordId">
            <div class="form-group"><label class="form-label">Merchant</label><input type="text" id="merchantInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Amount ($)</label><input type="number" step="0.01" min="0.01" id="amountInput" class="input-field" required></div>
            <div class="form-group"><label class="form-label">Category</label><select id="categoryInput" class="input-field"><option>Software</option><option>Infrastructure</option><option>Meals</option><option>Travel</option></select></div>
            <div class="form-group"><label class="form-label">Status</label><select id="statusInput" class="input-field"><option value="paid">Paid</option><option value="pending">Pending</option></select></div>
            <div class="modal-actions"><button type="button" class="btn btn-outline modal-close">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
          </form>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => document.getElementById('globalModal').classList.remove('open')));
    
    const openAdd = () => { document.getElementById('modalTitle').textContent = 'Add Expense'; document.getElementById('modalForm').reset(); document.getElementById('recordId').value = ''; document.getElementById('globalModal').classList.add('open'); };
    const openEdit = (t) => { document.getElementById('modalTitle').textContent = 'Edit Expense'; document.getElementById('recordId').value = t.id; document.getElementById('merchantInput').value = t.merchant; document.getElementById('amountInput').value = t.amount; document.getElementById('categoryInput').value = t.category; document.getElementById('statusInput').value = t.status; document.getElementById('globalModal').classList.add('open'); };

    document.getElementById('modalForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('recordId').value;
      const data = {
        merchant: document.getElementById('merchantInput').value.trim(),
        amount: parseFloat(document.getElementById('amountInput').value),
        category: document.getElementById('categoryInput').value,
        status: document.getElementById('statusInput').value
      };
      
      const method = id ? 'PUT' : 'POST';
      const url = id ? `${API_URL}/transactions/${id}` : `${API_URL}/transactions`;
      
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
          body: JSON.stringify(data)
        });
        document.getElementById('globalModal').classList.remove('open'); 
        showToast('Saved successfully!');
        fetchTransactions(); // Refresh UI
      } catch (err) { showToast('Failed to save', true); }
    });

    const deleteTx = async (id) => {
      if(!confirm('Delete?')) return;
      try {
        await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        showToast('Deleted');
        fetchTransactions();
      } catch (err) { showToast('Failed to delete', true); }
    };

    const createActionsCell = (t) => {
      const td = document.createElement('td'); td.className = 'actions-cell'; td.setAttribute('data-label', 'Actions');
      const edit = document.createElement('button'); edit.className = 'icon-btn'; edit.innerHTML = '<i class="fa-solid fa-pen"></i>'; edit.onclick = () => openEdit(t);
      const del = document.createElement('button'); del.className = 'icon-btn danger'; del.innerHTML = '<i class="fa-solid fa-trash"></i>'; del.onclick = () => deleteTx(t.id);
      td.appendChild(edit); td.appendChild(del); return td;
    };

    // --- DASHBOARD RENDER ---
    const renderDash = () => {
      document.getElementById('kpi-rev').textContent = '$48,392';
      document.getElementById('kpi-items').textContent = transactions.length;
      document.getElementById('kpi-exp').textContent = '$' + transactions.reduce((s,t)=>s+parseFloat(t.amount),0).toFixed(2);
      
      const tbody = document.getElementById('tableBody'); tbody.innerHTML = '';
      transactions.slice(0, 5).forEach(t => {
        const tr = document.createElement('tr');
        const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
        const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
        const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
        const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
        const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
        tr.appendChild(createActionsCell(t));
        tbody.appendChild(tr);
      });
      const addBtn = document.getElementById('add-dash-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    // --- EXPENSES PAGE RENDER ---
    let expState = { search: '', filterStatus: 'all', sortKey: 'date', sortAsc: false, page: 1, perPage: 5 };

    const renderExpPage = () => {
      let filtered = transactions.filter(t => {
        const matchesSearch = t.merchant.toLowerCase().includes(expState.search) || t.category.toLowerCase().includes(expState.search);
        const matchesStatus = expState.filterStatus === 'all' || t.status === expState.filterStatus;
        return matchesSearch && matchesStatus;
      });

      filtered.sort((a, b) => {
        let valA = a[expState.sortKey], valB = b[expState.sortKey];
        if(typeof valA === 'string') valA = valA.toLowerCase(), valB = valB.toLowerCase();
        if(valA < valB) return expState.sortAsc ? -1 : 1;
        if(valA > valB) return expState.sortAsc ? 1 : -1;
        return 0;
      });

      const totalPages = Math.ceil(filtered.length / expState.perPage) || 1;
      if(expState.page > totalPages) expState.page = totalPages;
      const start = (expState.page - 1) * expState.perPage;
      const paginated = filtered.slice(start, start + expState.perPage);

      const tbody = document.getElementById('expensesBody'); tbody.innerHTML = '';
      
      if (paginated.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:40px; color:var(--text-muted);">No expenses found.</td></tr>`;
      } else {
        paginated.forEach(t => {
          const tr = document.createElement('tr');
          const tdM = document.createElement('td'); const strong = document.createElement('strong'); strong.textContent = t.merchant; tdM.appendChild(strong); tdM.setAttribute('data-label', 'Merchant'); tr.appendChild(tdM);
          const tdC = document.createElement('td'); tdC.textContent = t.category; tdC.setAttribute('data-label', 'Category'); tr.appendChild(tdC);
          const tdD = document.createElement('td'); tdD.textContent = t.date; tdD.setAttribute('data-label', 'Date'); tr.appendChild(tdD);
          const tdA = document.createElement('td'); tdA.textContent = '$' + parseFloat(t.amount).toFixed(2); tdA.setAttribute('data-label', 'Amount'); tr.appendChild(tdA);
          const tdS = document.createElement('td'); const sp = document.createElement('span'); sp.className = `status ${t.status}`; sp.textContent = t.status; tdS.appendChild(sp); tdS.setAttribute('data-label', 'Status'); tr.appendChild(tdS);
          tr.appendChild(createActionsCell(t));
          tbody.appendChild(tr);
        });
      }

      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) pageInfo.textContent = `Showing ${filtered.length ? start+1 : 0}-${Math.min(start+expState.perPage, filtered.length)} of ${filtered.length}`;
      const prevBtn = document.getElementById('prevBtn'); if(prevBtn) prevBtn.disabled = expState.page === 1;
      const nextBtn = document.getElementById('nextBtn'); if(nextBtn) nextBtn.disabled = expState.page === totalPages;

      const addBtn = document.getElementById('add-expense-btn'); if(addBtn) addBtn.onclick = openAdd;
    };

    if (document.getElementById('expensesBody')) {
      document.getElementById('searchExpense').addEventListener('input', (e) => { expState.search = e.target.value.toLowerCase(); expState.page = 1; renderExpPage(); });
      document.getElementById('filterStatus').addEventListener('change', (e) => { expState.filterStatus = e.target.value; expState.page = 1; renderExpPage(); });
      
      const sortHeader = (key) => { if(expState.sortKey === key) expState.sortAsc = !expState.sortAsc; else { expState.sortKey = key; expState.sortAsc = true; } renderExpPage(); };
      document.getElementById('thMerchant').onclick = () => sortHeader('merchant');
      document.getElementById('thDate').onclick = () => sortHeader('date');
      document.getElementById('thAmount').onclick = () => sortHeader('amount');

      document.getElementById('prevBtn').onclick = () => { if(expState.page > 1) { expState.page--; renderExpPage(); }};
      document.getElementById('nextBtn').onclick = () => { expState.page++; renderExpPage(); };
    }

    fetchTransactions();
  }
});