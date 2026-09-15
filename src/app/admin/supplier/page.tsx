"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createSupplier, toggleSupplierStatus, addHargaPengepul } from "@/lib/actions";
import type { Supplier, JenisSampah, HargaPengepul } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { Plus, Tags } from "lucide-react";

const EMPTY_FORM = { nama: "", noWhatsapp: "", alamat: "" };

export default function SupplierPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Supplier[]>([]);
  const [jenisList, setJenisList] = useState<JenisSampah[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [hargaModal, setHargaModal] = useState<Supplier | null>(null);
  const [hargaList, setHargaList] = useState<HargaPengepul[]>([]);
  const [editingJenis, setEditingJenis] = useState<JenisSampah | null>(null);
  const [hargaBaru, setHargaBaru] = useState("");
  const [hargaSaving, setHargaSaving] = useState(false);

  async function loadAll() {
    const [supplierSnap, jenisSnap] = await Promise.all([
      getDocs(query(collection(db, "supplier"), orderBy("createdAt", "desc"))),
      getDocs(query(collection(db, "jenisSampah"), where("status", "==", "aktif"))),
    ]);
    setList(supplierSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Supplier));
    setJenisList(jenisSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as JenisSampah));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.nama || !form.noWhatsapp) {
      setFormError("Nama dan No. WhatsApp wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createSupplier(form, user?.email || "");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadAll();
    } catch {
      setFormError("Gagal menyimpan supplier. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(s: Supplier) {
    await toggleSupplierStatus(s, user?.email || "");
    await loadAll();
  }

  async function openHarga(supplier: Supplier) {
    setHargaModal(supplier);
    setEditingJenis(null);
    setHargaBaru("");
    const snap = await getDocs(
      query(collection(db, "hargaPengepul"), where("supplierId", "==", supplier.id), orderBy("tanggalBerlaku", "desc"))
    );
    setHargaList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HargaPengepul));
  }

  // Latest priced entry per jenis (list is already ordered desc by tanggalBerlaku).
  const currentHarga = useMemo(() => {
    const map = new Map<string, HargaPengepul>();
    for (const h of hargaList) {
      if (!map.has(h.jenisSampahId)) map.set(h.jenisSampahId, h);
    }
    return map;
  }, [hargaList]);

  async function saveHarga() {
    if (!hargaModal || !editingJenis) return;
    const harga = Number(hargaBaru);
    if (!harga || harga <= 0) return;
    setHargaSaving(true);
    try {
      await addHargaPengepul(hargaModal, editingJenis, harga, user?.email || "");
      setEditingJenis(null);
      setHargaBaru("");
      await openHarga(hargaModal);
    } finally {
      setHargaSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Supplier / Pengepul</h1>
          <p className="text-sm text-gray-500">Kelola data pengepul dan harga jual sampah ke mereka.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Tambah
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">No. WhatsApp</th>
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
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Belum ada supplier.
                </td>
              </tr>
            )}
            {list.map((s) => (
              <tr key={s.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium text-brand-900">{s.nama}</p>
                  <p className="text-xs text-gray-500">{s.alamat}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{s.noWhatsapp}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(s)}>
                    <Badge tone={s.status === "aktif" ? "brand" : "gray"}>
                      {s.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openHarga(s)}
                    className="flex items-center gap-1 text-brand-600 hover:underline"
                  >
                    <Tags size={13} /> Kelola Harga
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Supplier">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nama Supplier/Pengepul"
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
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan Supplier"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!hargaModal}
        onClose={() => setHargaModal(null)}
        title={`Harga Pengepul - ${hargaModal?.nama ?? ""}`}
      >
        <div className="flex flex-col divide-y divide-brand-50">
          {jenisList.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">Belum ada jenis sampah aktif.</p>
          )}
          {jenisList.map((jenis) => {
            const current = currentHarga.get(jenis.id);
            const isEditing = editingJenis?.id === jenis.id;
            return (
              <div key={jenis.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-brand-900">{jenis.nama}</p>
                    <p className="text-xs text-gray-500">
                      {current
                        ? `${formatRupiah(current.harga)}/${jenis.satuan} · update ${formatDate(current.tanggalBerlaku)}`
                        : "Belum ada harga"}
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setEditingJenis(jenis);
                        setHargaBaru(current ? String(current.harga) : "");
                      }}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Ubah Harga
                    </button>
                  )}
                </div>
                {isEditing && (
                  <div className="mt-2 flex items-end gap-2">
                    <Input
                      label={`Harga baru (Rp/${jenis.satuan})`}
                      type="number"
                      value={hargaBaru}
                      onChange={(e) => setHargaBaru(e.target.value)}
                    />
                    <Button size="sm" onClick={saveHarga} disabled={hargaSaving}>
                      Simpan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingJenis(null)}>
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
