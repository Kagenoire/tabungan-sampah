"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createNasabah, toggleNasabahStatus } from "@/lib/actions";
import type { Nasabah } from "@/lib/types";
import { formatRupiah, formatKg } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { Plus, Search } from "lucide-react";

export default function NasabahPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Nasabah[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [rwFilter, setRwFilter] = useState("");
  const [rtFilter, setRtFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nama: "", noWhatsapp: "", alamat: "", rw: "", rt: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function loadNasabah() {
    const snap = await getDocs(query(collection(db, "nasabah"), orderBy("createdAt", "desc")));
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Nasabah));
    setLoading(false);
  }

  useEffect(() => {
    loadNasabah();
  }, []);

  const rwOptions = useMemo(
    () => Array.from(new Set(list.map((n) => n.rw).filter(Boolean))).sort(),
    [list]
  );

  const rtOptions = useMemo(
    () =>
      Array.from(
        new Set(list.filter((n) => !rwFilter || n.rw === rwFilter).map((n) => n.rt))
      ).sort(),
    [list, rwFilter]
  );

  const filtered = useMemo(() => {
    return list.filter((n) => {
      const matchSearch =
        !search ||
        n.nama.toLowerCase().includes(search.toLowerCase()) ||
        n.alamat.toLowerCase().includes(search.toLowerCase()) ||
        n.idNasabah.toLowerCase().includes(search.toLowerCase());
      const matchRw = !rwFilter || n.rw === rwFilter;
      const matchRt = !rtFilter || n.rt === rtFilter;
      return matchSearch && matchRw && matchRt;
    });
  }, [list, search, rwFilter, rtFilter]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.nama || !form.noWhatsapp || !form.rw || !form.rt) {
      setFormError("Nama, No. WhatsApp, RW, dan RT wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createNasabah(form, list.length, user?.email || "");
      setModalOpen(false);
      setForm({ nama: "", noWhatsapp: "", alamat: "", rw: "", rt: "" });
      await loadNasabah();
    } catch {
      setFormError("Gagal menyimpan nasabah. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(n: Nasabah) {
    await toggleNasabahStatus(n, user?.email || "");
    await loadNasabah();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Data Nasabah</h1>
          <p className="text-sm text-gray-500">Kelola data warga tabungan sampah.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Tambah
        </Button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          icon={<Search size={15} />}
          placeholder="Cari nama, alamat, atau ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          value={rwFilter}
          onChange={(e) => {
            setRwFilter(e.target.value);
            setRtFilter("");
          }}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Semua RW</option>
          {rwOptions.map((rw) => (
            <option key={rw} value={rw}>
              RW {rw}
            </option>
          ))}
        </select>
        <select
          value={rtFilter}
          onChange={(e) => setRtFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
        >
          <option value="">Semua RT</option>
          {rtOptions.map((rt) => (
            <option key={rt} value={rt}>
              RT {rt}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">RW/RT</th>
              <th className="px-4 py-3 font-medium">No. HP</th>
              <th className="px-4 py-3 font-medium">Total Sampah</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Belum ada nasabah.
                </td>
              </tr>
            )}
            {filtered.map((n) => (
              <tr key={n.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3 font-medium text-brand-700">
                  <Link href={`/admin/nasabah/${n.id}`}>{n.idNasabah}</Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/nasabah/${n.id}`} className="hover:underline">
                    {n.nama}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {n.rw}/{n.rt}
                </td>
                <td className="px-4 py-3">{n.noWhatsapp}</td>
                <td className="px-4 py-3">{formatKg(n.totalSampahKg)}</td>
                <td className="px-4 py-3 font-medium">{formatRupiah(n.saldo)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(n)}>
                    <Badge tone={n.status === "aktif" ? "brand" : "gray"}>
                      {n.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Nasabah">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nama"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <Input
            label="No. WhatsApp"
            placeholder="08xxxxxxxxxx"
            value={form.noWhatsapp}
            onChange={(e) => setForm({ ...form, noWhatsapp: e.target.value })}
            required
          />
          <Input
            label="Alamat"
            value={form.alamat}
            onChange={(e) => setForm({ ...form, alamat: e.target.value })}
          />
          <div className="flex gap-3">
            <Input
              label="RW"
              placeholder="Contoh: 06"
              value={form.rw}
              onChange={(e) => setForm({ ...form, rw: e.target.value })}
              required
            />
            <Input
              label="RT"
              value={form.rt}
              onChange={(e) => setForm({ ...form, rt: e.target.value })}
              required
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan Nasabah"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
