import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';

const ProtectedLayout = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* 🛠️ CUSTOMIZED TOAST PACKAGE */}
          <Toaster
            position="top-right"
            toastOptions={{
              // Default styles for all toasts
              className: '!bg-white dark:!bg-slate-800 !text-slate-800 dark:!text-white !border !border-slate-200 dark:!border-slate-700 !shadow-lg !rounded-xl !text-sm !font-medium',
              duration: 3000,
              style: {
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981', // Tailwind green-500
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444', // Tailwind red-500
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/expenses" element={<Expenses />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}