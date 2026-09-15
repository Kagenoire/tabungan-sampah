"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { toggleNasabahStatus } from "@/lib/actions";
import type { Nasabah, Setoran } from "@/lib/types";
import { formatRupiah, formatKg, formatDate } from "@/lib/format";
import { Card, Badge } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Recycle } from "lucide-react";

export function NasabahDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const [nasabah, setNasabah] = useState<Nasabah | null>(null);
  const [riwayat, setRiwayat] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const nasabahSnap = await getDoc(doc(db, "nasabah", id));
    if (nasabahSnap.exists()) {
      setNasabah({ id: nasabahSnap.id, ...nasabahSnap.data() } as Nasabah);
    }
    const setoranSnap = await getDocs(
      query(collection(db, "setoran"), where("nasabahId", "==", id), orderBy("tanggal", "desc"))
    );
    setRiwayat(setoranSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Setoran));
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function toggleStatus() {
    if (!nasabah) return;
    await toggleNasabahStatus(nasabah, user?.email || "");
    await load();
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat data...</p>;
  if (!nasabah) return <p className="text-sm text-gray-400">Nasabah tidak ditemukan.</p>;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/nasabah" className="flex w-fit items-center gap-1.5 text-sm text-brand-700">
        <ArrowLeft size={15} /> Kembali
      </Link>

      <Card className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-base font-semibold text-brand-900">{nasabah.nama}</p>
            <p className="text-sm text-gray-500">
              {nasabah.idNasabah} &middot; RT {nasabah.rt}/RW {nasabah.rw}
            </p>
            <p className="text-sm text-gray-500">{nasabah.noWhatsapp}</p>
            {nasabah.alamat && <p className="text-sm text-gray-500">{nasabah.alamat}</p>}
          </div>
          <Badge tone={nasabah.status === "aktif" ? "brand" : "gray"}>
            {nasabah.status === "aktif" ? "Aktif" : "Nonaktif"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs text-gray-500">Total Sampah</p>
            <p className="text-sm font-semibold text-brand-800">{formatKg(nasabah.totalSampahKg)}</p>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs text-gray-500">Jumlah Setoran</p>
            <p className="text-sm font-semibold text-brand-800">{nasabah.jumlahSetoran} kali</p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-brand-600 p-4 text-white">
          <p className="text-xs text-brand-100">Saldo Tabungan</p>
          <p className="text-2xl font-bold">{formatRupiah(nasabah.saldo)}</p>
        </div>

        <div className="mt-4 flex gap-2">
          <Link href={`/admin/setoran/baru?nasabah=${nasabah.id}`} className="flex-1">
            <Button fullWidth size="sm">
              <Recycle size={14} /> Input Setoran
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={toggleStatus}>
            {nasabah.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <p className="mb-3 text-sm font-semibold text-brand-900">Riwayat Setoran</p>
        <div className="flex flex-col divide-y divide-brand-50">
          {riwayat.length === 0 && (
            <p className="py-4 text-center text-sm text-gray-400">Belum ada setoran.</p>
          )}
          {riwayat.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
              <div>
                <p className="font-medium text-brand-900">{s.jenisSampahNama}</p>
                <p className="text-xs text-gray-500">
                  {formatDate(s.tanggal)} &middot; {formatKg(s.berat)}
                </p>
              </div>
              <p className="font-medium text-brand-700">{formatRupiah(s.nominalTabungan)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
