import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { DollarSign, ListOrdered, TrendingDown } from 'lucide-react';
import api from '../api';
import { StatCard } from '../components/common/StatCard';
import { Header } from '../components/layout/Header';
import toast from 'react-hot-toast';
ChartJS.register(ArcElement, Tooltip, Legend);
export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let isMounted = true;
    api.get('/transactions')
      .then((response) => {
        if (isMounted) setTransactions(response.data);
      })
      .catch((error) => {
        if (isMounted) {
          toast.error(
            error.response?.data?.message || 'Failed to load dashboard data',
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);
  const total = transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const grouped = transactions.reduce((acc, transaction) => {
    acc[transaction.category] =
      (acc[transaction.category] || 0) + Number(transaction.amount);
    return acc;
  }, {});
  const chartData = {
    labels: Object.keys(grouped).length ? Object.keys(grouped) : ['No Data'],
    datasets: [{
      data: Object.keys(grouped).length ? Object.values(grouped) : [1],
      backgroundColor: Object.keys(grouped).length ? ['#4f46e5', '#ec4899', '#10b981', '#f59e0b'] : ['#e2e8f0'],
      borderWidth: 0,
    }]
  };
  return (
    <div className="flex-1">
      <Header title="Overview" />
      <main className="space-y-8 p-4 sm:p-6 lg:p-8">
        {loading ? <p className="text-slate-500">Loading dashboard...</p> : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StatCard title="Total Expenses" value={`$${total.toFixed(2)}`} icon={DollarSign} />
              <StatCard title="Transactions" value={transactions.length} icon={ListOrdered} color="text-secondary" />
              <StatCard
                title="Pending Expenses"
                value={`$${transactions
                  .filter((transaction) => transaction.status === 'pending')
                  .reduce((sum, transaction) => sum + Number(transaction.amount), 0)
                  .toFixed(2)}`}
                icon={TrendingDown}
                color="text-red-500"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <h3 className="mb-4 font-bold">Expenses by Category</h3>
                <div className="flex h-64 justify-center">
                  <Doughnut data={chartData} options={{ cutout: '70%', plugins: { legend: { position: 'bottom' } } }} />
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
                <h3 className="mb-4 font-bold">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-700">
                      <tr><th className="pb-3">Merchant</th><th className="pb-3">Amount</th><th className="pb-3">Status</th></tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(t => (
                        <tr key={t._id} className="border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                          <td className="py-4 font-medium">{t.merchant}</td>
                          <td className="py-4">${Number(t.amount).toFixed(2)}</td>
                          <td className="py-4">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'}`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr><td colSpan="3" className="py-4 text-center text-slate-500">No transactions yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}