"use client";

import { useEffect, useState, type FormEvent } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createKorlap, toggleKorlapStatus } from "@/lib/actions";
import type { Korlap } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Card";
import { Plus } from "lucide-react";

const EMPTY_FORM = { nama: "", noWhatsapp: "", rw: "", rt: "" };

export default function KorlapPage() {
  const { user } = useAuth();
  const [list, setList] = useState<Korlap[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadList() {
    const snap = await getDocs(query(collection(db, "korlap"), orderBy("createdAt", "desc")));
    setList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Korlap));
    setLoading(false);
  }

  useEffect(() => {
    loadList();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.nama || !form.noWhatsapp || !form.rw || !form.rt) {
      setFormError("Semua kolom wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await createKorlap(form, user?.email || "");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadList();
    } catch {
      setFormError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(k: Korlap) {
    await toggleKorlapStatus(k, user?.email || "");
    await loadList();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Data Korlap</h1>
          <p className="text-sm text-gray-500">Koordinator lapangan yang mengambil sampah per RT.</p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Tambah
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">No. WhatsApp</th>
              <th className="px-4 py-3 font-medium">RW/RT</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                  Belum ada korlap.
                </td>
              </tr>
            )}
            {list.map((k) => (
              <tr key={k.id} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3 font-medium text-brand-900">{k.nama}</td>
                <td className="px-4 py-3 text-gray-600">{k.noWhatsapp}</td>
                <td className="px-4 py-3">
                  {k.rw}/{k.rt}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(k)}>
                    <Badge tone={k.status === "aktif" ? "brand" : "gray"}>
                      {k.status === "aktif" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Korlap">
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
            {saving ? "Menyimpan..." : "Simpan Korlap"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
