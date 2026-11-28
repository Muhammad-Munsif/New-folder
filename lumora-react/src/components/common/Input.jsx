import { cn } from "../../utils/cn";
export function Input({ className, label, icon: Icon, ...props }) {
  const inputId =
    props.id || label?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-3 text-slate-400" size={18} />
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:focus:border-primary",
            Icon && "pl-10",
            className,
          )}
          {...props}
        />
      </div>
    </div>
  );
}
