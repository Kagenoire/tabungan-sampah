"use client";

import { useEffect, useState, type FormEvent } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { savePengaturan } from "@/lib/actions";
import type { Pengaturan } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const DEFAULT: Pengaturan = {
  namaProgram: "Tabungan Sampah",
  tagline: "Nabung Dari Sampah, Panen Manfaat di Hari Raya",
  pengumuman: "",
  updatedAt: 0,
};

export default function PengaturanPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<Pengaturan>(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "pengaturan", "umum"));
      if (snap.exists()) setForm(snap.data() as Pengaturan);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    if (!form.namaProgram) {
      setError("Nama program wajib diisi.");
      return;
    }
    setSaving(true);
    try {
      await savePengaturan({ ...form, updatedAt: Date.now() }, user?.email || "");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat data...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Pengaturan Sistem</h1>
        <p className="text-sm text-gray-500">
          Profil program dan pengumuman yang tampil di halaman utama, bisa diubah tanpa perlu ubah kode.
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nama Program"
            value={form.namaProgram}
            onChange={(e) => setForm({ ...form, namaProgram: e.target.value })}
            required
          />
          <Input
            label="Tagline"
            value={form.tagline}
            onChange={(e) => setForm({ ...form, tagline: e.target.value })}
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-brand-900">Pengumuman (opsional)</span>
            <textarea
              value={form.pengumuman}
              onChange={(e) => setForm({ ...form, pengumuman: e.target.value })}
              placeholder="Contoh: Jadwal pengambilan sampah bulan ini digeser ke tanggal 20."
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <span className="text-xs text-gray-500">Tampil sebagai banner di halaman utama. Kosongkan untuk sembunyikan.</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-brand-600">Pengaturan tersimpan.</p>}

          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
