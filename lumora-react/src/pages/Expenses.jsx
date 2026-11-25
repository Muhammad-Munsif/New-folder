import { useEffect, useState } from 'react';
import { Trash2, Edit, Plus } from 'lucide-react';
import api from '../api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import toast from 'react-hot-toast';

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
    
    const promise = editId 
      ? api.put(`/transactions/${editId}`, formData)
      : api.post('/transactions', { ...formData, date: new Date().toISOString().split('T')[0] });

    toast.promise(promise, {
      loading: editId ? 'Updating...' : 'Saving...',
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