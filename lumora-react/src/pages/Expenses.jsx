import { useEffect, useState } from 'react';
import { Trash2, Edit, Plus } from 'lucide-react';
import api from '../api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import toast from 'react-hot-toast';
const emptyForm = {
  merchant: '',
  amount: '',
  category: 'Software',
  status: 'paid',
};
const loadTransactions = () =>
  api.get('/transactions').then((response) => response.data);
export default function Expenses() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const fetchData = async () => {
    try {
      setTransactions(await loadTransactions());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load transactions');
    }
  };
  useEffect(() => {
    let isMounted = true;
    loadTransactions()
      .then((data) => {
        if (isMounted) setTransactions(data);
      })
      .catch((error) => {
        if (isMounted) {
          toast.error(
            error.response?.data?.message || 'Failed to load transactions',
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editId) {
        await api.put(`/transactions/${editId}`, formData);
      } else {
        await api.post('/transactions', {
          ...formData,
          date: new Date().toISOString().split('T')[0],
        });
      }
      toast.success(editId ? 'Expense updated!' : 'Expense added!');
      setIsModalOpen(false);
      setEditId(null);
      setFormData(emptyForm);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense.');
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Expense deleted successfully.');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete expense.');
    }
  };
  const openEdit = (transaction) => {
    setFormData({
      merchant: transaction.merchant,
      amount: transaction.amount,
      category: transaction.category,
      status: transaction.status,
      date: transaction.date,
    });
    setEditId(transaction._id);
    setIsModalOpen(true);
  };
  const openCreate = () => {
    setEditId(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };
  return (
    <div className="min-w-0">
      <Header title="Expenses" />
      <main className="space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-end">
          <Button onClick={openCreate}>
            <Plus size={18} /> Add Expense
          </Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <table className="w-full min-w-[640px] text-left">
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
              {transactions.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="border-t border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700/30"
                >
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">
                    {transaction.merchant}
                  </td>
                  <td className="p-4 text-slate-500">{transaction.category}</td>
                  <td className="p-4 font-bold">
                    ${Number(transaction.amount).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        transaction.status === 'paid'
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="flex justify-end gap-2 p-4">
                    <Button
                      variant="ghost"
                      className="p-2"
                      aria-label={`Edit ${transaction.merchant}`}
                      onClick={() => openEdit(transaction)}
                    >
                      <Edit size={18} className="text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="p-2"
                      aria-label={`Delete ${transaction.merchant}`}
                      onClick={() => handleDelete(transaction._id)}
                    >
                      <Trash2 size={18} className="text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {!isLoading && transactions.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    No expenses found. Add one to get started!
                  </td>
                </tr>
              )}
              {isLoading && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500">
                    Loading expenses...
                  </td>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" form="expense-form">
              Save
            </Button>
          </>
        }
      >
        <form id="expense-form" className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Merchant"
            value={formData.merchant}
            onChange={(event) =>
              setFormData({ ...formData, merchant: event.target.value })
            }
            required
          />
          <Input
            label="Amount ($)"
            type="number"
            min="0.01"
            step="0.01"
            value={formData.amount}
            onChange={(event) =>
              setFormData({ ...formData, amount: event.target.value })
            }
            required
          />
          <div className="space-y-1.5">
            <label htmlFor="expense-category" className="text-sm font-medium">
              Category
            </label>
            <select
              id="expense-category"
              className="w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"
              value={formData.category}
              onChange={(event) =>
                setFormData({ ...formData, category: event.target.value })
              }
            >
              <option>Software</option>
              <option>Infrastructure</option>
              <option>Meals</option>
              <option>Travel</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="expense-status" className="text-sm font-medium">
              Status
            </label>
            <select
              id="expense-status"
              className="w-full rounded-xl border p-2.5 dark:border-slate-700 dark:bg-slate-800"
              value={formData.status}
              onChange={(event) =>
                setFormData({ ...formData, status: event.target.value })
              }
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
