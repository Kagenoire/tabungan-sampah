"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AuditLog } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/Input";
import { Search } from "lucide-react";

export default function AuditLogPage() {
  const [list, setList] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, "auditLog"), orderBy("tanggal", "desc"), limit(300)));
      setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AuditLog));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (item) =>
        item.action.toLowerCase().includes(s) ||
        item.detail.toLowerCase().includes(s) ||
        item.adminEmail.toLowerCase().includes(s)
    );
  }, [list, search]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Riwayat Aktivitas</h1>
        <p className="text-sm text-gray-500">
          Jejak siapa mengubah apa dan kapan. Catatan ini tidak bisa diubah atau dihapus.
        </p>
      </div>

      <Input
        icon={<Search size={15} />}
        placeholder="Cari aksi, detail, atau admin..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="flex flex-col divide-y divide-brand-50">
          {loading && <p className="px-4 py-6 text-center text-sm text-gray-400">Memuat data...</p>}
          {!loading && filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Belum ada aktivitas tercatat.</p>
          )}
          {filtered.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-brand-900">{item.action}</p>
                <p className="text-xs text-gray-500">{item.detail}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-gray-400">
                <p>{formatDate(item.tanggal)}</p>
                <p>{item.adminEmail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
