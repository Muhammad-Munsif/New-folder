export function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
        {Icon && <Icon className={color || "text-primary"} size={24} />}
      </div>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}