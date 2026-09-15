"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { saveJenisSampah, toggleJenisSampahStatus } from "@/lib/actions";
import type { JenisSampah, RiwayatHarga } from "@/lib/types";
import { formatRupiah, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { Plus, History } from "lucide-react";

const emptyForm = { nama: "", satuan: "kg", harga: "", persentaseWarga: "", persentaseKarangTaruna: "" };

export default function JenisSampahPage() {
  const { user } = useAuth();
  const [list, setList] = useState<JenisSampah[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JenisSampah | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [riwayatModal, setRiwayatModal] = useState<JenisSampah | null>(null);
  const [riwayat, setRiwayat] = useState<RiwayatHarga[]>([]);

  async function loadList() {
    const snap = await getDocs(query(collection(db, "jenisSampah"), orderBy("createdAt", "asc")));
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JenisSampah));
    setLoading(false);
  }

  useEffect(() => {
    loadList();
  }, []);

  function openAdd() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(item: JenisSampah) {
    setEditing(item);
    setForm({
      nama: item.nama,
      satuan: item.satuan,
      harga: String(item.harga),
      persentaseWarga: String(item.persentaseWarga),
      persentaseKarangTaruna: String(item.persentaseKarangTaruna),
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const harga = Number(form.harga);
    const persentaseWarga = Number(form.persentaseWarga);
    const persentaseKarangTaruna = Number(form.persentaseKarangTaruna);

    if (!form.nama || !form.harga || !form.persentaseWarga || !form.persentaseKarangTaruna) {
      setFormError("Semua kolom wajib diisi.");
      return;
    }
    if (persentaseWarga + persentaseKarangTaruna !== 100) {
      setFormError(
        `Persentase Warga + Karang Taruna harus 100%. Saat ini ${persentaseWarga + persentaseKarangTaruna}%.`
      );
      return;
    }

    setSaving(true);
    try {
      await saveJenisSampah(
        { nama: form.nama, satuan: form.satuan, harga, persentaseWarga, persentaseKarangTaruna },
        editing,
        user?.email || ""
      );
      setModalOpen(false);
      await loadList();
    } catch {
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(item: JenisSampah) {
    await toggleJenisSampahStatus(item, user?.email || "");
    await loadList();
  }

  async function openRiwayat(item: JenisSampah) {
    setRiwayatModal(item);
    const snap = await getDocs(
      query(collection(db, "riwayatHarga"), where("jenisSampahId", "==", item.id), orderBy("tanggal", "desc"))
    );
    setRiwayat(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as RiwayatHarga));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Jenis & Harga Sampah</h1>
          <p className="text-sm text-gray-500">Atur harga dan persentase pembagian tiap jenis sampah.</p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={15} /> Tambah
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Jenis Sampah</th>
              <th className="px-4 py-3 font-medium">Harga</th>
              <th className="px-4 py-3 font-medium">Warga</th>
              <th className="px-4 py-3 font-medium">Karang Taruna</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  Belum ada jenis sampah.
                </td>
              </tr>
            )}
            {list.map((item) => (
              <tr key={item.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3 font-medium text-brand-900">{item.nama}</td>
                <td className="px-4 py-3">{formatRupiah(item.harga)}/{item.satuan}</td>
                <td className="px-4 py-3">{item.persentaseWarga}%</td>
                <td className="px-4 py-3">{item.persentaseKarangTaruna}%</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(item)}>
                    <Badge tone={item.status === "aktif" ? "brand" : "gray"}>
                      {item.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(item)} className="text-brand-600 hover:underline">
                      Edit
                    </button>
                    <button
                      onClick={() => openRiwayat(item)}
                      className="flex items-center gap-1 text-gray-500 hover:underline"
                    >
                      <History size={13} /> Riwayat
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Jenis Sampah" : "Tambah Jenis Sampah"}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nama Sampah"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <div className="flex gap-3">
            <Input
              label="Satuan"
              value={form.satuan}
              onChange={(e) => setForm({ ...form, satuan: e.target.value })}
              required
            />
            <Input
              label="Harga (Rp)"
              type="number"
              value={form.harga}
              onChange={(e) => setForm({ ...form, harga: e.target.value })}
              required
            />
          </div>
          <div className="flex gap-3">
            <Input
              label="Persentase Warga (%)"
              type="number"
              value={form.persentaseWarga}
              onChange={(e) => setForm({ ...form, persentaseWarga: e.target.value })}
              required
            />
            <Input
              label="Persentase Karang Taruna (%)"
              type="number"
              value={form.persentaseKarangTaruna}
              onChange={(e) => setForm({ ...form, persentaseKarangTaruna: e.target.value })}
              required
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </form>
      </Modal>

      <Modal
        open={!!riwayatModal}
        onClose={() => setRiwayatModal(null)}
        title={`Riwayat Harga - ${riwayatModal?.nama ?? ""}`}
      >
        <div className="flex flex-col divide-y divide-brand-50">
          {riwayat.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">Belum ada perubahan harga.</p>
          )}
          {riwayat.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="text-gray-500">{formatDate(r.tanggal)}</p>
                <p className="text-xs text-gray-400">oleh {r.adminEmail}</p>
              </div>
              <p className="font-medium text-brand-800">
                {formatRupiah(r.hargaLama)} &rarr; {formatRupiah(r.hargaBaru)}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
