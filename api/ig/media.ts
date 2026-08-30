export const config = { runtime: "nodejs", maxDuration: 20 };

const FIELDS =
  "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,children{media_url,thumbnail_url,media_type}";

function readParams(req: { body?: unknown; query?: Record<string, unknown>; url?: string }) {
  const body = (typeof req.body === "object" && req.body) || {};
  const query = req.query || {};
  let fromUrl = { token: "", igUserId: "" };
  try {
    const raw = String(req.url || "");
    const parsed = raw.startsWith("http") ? new URL(raw) : new URL(raw, "https://free-auto-dm-tool.vercel.app");
    fromUrl = {
      token: parsed.searchParams.get("accessToken") || "",
      igUserId: parsed.searchParams.get("igUserId") || "",
    };
  } catch {
    // ignore
  }
  return {
    token: String((body as { accessToken?: string }).accessToken || query.accessToken || fromUrl.token || ""),
    igUserId: String((body as { igUserId?: string }).igUserId || query.igUserId || fromUrl.igUserId || ""),
  };
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

  const fieldSets = [
    "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
    FIELDS,
  ];

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    for (const fields of fieldSets) {
      try {
        const res = await fetch(
          `${endpoint}?fields=${encodeURIComponent(fields)}&limit=50&access_token=${encodeURIComponent(token)}`,
          { signal: AbortSignal.timeout(12000) }
        );
        const data = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(data?.data)) {
          return { ok: true as const, items: data.data.map(normalize) };
        }
        lastError = data;
      } catch (error) {
        lastError = error instanceof Error ? error.message : String(error);
      }
    }
  }
  return { ok: false as const, lastError };
}

export default async function handler(req: any, res: any) {
  const json = (status: number, payload: unknown) => {
    if (res && typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(status).json(payload);
    }
    return Response.json(payload, { status });
  };

  if (req?.method === "OPTIONS") {
    if (res && typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(204).end();
    }
    return new Response(null, { status: 204 });
  }

  const { token, igUserId } = readParams(req);
  if (!token) return json(400, { error: "Missing access token" });

  const result = await fetchMedia(token, igUserId);
  if (result.ok) return json(200, { data: result.items });
  console.log("[ig/media] failed", result.lastError);
  return json(500, { error: "Failed to fetch Instagram media", details: result.lastError });
}
