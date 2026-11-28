import { useState } from 'react';
import { Download } from 'lucide-react';
import api from '../api';
import { Header } from '../components/layout/Header';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';
export default function Reports() {
  const [loading, setLoading] = useState(false);
  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/transactions');
      const transactions = res.data;
      if (transactions.length === 0) {
        toast.error('No data to export');
        return;
      }
      let csvContent = "Date,Merchant,Category,Amount,Status\n";
      transactions.forEach(t => {
        csvContent += `${t.date},"${t.merchant}","${t.category}",${t.amount},${t.status}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Lumora_Export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex-1">
      <Header title="Reports" />
      <main className="p-8">
        <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 text-lg font-bold">Export Transactions</h3>
          <p className="mb-6 text-sm text-slate-500">
            Download a complete CSV file of all your recorded expenses, including dates, categories, and amounts. This file can be opened in Excel or Google Sheets.
          </p>
          <Button onClick={handleExport} disabled={loading}>
            <Download size={18} /> {loading ? 'Generating...' : 'Download CSV'}
          </Button>
        </div>
      </main>
    </div>
  );
}