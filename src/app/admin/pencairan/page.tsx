"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { cairkanTabungan } from "@/lib/actions";
import type { Nasabah } from "@/lib/types";
import { formatRupiah } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, Card, StatCard } from "@/components/ui/Card";
import { Gift, Search, Wallet, Users } from "lucide-react";

export default function PencairanPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Nasabah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [target, setTarget] = useState<Nasabah | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  async function loadNasabah() {
    const snap = await getDocs(query(collection(db, "nasabah"), orderBy("createdAt", "desc")));
    const items = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Nasabah)
      .filter((n) => n.jumlahSetoran > 0);
    setList(items);
    setLoading(false);
  }

  useEffect(() => {
    loadNasabah();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return list;
    const s = search.toLowerCase();
    return list.filter(
      (n) => n.nama.toLowerCase().includes(s) || n.idNasabah.toLowerCase().includes(s)
    );
  }, [list, search]);

  const summary = useMemo(() => {
    const belumCair = list.filter((n) => n.saldo > 0);
    return {
      jumlah: belumCair.length,
      total: belumCair.reduce((sum, n) => sum + n.saldo, 0),
    };
  }, [list]);

  async function handleCairkan() {
    if (!target) return;
    setError("");
    setProcessing(true);
    try {
      const nominal = await cairkanTabungan(target.id, user?.email || "");
      setToast(`Tabungan ${target.nama} sebesar ${formatRupiah(nominal)} berhasil dicairkan.`);
      setTarget(null);
      await loadNasabah();
      setTimeout(() => setToast(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mencairkan tabungan.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Pencairan Tabungan Lebaran</h1>
        <p className="text-sm text-gray-500">Cairkan saldo tabungan warga menjelang Hari Raya.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Siap Dicairkan"
          value={`${summary.jumlah} warga`}
          icon={<Users size={18} />}
        />
        <StatCard
          label="Total Nominal"
          value={formatRupiah(summary.total)}
          icon={<Wallet size={18} />}
          tone="earth"
        />
      </div>

      {toast && (
        <Card className="border-brand-300 bg-brand-50 p-3 text-sm font-medium text-brand-800">
          {toast}
        </Card>
      )}

      <Input
        icon={<Search size={15} />}
        placeholder="Cari nama atau ID nasabah..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
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
                  Belum ada nasabah dengan riwayat setoran.
                </td>
              </tr>
            )}
            {filtered.map((n) => (
              <tr key={n.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">{n.nama}</p>
                  <p className="text-xs text-gray-500">
                    {n.idNasabah} &middot; RT {n.rt}/RW {n.rw}
                  </p>
                </td>
                <td className="px-4 py-3 font-medium text-brand-800">{formatRupiah(n.saldo)}</td>
                <td className="px-4 py-3">
                  <Badge tone={n.saldo > 0 ? "amber" : "brand"}>
                    {n.saldo > 0 ? "Belum Dicairkan" : "Sudah Dicairkan"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button size="sm" disabled={n.saldo <= 0} onClick={() => setTarget(n)}>
                    <Gift size={14} /> Cairkan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!target} onClose={() => setTarget(null)} title="Cairkan Tabungan">
        {target && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-600">
              Cairkan tabungan atas nama <span className="font-semibold text-brand-900">{target.nama}</span>{" "}
              ({target.idNasabah}) sebesar:
            </p>
            <div className="rounded-xl bg-brand-600 p-4 text-center text-white">
              <p className="text-2xl font-bold">{formatRupiah(target.saldo)}</p>
            </div>
            <p className="text-xs text-gray-500">
              Pastikan uang/barang sudah benar-benar diserahkan ke warga sebelum menekan tombol di bawah.
              Saldo akan otomatis menjadi Rp0 dan tercatat sebagai sudah dicairkan.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" fullWidth onClick={() => setTarget(null)} disabled={processing}>
                Batal
              </Button>
              <Button fullWidth onClick={handleCairkan} disabled={processing}>
                {processing ? "Memproses..." : "Cairkan Tabungan"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
