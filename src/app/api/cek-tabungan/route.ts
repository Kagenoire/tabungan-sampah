import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("62")) return "0" + digits.slice(2);
  return digits;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const idNasabah = typeof body?.idNasabah === "string" ? body.idNasabah.trim() : "";
  const noWhatsapp = typeof body?.noWhatsapp === "string" ? body.noWhatsapp.trim() : "";

  if (!idNasabah || !noWhatsapp) {
    return NextResponse.json({ error: "ID Nasabah dan Nomor WhatsApp wajib diisi." }, { status: 400 });
  }

  const db = adminDb();
  const nasabahSnap = await db.collection("nasabah").doc(idNasabah.toUpperCase()).get();

  if (
    !nasabahSnap.exists ||
    normalizePhone(nasabahSnap.data()?.noWhatsapp ?? "") !== normalizePhone(noWhatsapp)
  ) {
    return NextResponse.json(
      { error: "Data tidak ditemukan. Silakan periksa kembali ID Nasabah dan nomor WhatsApp." },
      { status: 404 }
    );
  }

  const nasabah = nasabahSnap.data()!;
  const setoranSnap = await db
    .collection("setoran")
    .where("nasabahId", "==", nasabahSnap.id)
    .orderBy("tanggal", "desc")
    .get();

  const riwayat = setoranSnap.docs.map((d) => {
    const s = d.data();
    return {
      tanggal: s.tanggal,
      jenisSampahNama: s.jenisSampahNama,
      berat: s.berat,
      nominalTabungan: s.nominalTabungan,
    };
  });

  return NextResponse.json({
    nama: nasabah.nama,
    idNasabah: nasabah.idNasabah,
    totalSampahKg: nasabah.totalSampahKg,
    jumlahSetoran: nasabah.jumlahSetoran,
    saldo: nasabah.saldo,
    riwayat,
  });
}
