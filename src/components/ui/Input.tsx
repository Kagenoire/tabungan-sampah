import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import clsx from "clsx";

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, className, id, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-1.5 w-full" htmlFor={id}>
        {label && (
          <span className="text-sm font-medium text-brand-900">{label}</span>
        )}
        <span className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-brand-400">{icon}</span>
          )}
          <input
            ref={ref}
            id={id}
            className={clsx(
              "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-gray-400 outline-none transition-colors",
              "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
              error ? "border-red-400" : "border-gray-200",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </span>
        {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </label>
    );
  }
);
Input.displayName = "Input";

type SelectProps = FieldProps & SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, hint, error, className, id, children, ...props }, ref) => {
    return (
      <label className="flex flex-col gap-1.5 w-full" htmlFor={id}>
        {label && (
          <span className="text-sm font-medium text-brand-900">{label}</span>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            "w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors",
            "focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
            error ? "border-red-400" : "border-gray-200",
            className
          )}
          {...props}
        >
          {children}
        </select>
        {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </label>
    );
  }
);
Select.displayName = "Select";
