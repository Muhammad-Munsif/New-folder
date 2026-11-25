import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export function Header({ title }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80 transition-colors duration-300">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h1>
        <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
      </div>
      <button
        onClick={toggleTheme}
        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}