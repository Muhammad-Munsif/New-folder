<!DOCTYPE html>
<html lang="en" data-theme="light">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Expenses — Lumora</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
  <link rel="stylesheet" href="../style.css">
</head>

<body>
  <div class="app-layout">
    <div class="sidebar-backdrop" id="sidebarBackdrop"></div>
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-header"><a href="../index.html" class="brand"><span class="brand-icon"><i
              class="fa-solid fa-layer-group"></i></span> Lumora</a></div>
      <nav class="sidebar-nav">
        <a href="dashboard.html" class="sidebar-link"><i class="fa-solid fa-gauge-high"></i> Overview</a>
        <a href="expenses.html" class="sidebar-link active"><i class="fa-solid fa-file-invoice-dollar"></i> Expenses</a>
        <a href="reports.html" class="sidebar-link"><i class="fa-solid fa-chart-pie"></i> Reports</a>
        <a href="settings.html" class="sidebar-link"><i class="fa-solid fa-gear"></i> Settings</a>
      </nav>
      <div class="sidebar-footer"><button class="btn" id="logoutBtn"><i
            class="fa-solid fa-arrow-right-from-bracket"></i> Sign Out</button></div>
    </aside>
    <div class="main-wrapper">
      <header class="topbar">
        <div style="display:flex; align-items:center; gap:12px;">
          <button class="icon-btn mobile-sidebar-toggle" id="mobileSidebarBtn"><i class="fa-solid fa-bars"></i></button>
          <div>
            <div class="page-title">Expenses</div>
            <div class="page-subtitle">Manage your records</div>
          </div>
        </div>
        <div class="topbar-actions">
          <button class="btn btn-primary" id="add-expense-btn"><i class="fa-solid fa-plus"></i> <span
              class="hide-mobile">Add Expense</span></button>
        </div>
      </header>
      <main class="content-area">
        <div class="table-container">
          <div class="table-header">
            <div style="display:flex; gap:12px; width:100%; flex-wrap:wrap;">
              <div style="position:relative; flex:1;">
                <i class="fa-solid fa-magnifying-glass"
                  style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                <input type="text" id="searchExpense" class="input-field" placeholder="Search merchant..."
                  style="padding-left:40px;">
              </div>
              <select id="filterStatus" class="input-field" style="width:140px;">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th id="thMerchant">Merchant <i class="fa-solid fa-sort" style="font-size:.7rem;opacity:0.5;"></i></th>
                <th>Category</th>
                <th id="thDate">Date <i class="fa-solid fa-sort" style="font-size:.7rem;opacity:0.5;"></i></th>
                <th id="thAmount">Amount <i class="fa-solid fa-sort" style="font-size:.7rem;opacity:0.5;"></i></th>
                <th>Status</th>
                <th style="text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="expensesBody"></tbody>
          </table>
          <div
            style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-top:1px solid var(--border-color); font-size:.875rem; color:var(--text-muted);">
            <span id="pageInfo">Showing 0-0 of 0</span>
            <div style="display:flex; gap:8px;">
              <button class="icon-btn" id="prevBtn"><i class="fa-solid fa-chevron-left"></i></button>
              <button class="icon-btn" id="nextBtn"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
  <script src="../main.js"></script>
</body>

</html>import { useEffect, useState } from 'react';
import { Trash2, Edit, Plus } from 'lucide-react';
import api from '../api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import toast from 'react-hot-toast'; // 📦 Import the toast package

export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ merchant: '', amount: '', category: 'Software', status: 'paid' });

  const fetchData = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (err) {
      toast.error('Failed to load transactions');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛠️ Using toast.promise for Loading -> Success/Error transitions
    const promise = editId 
      ? api.put(`/transactions/${editId}`, formData)
      : api.post('/transactions', { ...formData, date: new Date().toISOString().split('T')[0] });

    toast.promise(promise, {
      loading: editId ? 'Updating expense...' : 'Saving expense...',
      success: () => {
        setIsModalOpen(false);
        setEditId(null);
        setFormData({ merchant: '', amount: '', category: 'Software', status: 'paid' });
        fetchData();
        return editId ? 'Expense updated!' : 'Expense added!';
      },
      error: 'Failed to save expense.',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    
    const promise = api.delete(`/transactions/${id}`);
    
    toast.promise(promise, {
      loading: 'Deleting...',
      success: () => {
        fetchData();
        return 'Expense deleted successfully.';
      },
      error: 'Failed to delete expense.',
    });
  };

  const openEdit = (t) => {
    setFormData({ merchant: t.merchant, amount: t.amount, category: t.category, status: t.status });
    setEditId(t._id);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1">
      <Header title="Expenses" />
      <main className="p-8 space-y-6">
        <div className="flex justify-end">
          <Button onClick={() => { setEditId(null); setFormData({ merchant: '', amount: '', category: 'Software', status: 'paid' }); setIsModalOpen(true); }}>
            <Plus size={18} /> Add Expense
          </Button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 dark:bg-slate-700/50">
              <tr>
                <th className="p-4">Merchant</th>
                <th className="p-4">Category</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t._id} className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">{t.merchant}</td>
                  <td className="p-4 text-slate-500">{t.category}</td>
                  <td className="p-4 font-bold">${t.amount.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <Button variant="ghost" className="p-2" onClick={() => openEdit(t)}><Edit size={18} className="text-blue-500" /></Button>
                    <Button variant="ghost" className="p-2" onClick={() => handleDelete(t._id)}><Trash2 size={18} className="text-red-500" /></Button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">No expenses found. Add one to get started!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editId ? 'Edit Expense' : 'Add Expense'}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Merchant" value={formData.merchant} onChange={e => setFormData({ ...formData, merchant: e.target.value })} required />
          <Input label="Amount ($)" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Category</label>
            <select className="w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
              <option>Software</option><option>Infrastructure</option><option>Meals</option><option>Travel</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select className="w-full rounded-xl border p-2.5 dark:bg-slate-800 dark:border-slate-700" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
              <option value="paid">Paid</option><option value="pending">Pending</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}