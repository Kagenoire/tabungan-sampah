"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Setoran } from "@/lib/types";
import { formatRupiah, formatKg, formatDate } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Search, Plus } from "lucide-react";

export default function RiwayatSetoranPage() {
  const [list, setList] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, "setoran"), orderBy("tanggal", "desc")));
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Setoran));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (item) =>
        item.nasabahNama.toLowerCase().includes(s) ||
        item.jenisSampahNama.toLowerCase().includes(s) ||
        item.nasabahIdNasabah.toLowerCase().includes(s)
    );
  }, [list, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Riwayat Setoran</h1>
          <p className="text-sm text-gray-500">Lihat riwayat setoran sampah semua nasabah.</p>
        </div>
        <Link href="/admin/setoran/baru">
          <Button size="sm">
            <Plus size={15} /> Setoran Baru
          </Button>
        </Link>
      </div>

      <Input
        icon={<Search size={15} />}
        placeholder="Cari nama nasabah atau jenis sampah..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Jenis</th>
              <th className="px-4 py-3 font-medium">Berat</th>
              <th className="px-4 py-3 font-medium">Nilai Tabungan</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada setoran.
                </td>
              </tr>
            )}
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">{formatDate(item.tanggal)}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/nasabah/${item.nasabahId}`} className="hover:underline">
                    {item.nasabahNama}
                  </Link>
                </td>
                <td className="px-4 py-3">{item.jenisSampahNama}</td>
                <td className="px-4 py-3">{formatKg(item.berat)}</td>
                <td className="px-4 py-3 font-medium text-brand-700">{formatRupiah(item.nominalTabungan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
