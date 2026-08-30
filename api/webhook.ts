import { getAdmin } from "./_lib/firebaseAdmin.js";

export const config = { runtime: "nodejs", maxDuration: 20 };

function json(res: any, status: number, body: unknown) {
  if (res && typeof res.status === "function") {
    res.status(status).send(typeof body === "string" ? body : JSON.stringify(body));
    return;
  }
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "Content-Type": typeof body === "string" ? "text/plain" : "application/json" },
  });
}

async function sendPrivateReplyWithToken(token: string, commentId: string, text: string) {
  const response = await fetch(
    `https://graph.instagram.com/v21.0/me/messages?access_token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { comment_id: commentId },
        message: { text },
      }),
    }
  );
  return { ok: response.ok, data: await response.json().catch(() => ({})) };
}

function matchesKeyword(comment: string, keyword: string) {
  const hay = comment.toLowerCase();
  const needle = keyword.trim().toLowerCase().replace(/^@/, "");
  if (!needle) return false;
  return hay.includes(needle) || hay.split(/\s+/).includes(needle);
}

export default async function handler(req: any, res: any) {
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || "BOOSTUPP";

  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"] || new URL(req.url, "https://x").searchParams.get("hub.mode");
    const token = req.query?.["hub.verify_token"] || new URL(req.url, "https://x").searchParams.get("hub.verify_token");
    const challenge =
      req.query?.["hub.challenge"] || new URL(req.url, "https://x").searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === verifyToken) {
      return json(res, 200, String(challenge || ""));
    }
    return json(res, 403, "forbidden");
  }

  let body = req.body;
  if (typeof req.json === "function") {
    body = await req.json().catch(() => ({}));
  } else if (!body) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      body = {};
    }
  }

  try {
    const admin = getAdmin();
    const entries = Array.isArray(body?.entry) ? body.entry : [];
    for (const entry of entries) {
      const igUserId = String(entry.id || "");
      const changes = Array.isArray(entry.changes) ? entry.changes : [];
      const messaging = Array.isArray(entry.messaging) ? entry.messaging : [];

      const comments = [
        ...changes
          .filter((c: { field?: string }) => c.field === "comments" || c.field === "live_comments")
          .map((c: { value?: Record<string, any> }) => c.value || {}),
      ];

      if (!comments.length && !messaging.length) continue;

      let token = "";
      let uid = "";
      let accountId = "";
      if (admin && igUserId) {
        const db = admin.firestore();
        const lookup = await db.doc(`igLookup/${igUserId}`).get();
        if (lookup.exists) {
          const data = lookup.data() || {};
          token = String(data.pageAccessToken || "");
          uid = String(data.uid || "");
          accountId = String(data.accountId || igUserId);
        }
        if (!token) {
          const grouped = await db.collectionGroup("accounts").where("instagramId", "==", igUserId).limit(1).get();
          if (!grouped.empty) {
            const doc = grouped.docs[0];
            token = String(doc.get("pageAccessToken") || "");
            accountId = doc.id;
            uid = doc.ref.parent.parent?.id || "";
          }
        }
      }

      if (!token) {
        console.log("[webhook] no token for ig user", igUserId);
        continue;
      }

      const rulesSnap =
        admin && uid && accountId
          ? await admin.firestore().collection(`users/${uid}/accounts/${accountId}/rules`).get()
          : { docs: [] as { data: () => Record<string, unknown> }[] };

      const rules = rulesSnap.docs
        .map((d) => d.data() as { triggerKeyword?: string; resource?: string; isActive?: boolean; mediaId?: string | null })
        .filter((r) => r.isActive !== false && r.triggerKeyword && r.resource);

      for (const comment of comments) {
        const text = String(comment.text || comment.message || "");
        const commentId = String(comment.id || comment.comment_id || "");
        const mediaId = String(comment.media?.id || comment.media_id || "");
        if (!text || !commentId) continue;

        const rule = rules.find(
          (r) =>
            matchesKeyword(text, String(r.triggerKeyword)) &&
            (!r.mediaId || r.mediaId === mediaId)
        );
        if (!rule) continue;

        const message = String(rule.resource);
        const sent = await sendPrivateReplyWithToken(token, commentId, message);
        console.log("[webhook] dm", sent.ok, sent.data);
        if (admin && uid && accountId) {
          await admin.firestore().collection(`users/${uid}/accounts/${accountId}/logs`).add({
            type: "DM_SENT",
            commentId,
            mediaId,
            keyword: rule.triggerKeyword,
            msg: message,
            ok: sent.ok,
            at: new Date().toISOString(),
          });
        }
      }
    }
  } catch (error) {
    console.log("[webhook] error", error instanceof Error ? error.message : error);
  }

  return json(res, 200, "EVENT_RECEIVED");
}
