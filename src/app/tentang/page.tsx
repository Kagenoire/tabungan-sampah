import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Recycle, Scale, Wallet, Gift, Award } from "lucide-react";

const FITUR = [
  { icon: Recycle, title: "Pencatatan Setoran", desc: "Setiap sampah yang disetor warga tercatat otomatis, lengkap dengan berat dan nilainya." },
  { icon: Scale, title: "Harga Transparan", desc: "Harga tiap jenis sampah dan pembagian hasil bisa diatur pengurus, riwayatnya tersimpan." },
  { icon: Wallet, title: "Tabungan Otomatis", desc: "Nilai sampah otomatis dihitung dan masuk ke saldo tabungan warga, tanpa hitung manual." },
  { icon: Gift, title: "Cair Saat Lebaran", desc: "Tabungan warga dicairkan menjelang Hari Raya, mirip parsel Lebaran dari hasil sampah." },
];

interface Anggota {
  nim: string;
  nama: string;
  prodi: string;
  penghargaan?: boolean;
}

const ANGGOTA: Anggota[] = [
  { nim: "10223006", nama: "Agung Fajar Sidik", prodi: "S1 Akuntansi" },
  { nim: "20223004", nama: "Muhammad Tauhid Fitrah Hidayah", prodi: "S1 DKV" },
  { nim: "20223037", nama: "Hexa Nasadia Gustiawan", prodi: "S1 DKV" },
  { nim: "30123005", nama: "Ani Samsiah", prodi: "S1 Hukum" },
  { nim: "30123006", nama: "Muhamad Rezky Firdaus", prodi: "S1 Hukum" },
  { nim: "30123062", nama: "Moch Rafli Hanafi", prodi: "S1 Hukum", penghargaan: true },
  { nim: "20123007", nama: "Raisya Puspa Kencana", prodi: "S1 Informatika" },
  { nim: "20123009", nama: "Deden Tio Zulfikri", prodi: "S1 Informatika" },
  { nim: "20123010", nama: "Firdaus", prodi: "S1 Informatika" },
  { nim: "10123007", nama: "Dian Nova", prodi: "S1 Manajemen" },
];

const DPL = ["Enang Suherman, S.E., M.M.", "Dr. Makmur, S.H., M.H.", "Ridha Adjie Eryadi, S.T., M.T.I."];

export default function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-50 via-brand-50 to-white">
      <header className="sticky top-0 z-30 border-b border-brand-100/70 bg-brand-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center px-5 py-3.5 sm:px-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
            <ArrowLeft size={16} /> Kembali
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Tentang Proyek Ini</p>
        <h1 className="mt-2 text-2xl font-bold text-brand-900 sm:text-3xl">Tabungan Sampah</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600">
          Website ini dibangun untuk membantu Karang Taruna mencatat program tabungan sampah:
          warga memilah dan menyetorkan sampah anorganik bernilai jual, nilainya otomatis
          dihitung dan ditabungkan, lalu dicairkan menjelang Lebaran. Sistemnya dirancang supaya
          bisa dipakai oleh RW atau lingkungan mana saja, bukan cuma satu tempat, dan semua data
          operasional (harga, persentase, jenis sampah) bisa diatur langsung oleh pengurus tanpa
          perlu ubah kode program.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {FITUR.map((f) => (
            <div key={f.title} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <f.icon size={18} />
              </span>
              <p className="mt-3 text-sm font-semibold text-brand-900">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Dirancang oleh</p>
          <div className="mt-4 flex flex-wrap items-center gap-8">
            <Image src="/logo/kelompok3.png" alt="Logo Kelompok 3" width={68} height={56} className="h-16 w-auto" />
            <Image
              src="/logo/digitech-university.png"
              alt="Logo Digitech University"
              width={280}
              height={96}
              className="h-11 w-auto"
            />
          </div>
          <p className="mt-5 text-sm font-semibold text-brand-900">Kelompok 3</p>
          <p className="text-sm text-gray-500">Digitech University</p>
          <p className="mt-1 text-xs text-gray-400">Lokasi: Kelurahan Cipamokolan, RW 05 &amp; RW 06</p>

          <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-brand-500">
            Dosen Pembimbing Lapangan
          </p>
          <ul className="mt-2 flex flex-col gap-1">
            {DPL.map((nama) => (
              <li key={nama} className="text-sm text-gray-700">
                {nama}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
                <th className="px-4 py-3 font-medium">NIM</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Prodi</th>
              </tr>
            </thead>
            <tbody>
              {ANGGOTA.map((a) => (
                <tr key={a.nim} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-3 text-gray-500">{a.nim}</td>
                  <td className="px-4 py-3 font-medium text-brand-900">
                    <span className="inline-flex items-center gap-1.5">
                      {a.nama}
                      {a.penghargaan && <Award size={14} className="text-earth-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.prodi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">Digunakan oleh</p>
          <div className="mt-4 flex flex-wrap items-center gap-8">
            <Image
              src="/logo/six-karang-taruna-badge.png"
              alt="Logo Six Karang Taruna"
              width={124}
              height={124}
              className="h-16 w-auto"
            />
            <Image
              src="/logo/katarsix-wordmark.jpeg"
              alt="KATARSIX"
              width={256}
              height={90}
              className="h-10 w-auto"
            />
          </div>
          <p className="mt-5 text-sm font-semibold text-brand-900">Six Karang Taruna</p>
          <p className="text-sm text-gray-500">Mitra lapangan program Tabungan Sampah ini.</p>
        </div>
      </main>
    </div>
  );
}
