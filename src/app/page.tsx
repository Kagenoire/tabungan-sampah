"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Leaf,
  Recycle,
  Search,
  ShieldCheck,
  Wallet,
  PackageCheck,
  Scale,
  Gift,
  ArrowRight,
  Megaphone,
} from "lucide-react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatRupiah } from "@/lib/format";
import type { JenisSampah, Pengaturan } from "@/lib/types";

const DEFAULT_PENGATURAN: Pengaturan = {
  namaProgram: "Tabungan Sampah",
  tagline: "Nabung Dari Sampah, Panen Manfaat di Hari Raya",
  pengumuman: "",
  updatedAt: 0,
};

const STEPS = [
  {
    icon: Recycle,
    title: "Pilah & Kumpulkan",
    desc: "Warga memilah sampah anorganik bernilai jual dari rumah masing-masing.",
  },
  {
    icon: Scale,
    title: "Setor & Ditimbang",
    desc: "Sampah disetorkan dan ditimbang, lalu langsung tercatat oleh pengurus.",
  },
  {
    icon: Wallet,
    title: "Masuk Tabungan",
    desc: "Nilai sampah otomatis dihitung dan ditambahkan ke saldo tabungan warga.",
  },
  {
    icon: Gift,
    title: "Cair Saat Lebaran",
    desc: "Tabungan terkumpul dicairkan menjelang Hari Raya, seperti parsel Lebaran.",
  },
];

export default function LandingPage() {
  const [hargaList, setHargaList] = useState<JenisSampah[]>([]);
  const [loadingHarga, setLoadingHarga] = useState(true);
  const [pengaturan, setPengaturan] = useState<Pengaturan>(DEFAULT_PENGATURAN);

  useEffect(() => {
    async function loadHarga() {
      try {
        const q = query(collection(db, "jenisSampah"), where("status", "==", "aktif"));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as JenisSampah);
        setHargaList(items.slice(0, 6));
      } catch {
        setHargaList([]);
      } finally {
        setLoadingHarga(false);
      }
    }
    async function loadPengaturan() {
      try {
        const snap = await getDoc(doc(db, "pengaturan", "umum"));
        if (snap.exists()) setPengaturan(snap.data() as Pengaturan);
      } catch {
        // keep defaults
      }
    }
    loadHarga();
    loadPengaturan();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-brand-50 to-white">
      <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-brand-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
              <Leaf size={20} />
            </span>
            <span className="text-base font-bold leading-tight text-brand-900">
              {pengaturan.namaProgram}
            </span>
          </div>
          <Link
            href="/cek-tabungan"
            className="hidden items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100 sm:flex"
          >
            <Search size={15} /> Cek Tabungan
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-16 pt-10 sm:px-8 sm:pt-16">
        {pengaturan.pengumuman && (
          <div className="mb-8 flex items-start gap-2.5 rounded-2xl border border-earth-300/60 bg-earth-100/70 p-3.5 text-sm text-earth-500">
            <Megaphone size={16} className="mt-0.5 shrink-0" />
            <p>{pengaturan.pengumuman}</p>
          </div>
        )}
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
              <Leaf size={12} /> Untuk Karang Taruna &amp; warga di RW mana saja
            </span>
            <h1 className="mt-4 text-3xl font-bold leading-tight text-brand-900 sm:text-4xl lg:text-[2.75rem]">
              {pengaturan.tagline}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-600">
              Pilah sampah anorganik dari rumah, setorkan ke pengurus Karang Taruna, dan pantau
              tabunganmu tumbuh secara transparan menjelang Lebaran, dicatat rapi tanpa buku
              manual.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-brand-600/20 transition-colors hover:bg-brand-700"
              >
                <ShieldCheck size={17} />
                Login Admin
              </Link>
              <Link
                href="/cek-tabungan"
                className="flex items-center justify-center gap-2 rounded-xl border border-brand-300 bg-white px-5 py-3.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                <Search size={17} />
                Cek Tabungan Warga
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <PackageCheck size={15} className="text-brand-600" /> Pencatatan otomatis
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-brand-600" /> Tanpa perlu akun warga
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="absolute -left-6 -top-8 h-32 w-32 rounded-full bg-brand-200/50 blur-2xl" />
            <div className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-earth-300/30 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-brand-100 bg-white p-6 shadow-xl shadow-brand-900/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Saldo Tabungan</p>
                  <p className="text-2xl font-bold text-brand-900">Rp 250.000</p>
                </div>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
                  <Recycle size={22} />
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-brand-50 p-3.5">
                  <p className="text-[11px] text-gray-500">Total Sampah</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-800">32 kg</p>
                </div>
                <div className="rounded-2xl bg-brand-50 p-3.5">
                  <p className="text-[11px] text-gray-500">Jumlah Setoran</p>
                  <p className="mt-0.5 text-sm font-semibold text-brand-800">12 kali</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col divide-y divide-brand-50 rounded-2xl bg-white">
                {[
                  { nama: "Botol Plastik", nilai: "Rp 9.000" },
                  { nama: "Kardus", nilai: "Rp 7.500" },
                ].map((r) => (
                  <div key={r.nama} className="flex items-center justify-between py-2.5 text-sm">
                    <span className="text-gray-600">{r.nama}</span>
                    <span className="font-medium text-brand-700">{r.nilai}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 sm:mt-28">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-brand-500">
            Cara Kerja
          </p>
          <h2 className="mt-2 text-center text-xl font-bold text-brand-900 sm:text-2xl">
            Dari sampah rumah tangga jadi tabungan Lebaran
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-2xl border border-brand-100 bg-white p-5 shadow-sm"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <step.icon size={20} />
                </span>
                <p className="mt-3 text-xs font-semibold text-brand-400">Langkah {i + 1}</p>
                <p className="mt-0.5 text-sm font-semibold text-brand-900">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {!loadingHarga && hargaList.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                Harga Sampah Terbaru
              </p>
              <Link
                href="/cek-tabungan"
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                Cek tabungan saya <ArrowRight size={12} />
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {hargaList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-brand-100 bg-white p-3.5 text-center shadow-sm"
                >
                  <p className="truncate text-[11px] text-gray-500">{item.nama}</p>
                  <p className="mt-0.5 text-xs font-semibold text-brand-700">
                    {formatRupiah(item.harga)}/{item.satuan}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-brand-100/70 py-8 text-center text-xs text-gray-400">
        <p>Program {pengaturan.namaProgram} &middot; dikelola oleh Karang Taruna setempat</p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Image src="/logo/kelompok3.png" alt="Logo Kelompok 3" width={68} height={56} className="h-7 w-auto" />
          <span className="h-6 w-px bg-brand-100" />
          <Image
            src="/logo/digitech-university.png"
            alt="Logo Digitech University"
            width={280}
            height={96}
            className="h-5 w-auto"
          />
        </div>
        <Link href="/tentang" className="mt-2 inline-block text-brand-600 hover:underline">
          Dibuat oleh Kelompok 3 &middot; Digitech University
        </Link>
      </footer>
    </div>
  );
}
