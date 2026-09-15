"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { addDanaKeluar } from "@/lib/actions";
import type { Setoran, DanaKeluar } from "@/lib/types";
import { formatRupiah, formatDate, formatDateInput } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatCard } from "@/components/ui/Card";
import { PiggyBank, ArrowDownCircle, Wallet, Plus } from "lucide-react";

export default function DanaKarangTarunaPage() {
  const { user } = useAuth();
  const [setoranList, setSetoranList] = useState<Setoran[]>([]);
  const [danaKeluarList, setDanaKeluarList] = useState<DanaKeluar[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(() => ({ tanggal: formatDateInput(Date.now()), keterangan: "", nominal: "" }));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const [setoranSnap, danaKeluarSnap] = await Promise.all([
      getDocs(collection(db, "setoran")),
      getDocs(query(collection(db, "danaKeluar"), orderBy("tanggal", "desc"))),
    ]);
    setSetoranList(setoranSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Setoran));
    setDanaKeluarList(danaKeluarSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as DanaKeluar));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const summary = useMemo(() => {
    const totalMasuk = setoranList.reduce((sum, s) => sum + s.nominalKarangTaruna, 0);
    const totalKeluar = danaKeluarList.reduce((sum, d) => sum + d.nominal, 0);
    return { totalMasuk, totalKeluar, saldo: totalMasuk - totalKeluar };
  }, [setoranList, danaKeluarList]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const nominal = Number(form.nominal);
    if (!form.keterangan || !nominal || nominal <= 0) {
      setFormError("Keterangan dan nominal wajib diisi.");
      return;
    }
    if (nominal > summary.saldo) {
      setFormError(`Saldo dana Karang Taruna tidak cukup (saldo saat ini ${formatRupiah(summary.saldo)}).`);
      return;
    }
    setSaving(true);
    try {
      await addDanaKeluar(
        { tanggal: new Date(form.tanggal).getTime(), keterangan: form.keterangan, nominal },
        user?.email || ""
      );
      setModalOpen(false);
      setForm({ tanggal: formatDateInput(Date.now()), keterangan: "", nominal: "" });
      await loadAll();
    } catch {
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Dana Karang Taruna</h1>
          <p className="text-sm text-gray-500">Bagian hasil sampah untuk Karang Taruna dan penggunaannya.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Catat Dana Keluar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat data...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Bagian Karang Taruna" value={formatRupiah(summary.totalMasuk)} icon={<PiggyBank size={18} />} />
            <StatCard label="Total Dana Keluar" value={formatRupiah(summary.totalKeluar)} icon={<ArrowDownCircle size={18} />} tone="earth" />
            <StatCard label="Saldo Saat Ini" value={formatRupiah(summary.saldo)} icon={<Wallet size={18} />} />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                  <th className="px-4 py-3 font-medium">Keterangan</th>
                  <th className="px-4 py-3 font-medium">Nominal</th>
                  <th className="px-4 py-3 font-medium">Admin</th>
                </tr>
              </thead>
              <tbody>
                {danaKeluarList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      Belum ada dana keluar.
                    </td>
                  </tr>
                )}
                {danaKeluarList.map((d) => (
                  <tr key={d.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                    <td className="px-4 py-3">{formatDate(d.tanggal)}</td>
                    <td className="px-4 py-3">{d.keterangan}</td>
                    <td className="px-4 py-3 font-medium text-red-600">-{formatRupiah(d.nominal)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{d.adminEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Catat Dana Keluar">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Tanggal"
            type="date"
            value={form.tanggal}
            onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
            required
          />
          <Input
            label="Keterangan"
            placeholder="Contoh: Beli timbangan baru"
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            required
          />
          <Input
            label="Nominal (Rp)"
            type="number"
            value={form.nominal}
            onChange={(e) => setForm({ ...form, nominal: e.target.value })}
            required
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
