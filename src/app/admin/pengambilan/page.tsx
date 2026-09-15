"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createPengambilan, updatePengambilanStatus } from "@/lib/actions";
import type { Korlap, Pengambilan, StatusPengambilan } from "@/lib/types";
import { formatDate, formatDateInput } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { Plus } from "lucide-react";

const STATUS_LABEL: Record<StatusPengambilan, string> = {
  menunggu: "Menunggu",
  dijadwalkan: "Dijadwalkan",
  sedang_diambil: "Sedang Diambil",
  selesai: "Selesai",
  tidak_diambil: "Tidak Diambil",
};

const STATUS_TONE: Record<StatusPengambilan, "brand" | "gray" | "red" | "amber"> = {
  menunggu: "gray",
  dijadwalkan: "amber",
  sedang_diambil: "amber",
  selesai: "brand",
  tidak_diambil: "red",
};

const EMPTY_FORM = { rw: "", rt: "", korlapId: "", tanggal: formatDateInput(Date.now()), jam: "" };

export default function PengambilanPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Pengambilan[]>([]);
  const [korlapList, setKorlapList] = useState<Korlap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    const [pengambilanSnap, korlapSnap] = await Promise.all([
      getDocs(query(collection(db, "pengambilan"), orderBy("tanggal", "desc"))),
      getDocs(query(collection(db, "korlap"), where("status", "==", "aktif"))),
    ]);
    setList(pengambilanSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Pengambilan));
    setKorlapList(korlapSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Korlap));
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    const korlap = korlapList.find((k) => k.id === form.korlapId);
    if (!form.rw || !form.rt || !korlap || !form.tanggal || !form.jam) {
      setFormError("Semua kolom wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createPengambilan(
        {
          rw: form.rw,
          rt: form.rt,
          korlapId: korlap.id,
          korlapNama: korlap.nama,
          tanggal: new Date(form.tanggal).getTime(),
          jam: form.jam,
        },
        user?.email || ""
      );
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadAll();
    } catch {
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(item: Pengambilan, status: StatusPengambilan) {
    await updatePengambilanStatus(item.id, `RW ${item.rw}/RT ${item.rt} (${item.korlapNama})`, status, user?.email || "");
    await loadAll();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Pengambilan Sampah</h1>
          <p className="text-sm text-gray-500">Jadwal & status pengambilan sampah per RT oleh korlap.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Tambah Jadwal
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Tanggal</th>
              <th className="px-4 py-3 font-medium">RW/RT</th>
              <th className="px-4 py-3 font-medium">Korlap</th>
              <th className="px-4 py-3 font-medium">Jam</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada jadwal pengambilan.
                </td>
              </tr>
            )}
            {list.map((item) => (
              <tr key={item.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">{formatDate(item.tanggal)}</td>
                <td className="px-4 py-3">
                  {item.rw}/{item.rt}
                </td>
                <td className="px-4 py-3">{item.korlapNama}</td>
                <td className="px-4 py-3">{item.jam}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Badge tone={STATUS_TONE[item.status]}>{STATUS_LABEL[item.status]}</Badge>
                    <select
                      value={item.status}
                      onChange={(e) => changeStatus(item, e.target.value as StatusPengambilan)}
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs outline-none focus:border-brand-500"
                    >
                      {Object.entries(STATUS_LABEL).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Jadwal Pengambilan">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
          <Select
            label="Korlap"
            value={form.korlapId}
            onChange={(e) => setForm({ ...form, korlapId: e.target.value })}
            required
          >
            <option value="">-- Pilih Korlap --</option>
            {korlapList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama} (RW {k.rw}/RT {k.rt})
              </option>
            ))}
          </Select>
          <div className="flex gap-3">
            <Input
              label="Tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm({ ...form, tanggal: e.target.value })}
              required
            />
            <Input
              label="Jam"
              type="time"
              value={form.jam}
              onChange={(e) => setForm({ ...form, jam: e.target.value })}
              required
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan Jadwal"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
