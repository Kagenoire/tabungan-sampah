"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, PackagePlus, Recycle, MoreHorizontal, LogOut, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Beranda", icon: LayoutDashboard },
  { href: "/admin/nasabah", label: "Nasabah", icon: Users },
  { href: "/admin/setoran/baru", label: "Setoran", icon: PackagePlus },
  { href: "/admin/jenis-sampah", label: "Jenis Sampah", icon: Recycle },
  { href: "/admin/lainnya", label: "Lainnya", icon: MoreHorizontal },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <p className="text-sm text-brand-600">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50/60">
      <header className="sticky top-0 z-30 border-b border-brand-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Leaf size={18} />
            </span>
            <span className="block text-sm font-semibold leading-tight text-brand-900">
              Tabungan Sampah
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-gray-500 sm:block">{user.email}</span>
            <button
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
              className="flex items-center gap-1.5 rounded-lg border border-brand-200 px-3 py-1.5 text-sm text-brand-700 hover:bg-brand-50"
            >
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </div>
        <nav className="mx-auto hidden max-w-6xl gap-1 px-4 pb-2 sm:flex">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-brand-600 text-white" : "text-brand-700 hover:bg-brand-100"
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-4 sm:pb-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-brand-100 bg-white sm:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-brand-700" : "text-gray-400"
              }`}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
