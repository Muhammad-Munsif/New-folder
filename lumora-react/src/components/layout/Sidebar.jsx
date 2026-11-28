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
    <aside className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-slate-200 bg-white transition-colors duration-300 dark:border-slate-700 dark:bg-slate-800 md:inset-y-0 md:right-auto md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0">
      <div className="hidden h-16 items-center px-6 text-2xl font-bold text-primary md:flex">
        Lumora.
      </div>
      <nav className="flex h-full flex-1 items-stretch justify-around px-1 py-1 md:h-auto md:w-full md:flex-col md:items-stretch md:justify-start md:space-y-1 md:px-4 md:py-4">
        {links.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1 text-[10px] font-medium transition md:flex-row md:flex-none md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm ${
                isActive
                  ? "bg-primary text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`
            }
          >
            <Icon size={20} /> <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-l border-slate-200 px-1 py-1 dark:border-slate-700 md:w-full md:border-l-0 md:border-t md:p-4">
        <button
          onClick={logout}
          className="flex h-full flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 text-[10px] font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10 md:w-full md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-sm"
        >
          <LogOut size={20} /> <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
