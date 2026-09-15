"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { submitSetoran } from "@/lib/actions";
import type { JenisSampah, Nasabah } from "@/lib/types";
import { formatRupiah, formatDateInput } from "@/lib/format";
import { hitungSetoran } from "@/lib/calc";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2 } from "lucide-react";

interface Row {
  jenisSampahId: string;
  berat: string;
}

export function InputSetoranClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectNasabah = searchParams.get("nasabah") || "";

  const [nasabahList, setNasabahList] = useState<Nasabah[]>([]);
  const [jenisList, setJenisList] = useState<JenisSampah[]>([]);
  const [nasabahId, setNasabahId] = useState(preselectNasabah);
  const [tanggal, setTanggal] = useState(() => formatDateInput(Date.now()));
  const [rows, setRows] = useState<Row[]>([{ jenisSampahId: "", berat: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const [nasabahSnap, jenisSnap] = await Promise.all([
        getDocs(query(collection(db, "nasabah"), where("status", "==", "aktif"))),
        getDocs(query(collection(db, "jenisSampah"), where("status", "==", "aktif"))),
      ]);
      setNasabahList(nasabahSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Nasabah));
      setJenisList(jenisSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as JenisSampah));
      setLoading(false);
    }
    load();
  }, []);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { jenisSampahId: "", berat: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const computedRows = useMemo(() => {
    return rows.map((row) => {
      const jenis = jenisList.find((j) => j.id === row.jenisSampahId);
      const berat = Number(row.berat) || 0;
      if (!jenis || !berat) return null;
      const calc = hitungSetoran(berat, jenis.harga, jenis.persentaseWarga, jenis.persentaseKarangTaruna);
      return { jenis, berat, ...calc };
    });
  }, [rows, jenisList]);

  const totals = useMemo(() => {
    return computedRows.reduce(
      (acc, r) => {
        if (!r) return acc;
        acc.totalNilai += r.totalNilai;
        acc.nominalTabungan += r.nominalTabungan;
        acc.nominalKarangTaruna += r.nominalKarangTaruna;
        return acc;
      },
      { totalNilai: 0, nominalTabungan: 0, nominalKarangTaruna: 0 }
    );
  }, [computedRows]);

  async function handleSubmit() {
    setError("");
    if (!nasabahId) {
      setError("Pilih nasabah terlebih dahulu.");
      return;
    }
    const validRows = computedRows.filter((r): r is NonNullable<typeof r> => r !== null);
    if (validRows.length === 0) {
      setError("Isi minimal satu jenis sampah dan berat.");
      return;
    }

    const nasabah = nasabahList.find((n) => n.id === nasabahId);
    if (!nasabah) {
      setError("Nasabah tidak ditemukan.");
      return;
    }

    setSaving(true);
    try {
      const tanggalMs = new Date(tanggal).getTime();
      await submitSetoran(
        nasabah,
        validRows.map((row) => ({ jenis: row.jenis, berat: row.berat })),
        tanggalMs,
        user?.email || ""
      );
      setSuccess(true);
      setTimeout(() => router.push(`/admin/nasabah/${nasabah.id}`), 900);
    } catch {
      setError("Gagal menyimpan setoran. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat data...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Input Setoran Sampah</h1>
        <p className="text-sm text-gray-500">Catat setoran dari nasabah, nilai dihitung otomatis.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <Select
            label="Pilih Nasabah"
            value={nasabahId}
            onChange={(e) => setNasabahId(e.target.value)}
          >
            <option value="">-- Pilih Nasabah --</option>
            {nasabahList.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nama} ({n.idNasabah})
              </option>
            ))}
          </Select>

          {rows.map((row, index) => {
            const computed = computedRows[index];
            return (
              <div key={index} className="rounded-xl border border-brand-100 p-3">
                <div className="flex items-end gap-2">
                  <Select
                    label="Jenis Sampah"
                    value={row.jenisSampahId}
                    onChange={(e) => updateRow(index, { jenisSampahId: e.target.value })}
                  >
                    <option value="">-- Pilih --</option>
                    {jenisList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama} ({formatRupiah(j.harga)}/{j.satuan})
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Berat (kg)"
                    type="number"
                    step="0.1"
                    value={row.berat}
                    onChange={(e) => updateRow(index, { berat: e.target.value })}
                    className="max-w-[110px]"
                  />
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="mb-1 rounded-lg p-2.5 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                {computed && (
                  <p className="mt-2 text-xs text-gray-500">
                    Total {formatRupiah(computed.totalNilai)} &rarr; Warga {formatRupiah(computed.nominalTabungan)} +
                    Karang Taruna {formatRupiah(computed.nominalKarangTaruna)}
                  </p>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={addRow}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-brand-300 py-2.5 text-sm text-brand-600 hover:bg-brand-50"
          >
            <Plus size={15} /> Tambah Jenis Sampah
          </button>

          <Input
            label="Tanggal Setor"
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
          />

          <div className="rounded-xl bg-brand-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Nilai</span>
              <span className="font-medium text-brand-900">{formatRupiah(totals.totalNilai)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Masuk Tabungan Warga</span>
              <span className="font-semibold text-brand-700">{formatRupiah(totals.nominalTabungan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bagian Karang Taruna</span>
              <span className="font-medium text-brand-900">{formatRupiah(totals.nominalKarangTaruna)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-brand-600">Setoran tersimpan.</p>}

          <Button onClick={handleSubmit} disabled={saving} size="lg" fullWidth>
            {saving ? "Menyimpan..." : "Simpan Setoran"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
