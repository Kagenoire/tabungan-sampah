"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Leaf, Lock, ShieldCheck, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      router.push("/admin/dashboard");
    } catch {
      setError("Username atau password salah.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-50">
      <div className="hidden w-[42%] flex-col justify-between bg-brand-600 p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
            <Leaf size={20} />
          </span>
          <span className="text-base font-bold">Tabungan Sampah</span>
        </Link>
        <div>
          <ShieldCheck size={36} className="text-brand-200" strokeWidth={1.5} />
          <p className="mt-4 text-2xl font-semibold leading-snug">
            Kelola tabungan sampah warga dengan rapi, transparan, dan tanpa hitung manual.
          </p>
          <p className="mt-3 text-sm text-brand-100">
            Khusus untuk pengurus Karang Taruna yang mengelola program di wilayahnya masing-masing.
          </p>
        </div>
        <p className="text-xs text-brand-200">Nabung Dari Sampah, Panen Manfaat di Hari Raya</p>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-10 pt-8 sm:px-10">
        <Link href="/" className="flex w-fit items-center gap-1 text-brand-700 lg:hidden">
          <ArrowLeft size={18} />
        </Link>

        <div className="mx-auto mt-6 flex w-full max-w-sm flex-1 flex-col justify-center lg:mt-0">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-brand-600 lg:hidden">
            <Leaf size={20} />
          </span>
          <h1 className="mt-3 text-xl font-bold text-brand-900 lg:mt-0">Login Admin</h1>
          <p className="mt-1 text-sm text-gray-500">
            Masuk untuk mengakses sistem Tabungan Sampah.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Input
              id="username"
              label="Username"
              icon={<User size={16} />}
              placeholder="Masukkan username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              icon={<Lock size={16} />}
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="-mt-3 flex w-fit items-center gap-1.5 self-end text-xs text-brand-600"
            >
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
              {showPassword ? "Sembunyikan" : "Tampilkan"} password
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" size="lg" fullWidth disabled={submitting}>
              {submitting ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-400">
            Lupa password? Minta admin lain yang masih bisa login untuk mereset password Anda lewat
            menu Akun Admin.
          </p>
        </div>
      </div>
    </div>
  );
}
