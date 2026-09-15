import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { requireAdmin, UnauthorizedError } from "@/lib/api-auth";
import { toAdminEmail, adminUsername } from "@/lib/auth-helpers";

async function logAudit(action: string, detail: string, adminEmail: string) {
  await adminDb().collection("auditLog").add({ action, detail, adminEmail, tanggal: Date.now() });
}

function errorResponse(err: unknown) {
  if (err instanceof UnauthorizedError) {
    return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
  }
  const code = (err as { code?: string } | null)?.code;
  if (code === "auth/email-already-exists") {
    return NextResponse.json({ error: "Username sudah dipakai admin lain." }, { status: 409 });
  }
  if (code === "auth/invalid-password" || code === "auth/weak-password") {
    return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
  }
  console.error(err);
  return NextResponse.json({ error: "Terjadi kesalahan. Coba lagi." }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const { users } = await adminAuth().listUsers(1000);
    const list = users
      .map((u) => ({
        uid: u.uid,
        nama: u.displayName || adminUsername(u.email || ""),
        username: adminUsername(u.email || ""),
        disabled: u.disabled,
        createdAt: u.metadata.creationTime,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
    return NextResponse.json({ list });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const nama = typeof body?.nama === "string" ? body.nama.trim() : "";
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!nama || !username || !password) {
      return NextResponse.json({ error: "Nama, username, dan password wajib diisi." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }
    if (username.includes("@")) {
      return NextResponse.json({ error: "Username tidak boleh mengandung karakter @." }, { status: 400 });
    }

    const created = await adminAuth().createUser({
      email: toAdminEmail(username),
      password,
      displayName: nama,
    });

    await logAudit("Tambah Akun Admin", `${nama} (${username})`, caller.email || caller.uid);

    return NextResponse.json({
      uid: created.uid,
      nama: created.displayName,
      username: adminUsername(created.email || ""),
      disabled: created.disabled,
      createdAt: created.metadata.creationTime,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const caller = await requireAdmin(request);
    const body = await request.json().catch(() => null);
    const uid = typeof body?.uid === "string" ? body.uid : "";
    const disabled = typeof body?.disabled === "boolean" ? body.disabled : null;
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : null;

    if (!uid || (disabled === null && newPassword === null)) {
      return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });
    }

    if (disabled !== null) {
      if (uid === caller.uid && disabled) {
        return NextResponse.json({ error: "Tidak bisa menonaktifkan akun sendiri." }, { status: 400 });
      }
      if (disabled) {
        const { users } = await adminAuth().listUsers(1000);
        const activeOthers = users.filter((u) => u.uid !== uid && !u.disabled);
        if (activeOthers.length === 0) {
          return NextResponse.json(
            { error: "Tidak bisa menonaktifkan admin terakhir yang aktif." },
            { status: 400 }
          );
        }
      }
      const target = await adminAuth().getUser(uid);
      await adminAuth().updateUser(uid, { disabled });
      await logAudit(
        disabled ? "Nonaktifkan Akun Admin" : "Aktifkan Akun Admin",
        target.displayName || adminUsername(target.email || ""),
        caller.email || caller.uid
      );
    }

    if (newPassword !== null) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
      }
      const target = await adminAuth().getUser(uid);
      await adminAuth().updateUser(uid, { password: newPassword });
      await logAudit(
        "Reset Password Admin",
        `${target.displayName || adminUsername(target.email || "")}${uid === caller.uid ? " (diri sendiri)" : ""}`,
        caller.email || caller.uid
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
