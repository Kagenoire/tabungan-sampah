import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-brand-100 bg-white shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "earth";
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div
        className={clsx(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
          tone === "brand" ? "bg-brand-100 text-brand-700" : "bg-earth-100 text-earth-500"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs text-gray-500">{label}</p>
        <p className="truncate text-lg font-semibold text-brand-900">{value}</p>
      </div>
    </Card>
  );
}

export function Badge({
  children,
  tone = "brand",
}: {
  children: ReactNode;
  tone?: "brand" | "gray" | "red" | "amber";
}) {
  const tones: Record<string, string> = {
    brand: "bg-brand-100 text-brand-700",
    gray: "bg-gray-100 text-gray-600",
    red: "bg-red-100 text-red-600",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}
