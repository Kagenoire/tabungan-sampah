export type Status = "aktif" | "nonaktif";

export interface Nasabah {
  id: string; // doc id === idNasabah
  idNasabah: string;
  nama: string;
  noWhatsapp: string;
  alamat: string;
  rw: string;
  rt: string;
  status: Status;
  totalSampahKg: number;
  jumlahSetoran: number;
  saldo: number;
  createdAt: number;
  updatedAt: number;
}

export interface JenisSampah {
  id: string;
  nama: string;
  satuan: string; // kg
  harga: number; // per satuan, current
  persentaseWarga: number; // 0-100
  persentaseKarangTaruna: number; // 0-100
  status: Status;
  createdAt: number;
  updatedAt: number;
}

export interface RiwayatHarga {
  id: string;
  jenisSampahId: string;
  jenisSampahNama: string;
  hargaLama: number;
  hargaBaru: number;
  tanggal: number;
  adminEmail: string;
}

export interface Pencairan {
  id: string;
  nasabahId: string;
  nasabahNama: string;
  nasabahIdNasabah: string;
  nominal: number;
  tanggal: number;
  status: "selesai";
  adminEmail: string;
  createdAt: number;
}

export interface Supplier {
  id: string;
  nama: string;
  noWhatsapp: string;
  alamat: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

// Append-only: every price point ever entered for a supplier+jenis combo is
// kept (never mutated), so the "current" price is simply the row with the
// latest tanggalBerlaku. This gives full history for free, matching the
// brief's "harga harus punya riwayat" rule without a separate log collection.
export interface HargaPengepul {
  id: string;
  supplierId: string;
  supplierNama: string;
  jenisSampahId: string;
  jenisSampahNama: string;
  harga: number;
  tanggalBerlaku: number;
  adminEmail: string;
  createdAt: number;
}

export interface Penjualan {
  id: string;
  supplierId: string;
  supplierNama: string;
  tanggal: number;
  total: number;
  adminEmail: string;
  createdAt: number;
}

export interface DetailPenjualan {
  id: string;
  penjualanId: string;
  jenisSampahId: string;
  jenisSampahNama: string;
  berat: number;
  hargaPengepulSaatTransaksi: number;
  total: number;
}

export interface Korlap {
  id: string;
  nama: string;
  noWhatsapp: string;
  rw: string;
  rt: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

export type StatusPengambilan =
  | "menunggu"
  | "dijadwalkan"
  | "sedang_diambil"
  | "selesai"
  | "tidak_diambil";

export interface Pengambilan {
  id: string;
  rw: string;
  rt: string;
  korlapId: string;
  korlapNama: string;
  tanggal: number;
  jam: string;
  status: StatusPengambilan;
  createdAt: number;
  updatedAt: number;
}

export interface DanaKeluar {
  id: string;
  tanggal: number;
  keterangan: string;
  nominal: number;
  adminEmail: string;
  createdAt: number;
}

export interface Pengaturan {
  namaProgram: string;
  tagline: string;
  pengumuman: string;
  updatedAt: number;
}

export interface AuditLog {
  id: string;
  action: string;
  detail: string;
  adminEmail: string;
  tanggal: number;
}

export interface Setoran {
  id: string;
  nasabahId: string;
  nasabahNama: string;
  nasabahIdNasabah: string;
  jenisSampahId: string;
  jenisSampahNama: string;
  berat: number;
  hargaSaatTransaksi: number;
  persentaseWargaSaatTransaksi: number;
  persentaseKarangTarunaSaatTransaksi: number;
  totalNilai: number;
  nominalTabungan: number;
  nominalKarangTaruna: number;
  tanggal: number;
  adminEmail: string;
  createdAt: number;
}
