import { getAdmin } from "../_lib/firebaseAdmin.js";
import { refreshLongLivedToken } from "../_lib/igTokens.js";

export const config = { runtime: "nodejs", maxDuration: 10 };

export default async function handler(req: any, res: any) {
  const json = (status: number, payload: unknown) => {
    if (res && typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(status).json(payload);
    }
    return Response.json(payload, { status });
  };

  if (req?.method === "OPTIONS") return json(204, {});

  const cronSecret = process.env.CRON_SECRET || "";
  const authHeader = String(req.headers?.authorization || "");
  const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isGet = String(req.method || "GET").toUpperCase() === "GET";

  if (isGet && !isCron && process.env.CRON_SECRET) {
    return json(401, { error: "Unauthorized" });
  }

  const admin = getAdmin();
  if (!admin) return json(200, { skipped: true, reason: "FIREBASE_SERVICE_ACCOUNT missing" });

  const db = admin.firestore();
  const snap = await db.collection("igLookup").limit(200).get();
  let refreshed = 0;
  let failed = 0;

  for (const doc of snap.docs) {
    const token = String(doc.data().pageAccessToken || "");
    if (!token) continue;
    const result = await refreshLongLivedToken(token);
    if (!result.ok) {
      failed += 1;
      continue;
    }
    const expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString();
    await doc.ref.set(
      { pageAccessToken: result.token, tokenExpiresAt: expiresAt, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    const uid = String(doc.data().uid || "");
    const accountId = String(doc.data().accountId || doc.id);
    if (uid && accountId) {
      await db.doc(`users/${uid}/accounts/${accountId}`).set(
        { pageAccessToken: result.token, tokenExpiresAt: expiresAt },
        { merge: true }
      );
    }
    refreshed += 1;
  }

  return json(200, { ok: true, scanned: snap.size, refreshed, failed });
}
