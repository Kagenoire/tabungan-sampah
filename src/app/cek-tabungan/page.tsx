"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Leaf, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatRupiah, formatKg, formatDate } from "@/lib/format";

interface HasilCek {
  nama: string;
  idNasabah: string;
  totalSampahKg: number;
  jumlahSetoran: number;
  saldo: number;
  riwayat: { tanggal: number; jenisSampahNama: string; berat: number; nominalTabungan: number }[];
}

function SidePanel() {
  return (
    <div className="hidden w-[42%] flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
          <Leaf size={20} />
        </span>
        <span className="text-base font-bold">Tabungan Sampah</span>
      </Link>
      <div>
        <ShieldCheck size={36} className="text-brand-200" strokeWidth={1.5} />
        <p className="mt-4 text-2xl font-semibold leading-snug">
          Cek saldo tabungan sampahmu kapan saja, tanpa perlu bikin akun.
        </p>
        <p className="mt-3 text-sm text-brand-100">
          Cukup pakai ID Nasabah dan nomor WhatsApp yang terdaftar di pengurus Karang Taruna.
        </p>
      </div>
      <p className="text-xs text-brand-200">Data Anda privat dan hanya terlihat oleh Anda sendiri.</p>
    </div>
  );
}

export default function CekTabunganPage() {
  const [idNasabah, setIdNasabah] = useState("");
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasil, setHasil] = useState<HasilCek | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setHasil(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cek-tabungan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idNasabah, noWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Data tidak ditemukan.");
        return;
      }
      setHasil(data);
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (hasil) {
    return (
      <div className="flex min-h-screen bg-brand-50">
        <SidePanel />
        <div className="flex flex-1 flex-col px-6 pb-10 pt-8 sm:px-10">
          <button
            onClick={() => setHasil(null)}
            className="flex w-fit items-center gap-1 text-brand-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="mx-auto mt-4 w-full max-w-sm flex-1 lg:mt-10">
            <p className="text-sm text-gray-500">Halo,</p>
            <h1 className="text-xl font-bold text-brand-900">{hasil.nama}</h1>
            <p className="text-sm text-gray-500">ID Nasabah: {hasil.idNasabah}</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">Total Sampah</p>
                <p className="text-sm font-semibold text-brand-800">{formatKg(hasil.totalSampahKg)}</p>
              </div>
              <div className="rounded-xl bg-white p-3 shadow-sm">
                <p className="text-xs text-gray-500">Jumlah Setoran</p>
                <p className="text-sm font-semibold text-brand-800">{hasil.jumlahSetoran} kali</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-brand-600 p-4 text-white">
              <p className="text-xs text-brand-100">Tabungan Saat Ini</p>
              <p className="text-2xl font-bold">{formatRupiah(hasil.saldo)}</p>
            </div>

            <p className="mt-6 mb-2 text-sm font-semibold text-brand-900">Riwayat Setoran</p>
            <div className="flex flex-col divide-y divide-brand-100 rounded-xl bg-white p-3 shadow-sm">
              {hasil.riwayat.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400">Belum ada setoran.</p>
              )}
              {hasil.riwayat.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-brand-900">{r.jenisSampahNama}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(r.tanggal)} &middot; {formatKg(r.berat)}
                    </p>
                  </div>
                  <p className="font-medium text-brand-700">{formatRupiah(r.nominalTabungan)}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
              <ShieldCheck size={13} /> Data Anda aman dan hanya dapat diakses melalui halaman ini.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-50">
      <SidePanel />
      <div className="flex flex-1 flex-col px-6 pb-10 pt-8 sm:px-10">
        <Link href="/" className="flex w-fit items-center gap-1 text-brand-700">
          <ArrowLeft size={18} />
        </Link>
        <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col justify-center lg:mt-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <Leaf size={20} />
          </span>
          <h1 className="mt-3 text-xl font-bold text-brand-900">Cek Tabungan Sampah</h1>
          <p className="mt-1 text-sm text-gray-500">
            Masukkan data diri Anda untuk melihat saldo tabungan.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            <Input
              label="ID Nasabah"
              placeholder="Contoh: NS001"
              value={idNasabah}
              onChange={(e) => setIdNasabah(e.target.value)}
              required
            />
            <Input
              label="Nomor WhatsApp"
              placeholder="Contoh: 081234567890"
              value={noWhatsapp}
              onChange={(e) => setNoWhatsapp(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" size="lg" fullWidth disabled={loading}>
              <Search size={16} />
              {loading ? "Mencari..." : "Cek Tabungan"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
