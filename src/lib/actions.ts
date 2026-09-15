import {
  addDoc,
  collection,
  doc,
  increment,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { hitungSetoran } from "@/lib/calc";
import { addAuditToBatch, addAuditToTransaction, logAudit } from "@/lib/audit";
import { formatRupiah } from "@/lib/format";
import type {
  JenisSampah,
  Nasabah,
  Supplier,
  Korlap,
  StatusPengambilan,
  Pengaturan,
} from "@/lib/types";

export interface NasabahFormInput {
  nama: string;
  noWhatsapp: string;
  alamat: string;
  rw: string;
  rt: string;
}

export async function createNasabah(input: NasabahFormInput, existingCount: number, adminEmail: string) {
  const idNasabah = `NS${String(existingCount + 1).padStart(3, "0")}`;
  await setDoc(doc(db, "nasabah", idNasabah), {
    idNasabah,
    nama: input.nama,
    noWhatsapp: input.noWhatsapp,
    alamat: input.alamat,
    rw: input.rw,
    rt: input.rt,
    status: "aktif",
    totalSampahKg: 0,
    jumlahSetoran: 0,
    saldo: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await logAudit("Tambah Nasabah", `${input.nama} (${idNasabah})`, adminEmail);
}

export async function toggleNasabahStatus(nasabah: Nasabah, adminEmail: string) {
  const next = nasabah.status === "aktif" ? "nonaktif" : "aktif";
  await updateDoc(doc(db, "nasabah", nasabah.id), {
    status: next,
    updatedAt: Date.now(),
  });
  await logAudit(
    next === "aktif" ? "Aktifkan Nasabah" : "Nonaktifkan Nasabah",
    `${nasabah.nama} (${nasabah.idNasabah})`,
    adminEmail
  );
}

export interface JenisSampahFormInput {
  nama: string;
  satuan: string;
  harga: number;
  persentaseWarga: number;
  persentaseKarangTaruna: number;
}

export async function saveJenisSampah(
  input: JenisSampahFormInput,
  editing: JenisSampah | null,
  adminEmail: string
) {
  if (editing) {
    if (input.harga !== editing.harga) {
      await addDoc(collection(db, "riwayatHarga"), {
        jenisSampahId: editing.id,
        jenisSampahNama: editing.nama,
        hargaLama: editing.harga,
        hargaBaru: input.harga,
        tanggal: Date.now(),
        adminEmail,
      });
    }
    await updateDoc(doc(db, "jenisSampah", editing.id), {
      ...input,
      updatedAt: Date.now(),
    });
    await logAudit("Ubah Jenis Sampah", `${input.nama}: ${formatRupiah(editing.harga)} -> ${formatRupiah(input.harga)}`, adminEmail);
  } else {
    await addDoc(collection(db, "jenisSampah"), {
      ...input,
      status: "aktif",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await logAudit("Tambah Jenis Sampah", `${input.nama} (${formatRupiah(input.harga)}/${input.satuan})`, adminEmail);
  }
}

export async function toggleJenisSampahStatus(item: JenisSampah, adminEmail: string) {
  const next = item.status === "aktif" ? "nonaktif" : "aktif";
  await updateDoc(doc(db, "jenisSampah", item.id), {
    status: next,
    updatedAt: Date.now(),
  });
  await logAudit(next === "aktif" ? "Aktifkan Jenis Sampah" : "Nonaktifkan Jenis Sampah", item.nama, adminEmail);
}

export interface SetoranRowInput {
  jenis: JenisSampah;
  berat: number;
}

export async function submitSetoran(
  nasabah: Nasabah,
  rows: SetoranRowInput[],
  tanggalMs: number,
  adminEmail: string
) {
  const batch = writeBatch(db);
  let totalBerat = 0;
  let totalTabungan = 0;

  for (const row of rows) {
    const calc = hitungSetoran(row.berat, row.jenis.harga, row.jenis.persentaseWarga, row.jenis.persentaseKarangTaruna);
    totalBerat += row.berat;
    totalTabungan += calc.nominalTabungan;

    const setoranRef = doc(collection(db, "setoran"));
    batch.set(setoranRef, {
      nasabahId: nasabah.id,
      nasabahNama: nasabah.nama,
      nasabahIdNasabah: nasabah.idNasabah,
      jenisSampahId: row.jenis.id,
      jenisSampahNama: row.jenis.nama,
      berat: row.berat,
      hargaSaatTransaksi: row.jenis.harga,
      persentaseWargaSaatTransaksi: row.jenis.persentaseWarga,
      persentaseKarangTarunaSaatTransaksi: row.jenis.persentaseKarangTaruna,
      totalNilai: calc.totalNilai,
      nominalTabungan: calc.nominalTabungan,
      nominalKarangTaruna: calc.nominalKarangTaruna,
      tanggal: tanggalMs,
      adminEmail,
      createdAt: Date.now(),
    });
  }

  batch.update(doc(db, "nasabah", nasabah.id), {
    totalSampahKg: increment(totalBerat),
    jumlahSetoran: increment(rows.length),
    saldo: increment(totalTabungan),
    updatedAt: Date.now(),
  });

  addAuditToBatch(
    batch,
    "Input Setoran",
    `${nasabah.nama} (${nasabah.idNasabah}): ${rows.length} jenis, total ${formatRupiah(totalTabungan)} masuk tabungan`,
    adminEmail
  );

  await batch.commit();
}

// Reads the authoritative current saldo inside the transaction (not the
// possibly-stale value from the list already loaded on screen) so a setoran
// added moments earlier is never silently wiped out, and a double-click
// can't create two payout records for the same balance.
export async function cairkanTabungan(nasabahId: string, adminEmail: string): Promise<number> {
  const nasabahRef = doc(db, "nasabah", nasabahId);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(nasabahRef);
    if (!snap.exists()) throw new Error("Nasabah tidak ditemukan.");
    const nasabah = snap.data() as Nasabah;
    if (!nasabah.saldo || nasabah.saldo <= 0) throw new Error("Saldo tabungan kosong.");

    const pencairanRef = doc(collection(db, "pencairan"));
    const now = Date.now();
    tx.set(pencairanRef, {
      nasabahId,
      nasabahNama: nasabah.nama,
      nasabahIdNasabah: nasabah.idNasabah,
      nominal: nasabah.saldo,
      tanggal: now,
      status: "selesai",
      adminEmail,
      createdAt: now,
    });
    tx.update(nasabahRef, { saldo: 0, updatedAt: now });
    addAuditToTransaction(tx, "Cairkan Tabungan", `${nasabah.nama} (${nasabah.idNasabah}): ${formatRupiah(nasabah.saldo)}`, adminEmail);

    return nasabah.saldo;
  });
}

// ---- Supplier & Harga Pengepul ----

export interface SupplierFormInput {
  nama: string;
  noWhatsapp: string;
  alamat: string;
}

export async function createSupplier(input: SupplierFormInput, adminEmail: string) {
  await addDoc(collection(db, "supplier"), {
    ...input,
    status: "aktif",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await logAudit("Tambah Supplier", input.nama, adminEmail);
}

export async function toggleSupplierStatus(supplier: Supplier, adminEmail: string) {
  const next = supplier.status === "aktif" ? "nonaktif" : "aktif";
  await updateDoc(doc(db, "supplier", supplier.id), {
    status: next,
    updatedAt: Date.now(),
  });
  await logAudit(next === "aktif" ? "Aktifkan Supplier" : "Nonaktifkan Supplier", supplier.nama, adminEmail);
}

export async function addHargaPengepul(
  supplier: Supplier,
  jenis: JenisSampah,
  harga: number,
  adminEmail: string
) {
  await addDoc(collection(db, "hargaPengepul"), {
    supplierId: supplier.id,
    supplierNama: supplier.nama,
    jenisSampahId: jenis.id,
    jenisSampahNama: jenis.nama,
    harga,
    tanggalBerlaku: Date.now(),
    adminEmail,
    createdAt: Date.now(),
  });
  await logAudit("Ubah Harga Pengepul", `${supplier.nama} - ${jenis.nama}: ${formatRupiah(harga)}/${jenis.satuan}`, adminEmail);
}

// ---- Penjualan Sampah ----

export interface PenjualanRowInput {
  jenis: JenisSampah;
  berat: number;
  hargaPengepul: number;
}

export async function createPenjualan(
  supplier: Supplier,
  rows: PenjualanRowInput[],
  tanggalMs: number,
  adminEmail: string
) {
  const batch = writeBatch(db);
  let total = 0;

  const penjualanRef = doc(collection(db, "penjualan"));
  for (const row of rows) {
    const rowTotal = Math.round(row.berat * row.hargaPengepul);
    total += rowTotal;
    const detailRef = doc(collection(db, "detailPenjualan"));
    batch.set(detailRef, {
      penjualanId: penjualanRef.id,
      jenisSampahId: row.jenis.id,
      jenisSampahNama: row.jenis.nama,
      berat: row.berat,
      hargaPengepulSaatTransaksi: row.hargaPengepul,
      total: rowTotal,
    });
  }

  batch.set(penjualanRef, {
    supplierId: supplier.id,
    supplierNama: supplier.nama,
    tanggal: tanggalMs,
    total,
    adminEmail,
    createdAt: Date.now(),
  });

  addAuditToBatch(batch, "Catat Penjualan Sampah", `Ke ${supplier.nama}: ${rows.length} jenis, total ${formatRupiah(total)}`, adminEmail);

  await batch.commit();
  return penjualanRef.id;
}

// ---- Dana Karang Taruna (dana keluar) ----

export interface DanaKeluarFormInput {
  tanggal: number;
  keterangan: string;
  nominal: number;
}

export async function addDanaKeluar(input: DanaKeluarFormInput, adminEmail: string) {
  await addDoc(collection(db, "danaKeluar"), {
    ...input,
    adminEmail,
    createdAt: Date.now(),
  });
  await logAudit("Catat Dana Keluar", `${input.keterangan}: ${formatRupiah(input.nominal)}`, adminEmail);
}

// ---- Korlap & Pengambilan Sampah ----

export interface KorlapFormInput {
  nama: string;
  noWhatsapp: string;
  rw: string;
  rt: string;
}

export async function createKorlap(input: KorlapFormInput, adminEmail: string) {
  await addDoc(collection(db, "korlap"), {
    ...input,
    status: "aktif",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await logAudit("Tambah Korlap", `${input.nama} (RW ${input.rw}/RT ${input.rt})`, adminEmail);
}

export async function toggleKorlapStatus(korlap: Korlap, adminEmail: string) {
  const next = korlap.status === "aktif" ? "nonaktif" : "aktif";
  await updateDoc(doc(db, "korlap", korlap.id), {
    status: next,
    updatedAt: Date.now(),
  });
  await logAudit(next === "aktif" ? "Aktifkan Korlap" : "Nonaktifkan Korlap", korlap.nama, adminEmail);
}

export interface PengambilanFormInput {
  rw: string;
  rt: string;
  korlapId: string;
  korlapNama: string;
  tanggal: number;
  jam: string;
}

export async function createPengambilan(input: PengambilanFormInput, adminEmail: string) {
  await addDoc(collection(db, "pengambilan"), {
    ...input,
    status: "menunggu" as StatusPengambilan,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  await logAudit("Tambah Jadwal Pengambilan", `RW ${input.rw}/RT ${input.rt} oleh ${input.korlapNama}`, adminEmail);
}

export async function updatePengambilanStatus(
  id: string,
  label: string,
  status: StatusPengambilan,
  adminEmail: string
) {
  await updateDoc(doc(db, "pengambilan", id), { status, updatedAt: Date.now() });
  await logAudit("Ubah Status Pengambilan", `${label} -> ${status}`, adminEmail);
}

// ---- Pengaturan Sistem ----

export async function savePengaturan(input: Pengaturan, adminEmail: string) {
  await setDoc(doc(db, "pengaturan", "umum"), input);
  await logAudit("Ubah Pengaturan Sistem", input.namaProgram, adminEmail);
}
