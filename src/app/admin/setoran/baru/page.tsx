import { Suspense } from "react";
import { InputSetoranClient } from "./InputSetoranClient";

export default function InputSetoranPage() {
  return (
    <Suspense fallback={<p className="text-sm text-gray-400">Memuat...</p>}>
      <InputSetoranClient />
    </Suspense>
  );
}
