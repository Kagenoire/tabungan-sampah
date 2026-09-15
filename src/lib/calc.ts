export function hitungSetoran(
  berat: number,
  harga: number,
  persentaseWarga: number,
  persentaseKarangTaruna: number
) {
  const totalNilai = berat * harga;
  const nominalTabungan = Math.round((totalNilai * persentaseWarga) / 100);
  const nominalKarangTaruna = Math.round((totalNilai * persentaseKarangTaruna) / 100);
  return { totalNilai, nominalTabungan, nominalKarangTaruna };
}
