import admin from "firebase-admin";

let inited = false;

export function getAdmin() {
  if (inited) return admin.apps.length ? admin : null;
  inited = true;
  try {
    if (admin.apps.length) return admin;
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || "";
    if (!raw) {
      console.log("[admin] FIREBASE_SERVICE_ACCOUNT missing");
      return null;
    }
    const cred = JSON.parse(raw);
    if (typeof cred.private_key === "string") {
      cred.private_key = cred.private_key.replace(/\\n/g, "\n");
    }
    admin.initializeApp({ credential: admin.credential.cert(cred) });
    return admin;
  } catch (error) {
    console.log("[admin] init failed", error instanceof Error ? error.message : error);
    return null;
  }
}
