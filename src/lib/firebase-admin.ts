import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore as getAdminFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

let adminApp: App | null = null;
let adminFirestore: Firestore | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApps()[0];
    return adminApp;
  }

  if (process.env.USE_FIREBASE_EMULATOR === "true") {
    process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
    adminApp = initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project" });
    return adminApp;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT env var is missing. See README for how to generate it from Firebase Console."
    );
  }
  const serviceAccount = JSON.parse(raw);
  adminApp = initializeApp({ credential: cert(serviceAccount) });
  return adminApp;
}

export function adminDb() {
  if (adminFirestore) return adminFirestore;
  adminFirestore = getAdminFirestore(getAdminApp());
  // Setting FIRESTORE_EMULATOR_HOST alone isn't enough for the Admin SDK's
  // Firestore client in every environment: without an explicit credential on
  // the app, it can still try to resolve real Application Default
  // Credentials for the gRPC channel and fail with "Could not load the
  // default credentials". Forcing host/ssl here makes the emulator channel
  // explicit instead of relying on that env var being picked up correctly.
  if (process.env.USE_FIREBASE_EMULATOR === "true") {
    adminFirestore.settings({ host: "127.0.0.1:8080", ssl: false });
  }
  return adminFirestore;
}

export function adminAuth() {
  return getAdminAuth(getAdminApp());
}
