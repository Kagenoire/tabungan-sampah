import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  UsersRound,
  HandCoins,
  Store,
  ShoppingBag,
  Wallet,
  Truck,
  ClipboardList,
  Settings,
  ScrollText,
  ChevronRight,
} from "lucide-react";

const GROUPS: {
  title: string;
  items: { icon: typeof UsersRound; title: string; desc: string; href: string }[];
}[] = [
  {
    title: "Uang & Tabungan",
    items: [
      { icon: HandCoins, title: "Pencairan Tabungan Lebaran", desc: "Cairkan saldo tabungan warga menjelang Lebaran.", href: "/admin/pencairan" },
      { icon: Wallet, title: "Dana Karang Taruna", desc: "Bagian dana Karang Taruna, dana keluar, dan saldo.", href: "/admin/dana" },
    ],
  },
  {
    title: "Sampah & Pengepul",
    items: [
      { icon: Store, title: "Supplier / Pengepul", desc: "Data pengepul dan harga jual per jenis sampah.", href: "/admin/supplier" },
      { icon: ShoppingBag, title: "Penjualan Sampah", desc: "Catat hasil penjualan sampah ke pengepul.", href: "/admin/penjualan" },
    ],
  },
  {
    title: "Operasional",
    items: [
      { icon: Truck, title: "Korlap", desc: "Data koordinator lapangan per RT.", href: "/admin/korlap" },
      { icon: ClipboardList, title: "Pengambilan Sampah", desc: "Jadwal & status pengambilan sampah per RT.", href: "/admin/pengambilan" },
    ],
  },
  {
    title: "Sistem",
    items: [
      { icon: UsersRound, title: "Akun Admin", desc: "Tambah & kelola akun pengurus Karang Taruna lain.", href: "/admin/akun" },
      { icon: Settings, title: "Pengaturan Sistem", desc: "Profil program dan pengumuman di halaman utama.", href: "/admin/pengaturan" },
      { icon: ScrollText, title: "Riwayat Aktivitas", desc: "Jejak siapa mengubah apa dan kapan.", href: "/admin/audit" },
    ],
  },
];

export default function LainnyaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Lainnya</h1>
        <p className="text-sm text-gray-500">Fitur pendukung di luar alur harian setoran & nasabah.</p>
      </div>

      {GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{group.title}</p>
          <div className="flex flex-col gap-3">
            {group.items.map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="flex items-center gap-3 p-4 transition-colors hover:bg-brand-50">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                    <item.icon size={18} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-brand-300" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
