"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toAdminEmail, adminUsername } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Badge, Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { Plus, ShieldCheck, UserRound, KeyRound, UserCog } from "lucide-react";

interface AdminAccount {
  uid: string;
  nama: string;
  username: string;
  disabled: boolean;
  createdAt: string;
}

const EMPTY_FORM = { nama: "", username: "", password: "", confirmPassword: "" };
const EMPTY_PROFIL_FORM = { passwordSaatIni: "", nama: "", username: "", passwordBaru: "", confirmPasswordBaru: "" };
const EMPTY_RESET_FORM = { password: "", confirmPassword: "" };

export default function AkunAdminPage() {
  const { user } = useAuth();
  const [list, setList] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");

  const [profilForm, setProfilForm] = useState(EMPTY_PROFIL_FORM);
  const [profilError, setProfilError] = useState("");
  const [profilSaving, setProfilSaving] = useState(false);
  const [profilSaved, setProfilSaved] = useState(false);

  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null);
  const [resetForm, setResetForm] = useState(EMPTY_RESET_FORM);
  const [resetError, setResetError] = useState("");
  const [resetSaving, setResetSaving] = useState(false);

  async function authHeaders() {
    const token = await user?.getIdToken();
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
  }

  async function loadList() {
    setListError("");
    try {
      const res = await fetch("/api/admin/akun", { headers: await authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memuat data.");
      setList(data.list);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      loadList();
      setProfilForm({
        passwordSaatIni: "",
        nama: user.displayName || "",
        username: adminUsername(user.email || ""),
        passwordBaru: "",
        confirmPasswordBaru: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.nama || !form.username || !form.password) {
      setFormError("Nama, username, dan password wajib diisi.");
      return;
    }
    if (form.password.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError("Konfirmasi password tidak sama.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/akun", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ nama: form.nama, username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan admin.");
      setModalOpen(false);
      setForm(EMPTY_FORM);
      await loadList();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Gagal menyimpan admin.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(account: AdminAccount) {
    if (account.uid === user?.uid) return;
    try {
      const res = await fetch("/api/admin/akun", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ uid: account.uid, disabled: !account.disabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengubah status.");
      await loadList();
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Gagal mengubah status.");
    }
  }

  async function handleProfilSubmit(e: FormEvent) {
    e.preventDefault();
    setProfilError("");
    setProfilSaved(false);
    if (!user || !user.email) return;

    if (!profilForm.passwordSaatIni) {
      setProfilError("Masukkan password saat ini untuk konfirmasi perubahan.");
      return;
    }
    if (!profilForm.nama || !profilForm.username) {
      setProfilError("Nama dan username tidak boleh kosong.");
      return;
    }
    if (profilForm.username.includes("@")) {
      setProfilError("Username tidak boleh mengandung karakter @.");
      return;
    }
    if (profilForm.passwordBaru && profilForm.passwordBaru.length < 6) {
      setProfilError("Password baru minimal 6 karakter.");
      return;
    }
    if (profilForm.passwordBaru && profilForm.passwordBaru !== profilForm.confirmPasswordBaru) {
      setProfilError("Konfirmasi password baru tidak sama.");
      return;
    }

    setProfilSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, profilForm.passwordSaatIni);
      await reauthenticateWithCredential(user, credential);

      if (profilForm.nama !== user.displayName) {
        await updateProfile(user, { displayName: profilForm.nama });
      }
      const newEmail = toAdminEmail(profilForm.username);
      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }
      if (profilForm.passwordBaru) {
        await updatePassword(user, profilForm.passwordBaru);
      }

      setProfilForm((f) => ({ ...f, passwordSaatIni: "", passwordBaru: "", confirmPasswordBaru: "" }));
      setProfilSaved(true);
      await loadList();
      setTimeout(() => setProfilSaved(false), 4000);
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setProfilError("Password saat ini salah.");
      } else if (code === "auth/email-already-in-use") {
        setProfilError("Username sudah dipakai admin lain.");
      } else if (code === "auth/requires-recent-login") {
        setProfilError("Sesi terlalu lama, silakan login ulang lalu coba lagi.");
      } else {
        setProfilError("Gagal menyimpan perubahan. Coba lagi.");
      }
    } finally {
      setProfilSaving(false);
    }
  }

  function openReset(account: AdminAccount) {
    setResetTarget(account);
    setResetForm(EMPTY_RESET_FORM);
    setResetError("");
  }

  async function handleResetSubmit(e: FormEvent) {
    e.preventDefault();
    setResetError("");
    if (!resetTarget) return;
    if (resetForm.password.length < 6) {
      setResetError("Password minimal 6 karakter.");
      return;
    }
    if (resetForm.password !== resetForm.confirmPassword) {
      setResetError("Konfirmasi password tidak sama.");
      return;
    }
    setResetSaving(true);
    try {
      const res = await fetch("/api/admin/akun", {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({ uid: resetTarget.uid, newPassword: resetForm.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal reset password.");
      setResetTarget(null);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Gagal reset password.");
    } finally {
      setResetSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-brand-900">Akun Admin</h1>
          <p className="text-sm text-gray-500">
            Kelola akun pengurus Karang Taruna yang bisa login ke sistem ini.
          </p>
        </div>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Tambah Admin
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <UserCog size={16} className="text-brand-600" />
          <p className="text-sm font-semibold text-brand-900">Profil Saya</p>
        </div>
        <form onSubmit={handleProfilSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              label="Nama"
              value={profilForm.nama}
              onChange={(e) => setProfilForm({ ...profilForm, nama: e.target.value })}
            />
            <Input
              label="Username"
              value={profilForm.username}
              onChange={(e) => setProfilForm({ ...profilForm, username: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              label="Password Baru (opsional)"
              type="password"
              placeholder="Kosongkan jika tidak diganti"
              value={profilForm.passwordBaru}
              onChange={(e) => setProfilForm({ ...profilForm, passwordBaru: e.target.value })}
            />
            <Input
              label="Konfirmasi Password Baru"
              type="password"
              value={profilForm.confirmPasswordBaru}
              onChange={(e) => setProfilForm({ ...profilForm, confirmPasswordBaru: e.target.value })}
            />
          </div>
          <Input
            label="Password Saat Ini"
            type="password"
            placeholder="Wajib diisi untuk konfirmasi perubahan"
            value={profilForm.passwordSaatIni}
            onChange={(e) => setProfilForm({ ...profilForm, passwordSaatIni: e.target.value })}
          />
          {profilError && <p className="text-sm text-red-600">{profilError}</p>}
          {profilSaved && (
            <p className="text-sm text-brand-600">
              Profil tersimpan. Kalau username diganti, pakai username baru saat login berikutnya.
            </p>
          )}
          <Button type="submit" disabled={profilSaving} size="sm" className="self-start">
            {profilSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </Card>

      <Card className="flex items-start gap-2.5 p-3.5 text-xs text-gray-500">
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
        Semua akun di sini punya akses admin yang sama (tidak ada tingkatan). Akun sendiri tidak bisa
        dinonaktifkan, dan admin terakhir yang aktif juga tidak bisa dinonaktifkan. Kalau ada admin lain
        lupa password, admin yang masih bisa login dapat mereset password-nya lewat tombol &quot;Reset
        Password&quot; di tabel bawah.
      </Card>

      {listError && <p className="text-sm text-red-600">{listError}</p>}

      <div className="overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-brand-100 text-left text-xs text-gray-500">
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium">Dibuat</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Memuat data...
                </td>
              </tr>
            )}
            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Belum ada akun admin.
                </td>
              </tr>
            )}
            {list.map((account) => (
              <tr key={account.uid} className="border-b border-brand-50 last:border-0 hover:bg-brand-50/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                      <UserRound size={14} />
                    </span>
                    <span className="font-medium text-brand-900">{account.nama}</span>
                    {account.uid === user?.uid && (
                      <Badge tone="brand">Anda</Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{account.username}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(new Date(account.createdAt).getTime())}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleStatus(account)}
                    disabled={account.uid === user?.uid}
                    className="disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Badge tone={!account.disabled ? "brand" : "gray"}>
                      {!account.disabled ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3">
                  {account.uid !== user?.uid && (
                    <button
                      onClick={() => openReset(account)}
                      className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                    >
                      <KeyRound size={13} /> Reset Password
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tambah Admin">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nama"
            placeholder="Nama pengurus"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            required
          />
          <Input
            label="Username"
            placeholder="Tanpa spasi/simbol @"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            label="Konfirmasi Password"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            required
          />
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <Button type="submit" disabled={saving} fullWidth>
            {saving ? "Menyimpan..." : "Simpan Admin"}
          </Button>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset Password - ${resetTarget?.nama ?? ""}`}>
        <form onSubmit={handleResetSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-gray-600">
            Buat password baru untuk <span className="font-semibold text-brand-900">{resetTarget?.nama}</span>{" "}
            ({resetTarget?.username}). Sampaikan password baru ini ke yang bersangkutan secara langsung.
          </p>
          <Input
            label="Password Baru"
            type="password"
            placeholder="Minimal 6 karakter"
            value={resetForm.password}
            onChange={(e) => setResetForm({ ...resetForm, password: e.target.value })}
            required
          />
          <Input
            label="Konfirmasi Password Baru"
            type="password"
            value={resetForm.confirmPassword}
            onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
            required
          />
          {resetError && <p className="text-sm text-red-600">{resetError}</p>}
          <Button type="submit" disabled={resetSaving} fullWidth>
            {resetSaving ? "Menyimpan..." : "Reset Password"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
