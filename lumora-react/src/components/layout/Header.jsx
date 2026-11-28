import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
export function Header({ title }) {
  const { isDark, toggleTheme } = useTheme();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900/80 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs text-slate-500">Welcome back, {user?.name}</p>
      </div>
      <button
        type="button"
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        onClick={toggleTheme}
        className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </header>
  );
}
