export const config = { runtime: "nodejs", maxDuration: 20 };

async function parseInput(req: any) {
  if (typeof req?.json === "function") {
    const url = new URL(req.url);
    let token = url.searchParams.get("accessToken") || "";
    let igUserId = url.searchParams.get("igUserId") || "";
    if (String(req.method || "GET").toUpperCase() === "POST") {
      const body = await req.json().catch(() => ({}));
      token = String(body.accessToken || token);
      igUserId = String(body.igUserId || igUserId);
    }
    return { token, igUserId, web: true as const };
  }

  if (String(req.method || "").toUpperCase() === "POST" && (req.body == null || req.body === "")) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    try {
      req.body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    } catch {
      req.body = {};
    }
  }

  const body = typeof req.body === "object" && req.body ? req.body : {};
  const query = req.query || {};
  let token = String(body.accessToken || query.accessToken || "");
  let igUserId = String(body.igUserId || query.igUserId || "");
  if (!token && req.url) {
    try {
      const parsed = String(req.url).startsWith("http")
        ? new URL(req.url)
        : new URL(String(req.url), "https://free-auto-dm-tool.vercel.app");
      token = parsed.searchParams.get("accessToken") || token;
      igUserId = parsed.searchParams.get("igUserId") || igUserId;
    } catch {
      // ignore
    }
  }
  return { token, igUserId, web: false as const };
}

function normalize(item: Record<string, any>) {
  const child = item.children?.data?.[0] || {};
  const mediaUrl = item.media_url || item.thumbnail_url || child.media_url || child.thumbnail_url || "";
  const isVideo = item.media_type === "VIDEO" || String(item.permalink || "").includes("/reel/");
  return {
    id: String(item.id || ""),
    caption: item.caption || "",
    media_type: isVideo ? "VIDEO" : item.media_type || "IMAGE",
    media_url: mediaUrl,
    thumbnail_url: item.thumbnail_url || child.thumbnail_url || mediaUrl,
    permalink: item.permalink || "",
    timestamp: item.timestamp || "",
  };
}

async function fetchMedia(token: string, igUserId: string) {
  const endpoints = [
    "https://graph.instagram.com/v21.0/me/media",
    "https://graph.instagram.com/me/media",
    igUserId ? `https://graph.instagram.com/v21.0/${encodeURIComponent(igUserId)}/media` : "",
  ].filter(Boolean);
  const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(
        `${endpoint}?fields=${fields}&limit=50&access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(12000) }
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray((data as { data?: unknown[] }).data)) {
        return {
          ok: true as const,
          items: ((data as { data: Record<string, any>[] }).data).map(normalize),
        };
      }
      lastError = data;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  return { ok: false as const, lastError };
}

export default async function handler(req: any, res: any) {
  try {
    if (req?.method === "OPTIONS") {
      if (res && typeof res.status === "function") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        return res.status(204).end();
      }
      return new Response(null, { status: 204 });
    }

    const { token, igUserId, web } = await parseInput(req);
    const payload = !token
      ? { error: "Missing access token", data: [] }
      : await (async () => {
          const result = await fetchMedia(token, igUserId);
          if (result.ok) return { data: result.items };
          console.log("[ig/media] graph error", result.lastError);
          return { error: "Failed to fetch Instagram media", details: result.lastError, data: [] };
        })();

    const status = payload.error && !(payload as { data?: unknown[] }).data?.length ? 200 : 200;
    if (web || !(res && typeof res.status === "function")) {
      return Response.json(payload, { status });
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(status).json(payload);
  } catch (error) {
    const payload = { error: String(error), data: [] };
    if (res && typeof res.status === "function") return res.status(200).json(payload);
    return Response.json(payload, { status: 200 });
  }
}
