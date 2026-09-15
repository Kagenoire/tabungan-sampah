"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Penjualan } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Plus } from "lucide-react";

export default function RiwayatPenjualanPage() {
  const [list, setList] = useState<Penjualan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, "penjualan"), orderBy("tanggal", "desc")));
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Penjualan));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter((item) => item.supplierNama.toLowerCase().includes(s));
  }, [list, search]);

  const totalTerjual = useMemo(() => list.reduce((sum, p) => sum + p.total, 0), [list]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Penjualan Sampah</h1>
          <p className="text-sm text-gray-500">
            Riwayat penjualan ke pengepul &middot; total {formatRupiah(totalTerjual)}
          </p>
        </div>
        <Link href="/admin/penjualan/baru">
          <Button size="sm">
            <Plus size={15} /> Penjualan Baru
          </Button>
        </Link>
      </div>

      <Input
        icon={<Search size={15} />}
        placeholder="Cari nama supplier..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Supplier</th>
              <th className="px-4 py-3 font-medium">Total Penjualan</th>
              <th className="px-4 py-3 font-medium">Admin</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Belum ada penjualan.
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">{formatDate(item.tanggal)}</td>
                <td className="px-4 py-3 font-medium text-brand-900">{item.supplierNama}</td>
                <td className="px-4 py-3 font-medium text-brand-700">{formatRupiah(item.total)}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{item.adminEmail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
