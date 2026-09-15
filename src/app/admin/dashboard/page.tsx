"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StatCard } from "@/components/ui/Card";
import { formatRupiah, formatKg } from "@/lib/format";
import type { Nasabah, Setoran } from "@/lib/types";
import { Users, Scale, PiggyBank, HandCoins } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BULAN = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export default function DashboardPage() {
  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [setoranList, setSetoranList] = useState<Setoran[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [nasabahSnap, setoranSnap] = await Promise.all([
        getDocs(collection(db, "nasabah")),
        getDocs(collection(db, "setoran")),
      ]);
      setNasabahList(nasabahSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Nasabah));
      setSetoranList(setoranSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Setoran));
      setLoading(false);
    }
    load();
  }, []);

  const stats = useMemo(() => {
    const nasabahAktif = nasabahList.filter((n) => n.status === "aktif");
    const totalSampah = setoranList.reduce((sum, s) => sum + s.berat, 0);
    const totalTabungan = nasabahList.reduce((sum, n) => sum + n.saldo, 0);
    const danaKarangTaruna = setoranList.reduce((sum, s) => sum + s.nominalKarangTaruna, 0);
    return {
      jumlahNasabah: nasabahAktif.length,
      totalSampah,
      totalTabungan,
      danaKarangTaruna,
    };
  }, [nasabahList, setoranList]);

  const chartData = useMemo(() => {
    const year = new Date().getFullYear();
    const totals = new Array(12).fill(0);
    setoranList.forEach((s) => {
      const d = new Date(s.tanggal);
      if (d.getFullYear() === year) totals[d.getMonth()] += s.berat;
    });
    return BULAN.map((bulan, i) => ({ bulan, kg: Math.round(totals[i] * 10) / 10 }));
  }, [setoranList]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Ringkasan Program Tabungan Sampah</p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Memuat data...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Jumlah Nasabah" value={`${stats.jumlahNasabah} warga`} icon={<Users size={18} />} />
            <StatCard label="Total Sampah Terkumpul" value={formatKg(stats.totalSampah)} icon={<Scale size={18} />} />
            <StatCard label="Total Tabungan Warga" value={formatRupiah(stats.totalTabungan)} icon={<PiggyBank size={18} />} />
            <StatCard label="Dana Karang Taruna" value={formatRupiah(stats.danaKarangTaruna)} icon={<HandCoins size={18} />} tone="earth" />
          </div>

          <div className="rounded-2xl border border-brand-100 bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold text-brand-900">Sampah Terkumpul per Bulan (kg)</p>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5f3ea" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                  <Tooltip
                    formatter={(value) => [`${value} kg`, "Sampah"]}
                    contentStyle={{ borderRadius: 12, borderColor: "#d7f2df", fontSize: 12 }}
                  />
                  <Bar dataKey="kg" fill="#279a5c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
