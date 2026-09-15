import { addDoc, collection, doc, type WriteBatch, type Transaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

function auditEntry(action: string, detail: string, adminEmail: string) {
  return { action, detail, adminEmail, tanggal: Date.now() };
}

// Piggybacks the audit record on an existing batch/transaction so it can
// never drift from the operation it documents (both commit together, or
// neither does).
export function addAuditToBatch(batch: WriteBatch, action: string, detail: string, adminEmail: string) {
  batch.set(doc(collection(db, "auditLog")), auditEntry(action, detail, adminEmail));
}

export function addAuditToTransaction(tx: Transaction, action: string, detail: string, adminEmail: string) {
  tx.set(doc(collection(db, "auditLog")), auditEntry(action, detail, adminEmail));
}

export async function logAudit(action: string, detail: string, adminEmail: string) {
  await addDoc(collection(db, "auditLog"), auditEntry(action, detail, adminEmail));
}
