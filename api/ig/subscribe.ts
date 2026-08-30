export const config = { runtime: "nodejs", maxDuration: 15 };

export default async function handler(req: any, res: any) {
  const json = (status: number, body: unknown) => {
    if (res && typeof res.status === "function") return res.status(status).json(body);
    return Response.json(body, { status });
  };

  let accessToken = "";
  let igUserId = "";
  if (typeof req.json === "function") {
    const body = await req.json().catch(() => ({}));
    accessToken = String(body.accessToken || "");
    igUserId = String(body.igUserId || "");
  } else {
    accessToken = String(req.body?.accessToken || req.query?.accessToken || "");
    igUserId = String(req.body?.igUserId || req.query?.igUserId || "");
  }

  if (!accessToken) return json(400, { error: "Missing access token" });

  const urls = [
    igUserId
      ? `https://graph.instagram.com/v21.0/${encodeURIComponent(igUserId)}/subscribed_apps?subscribed_fields=comments,messages,live_comments&access_token=${encodeURIComponent(accessToken)}`
      : "",
    `https://graph.instagram.com/v21.0/me/subscribed_apps?subscribed_fields=comments,messages,live_comments&access_token=${encodeURIComponent(accessToken)}`,
  ].filter(Boolean);

  let last: unknown = null;
  for (const url of urls) {
    const response = await fetch(url, { method: "POST" });
    last = await response.json().catch(() => ({}));
    if (response.ok) return json(200, { ok: true, details: last });
  }
  console.log("[ig/subscribe]", last);
  return json(200, { ok: false, details: last });
}
