import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, FileBarChart, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export function Sidebar() {
  const { logout } = useAuth();
  const links = [
    { path: "/", icon: LayoutDashboard, label: "Overview" },
    { path: "/expenses", icon: Receipt, label: "Expenses" },
    { path: "/reports", icon: FileBarChart, label: "Reports" },
  ];

  return (
    <aside className="fixed flex h-screen w-64 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 transition-colors duration-300">
      <div className="flex h-16 items-center px-6 text-2xl font-bold text-primary">
        Lumora.
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        {links.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`
            }
          >
            <Icon size={20} /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4 dark:border-slate-700">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
