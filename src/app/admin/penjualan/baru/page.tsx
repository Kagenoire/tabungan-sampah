"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { createPenjualan } from "@/lib/actions";
import type { JenisSampah, Supplier, HargaPengepul } from "@/lib/types";
import { formatRupiah, formatDateInput } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Plus, Trash2 } from "lucide-react";

interface Row {
  jenisSampahId: string;
  berat: string;
  harga: string;
}

export default function PenjualanBaruPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [jenisList, setJenisList] = useState<JenisSampah[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [hargaPengepulList, setHargaPengepulList] = useState<HargaPengepul[]>([]);
  const [tanggal, setTanggal] = useState(() => formatDateInput(Date.now()));
  const [rows, setRows] = useState<Row[]>([{ jenisSampahId: "", berat: "", harga: "" }]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const [supplierSnap, jenisSnap] = await Promise.all([
        getDocs(query(collection(db, "supplier"), where("status", "==", "aktif"))),
        getDocs(query(collection(db, "jenisSampah"), where("status", "==", "aktif"))),
      ]);
      setSupplierList(supplierSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as Supplier));
      setJenisList(jenisSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as JenisSampah));
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!supplierId) {
      setHargaPengepulList([]);
      return;
    }
    getDocs(
      query(collection(db, "hargaPengepul"), where("supplierId", "==", supplierId), orderBy("tanggalBerlaku", "desc"))
    ).then((snap) => setHargaPengepulList(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HargaPengepul)));
  }, [supplierId]);

  const currentHarga = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of hargaPengepulList) {
      if (!map.has(h.jenisSampahId)) map.set(h.jenisSampahId, h.harga);
    }
    return map;
  }, [hargaPengepulList]);

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectJenis(index: number, jenisSampahId: string) {
    const auto = currentHarga.get(jenisSampahId);
    updateRow(index, { jenisSampahId, harga: auto ? String(auto) : "" });
  }

  function addRow() {
    setRows((prev) => [...prev, { jenisSampahId: "", berat: "", harga: "" }]);
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  const computedRows = useMemo(() => {
    return rows.map((row) => {
      const jenis = jenisList.find((j) => j.id === row.jenisSampahId);
      const berat = Number(row.berat) || 0;
      const harga = Number(row.harga) || 0;
      if (!jenis || !berat || !harga) return null;
      return { jenis, berat, harga, total: Math.round(berat * harga) };
    });
  }, [rows, jenisList]);

  const totalPenjualan = useMemo(
    () => computedRows.reduce((sum, r) => sum + (r?.total || 0), 0),
    [computedRows]
  );

  async function handleSubmit() {
    setError("");
    const supplier = supplierList.find((s) => s.id === supplierId);
    if (!supplier) {
      setError("Pilih supplier terlebih dahulu.");
      return;
    }
    const validRows = computedRows.filter((r): r is NonNullable<typeof r> => r !== null);
    if (validRows.length === 0) {
      setError("Isi minimal satu jenis sampah, berat, dan harga.");
      return;
    }

    setSaving(true);
    try {
      const tanggalMs = new Date(tanggal).getTime();
      await createPenjualan(
        supplier,
        validRows.map((r) => ({ jenis: r.jenis, berat: r.berat, hargaPengepul: r.harga })),
        tanggalMs,
        user?.email || ""
      );
      setSuccess(true);
      setTimeout(() => router.push("/admin/penjualan"), 900);
    } catch {
      setError("Gagal menyimpan penjualan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-400">Memuat data...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-brand-900">Penjualan Sampah</h1>
        <p className="text-sm text-gray-500">Catat hasil penjualan sampah ke pengepul.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3">
          <Select label="Pengepul" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">-- Pilih Supplier --</option>
            {supplierList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama}
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
                    onChange={(e) => selectJenis(index, e.target.value)}
                  >
                    <option value="">-- Pilih --</option>
                    {jenisList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Berat (kg)"
                    type="number"
                    step="0.1"
                    value={row.berat}
                    onChange={(e) => updateRow(index, { berat: e.target.value })}
                    className="max-w-[100px]"
                  />
                  <Input
                    label="Harga/kg"
                    type="number"
                    value={row.harga}
                    onChange={(e) => updateRow(index, { harga: e.target.value })}
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
                  <p className="mt-2 text-xs text-gray-500">Total baris: {formatRupiah(computed.total)}</p>
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

          <Input label="Tanggal Penjualan" type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />

          <div className="rounded-xl bg-brand-50 p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Hasil Penjualan</span>
              <span className="font-semibold text-brand-700">{formatRupiah(totalPenjualan)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-brand-600">Penjualan tersimpan.</p>}

          <Button onClick={handleSubmit} disabled={saving} size="lg" fullWidth>
            {saving ? "Menyimpan..." : "Simpan Penjualan"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
