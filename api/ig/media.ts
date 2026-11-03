import { isExpiredTokenError, refreshLongLivedToken } from "../_lib/igTokens.js";

export const config = { runtime: "nodejs", maxDuration: 20 };

async function parseInput(req: any) {
  if (typeof req?.json === "function") {
    const url = new URL(req.url);
    let token = url.searchParams.get("accessToken") || "";
    let igUserId = url.searchParams.get("igUserId") || "";
    let tokenExpiresAt = url.searchParams.get("tokenExpiresAt") || "";
    let after = url.searchParams.get("after") || "";
    let limit = url.searchParams.get("limit") || "";
    if (String(req.method || "GET").toUpperCase() === "POST") {
      const body = await req.json().catch(() => ({}));
      token = String(body.accessToken || token);
      igUserId = String(body.igUserId || igUserId);
      tokenExpiresAt = String(body.tokenExpiresAt || tokenExpiresAt);
      after = String(body.after || after);
      limit = String(body.limit || limit);
    }
    return { token, igUserId, tokenExpiresAt, after, limit, web: true as const };
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
  let after = String(body.after || query.after || "");
  let limit = String(body.limit || query.limit || "");
  if (!token && req.url) {
    try {
      const parsed = String(req.url).startsWith("http")
        ? new URL(req.url)
        : new URL(String(req.url), "https://free-auto-dm-tool.vercel.app");
      token = parsed.searchParams.get("accessToken") || token;
      igUserId = parsed.searchParams.get("igUserId") || igUserId;
      after = parsed.searchParams.get("after") || after;
      limit = parsed.searchParams.get("limit") || limit;
    } catch {
      // ignore
    }
  }
  return {
    token,
    igUserId,
    tokenExpiresAt: String(body.tokenExpiresAt || query.tokenExpiresAt || ""),
    after,
    limit,
    web: false as const,
  };
}

function tokenNeedsRefresh(expiresAt: string) {
  const t = Date.parse(expiresAt);
  if (!Number.isFinite(t) || t <= Date.now()) return false;
  return t - Date.now() < 14 * 24 * 60 * 60 * 1000;
}

function normalize(item: Record<string, any>) {
  const child = item.children?.data?.[0] || {};
  const mediaUrl = item.media_url || item.thumbnail_url || child.media_url || child.thumbnail_url || "";
  const productType = String(item.media_product_type || "").toUpperCase();
  const rawType = String(item.media_type || "").toUpperCase();
  const isReel = productType === "REELS" || String(item.permalink || "").includes("/reel/");
  const kind = isReel
    ? "REEL"
    : rawType === "CAROUSEL_ALBUM"
      ? "CAROUSEL"
      : rawType === "VIDEO"
        ? "VIDEO"
        : "POST";
  return {
    id: String(item.id || ""),
    caption: item.caption || "",
    media_type: rawType,
    product_type: productType,
    kind,
    media_url: mediaUrl,
    thumbnail_url: item.thumbnail_url || child.thumbnail_url || mediaUrl,
    permalink: item.permalink || "",
    timestamp: item.timestamp || "",
    like_count: Number(item.like_count) || 0,
    comments_count: Number(item.comments_count) || 0,
  };
}

async function fetchMedia(token: string, igUserId: string, after: string, limit: string) {
  const endpoints = [
    "https://graph.instagram.com/v21.0/me/media",
    "https://graph.instagram.com/me/media",
    igUserId ? `https://graph.instagram.com/v21.0/${encodeURIComponent(igUserId)}/media` : "",
  ].filter(Boolean);
  const fields =
    "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count";
  const pageLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);

  let lastError: unknown = null;
  for (const endpoint of endpoints) {
    try {
      const params = new URLSearchParams({
        fields,
        limit: String(pageLimit),
        access_token: token,
      });
      if (after) params.set("after", after);
      const res = await fetch(`${endpoint}?${params.toString()}`, {
        signal: AbortSignal.timeout(18000),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray((data as { data?: unknown[] }).data)) {
        const paging = (data as { paging?: { cursors?: { after?: string; before?: string } } }).paging;
        return {
          ok: true as const,
          items: ((data as { data: Record<string, any>[] }).data).map(normalize),
          nextCursor: paging?.cursors?.after || "",
          hasMore: Boolean(paging?.cursors?.after) || Boolean((data as { paging?: { next?: string } }).paging?.next),
        };
      }
      lastError = data;
      if (isExpiredTokenError(data)) break;
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

    const { token, igUserId, tokenExpiresAt, after, limit, web } = await parseInput(req);
    let workingToken = token;
    let refreshedToken = "";
    let refreshedExpiresIn = 0;

    if (workingToken && tokenNeedsRefresh(tokenExpiresAt)) {
      const refreshed = await refreshLongLivedToken(workingToken);
      if (refreshed.ok) {
        workingToken = refreshed.token;
        refreshedToken = refreshed.token;
        refreshedExpiresIn = refreshed.expiresIn;
      }
    }

    const payload = !token
      ? { error: "Missing access token", data: [] }
      : await (async () => {
          const result = await fetchMedia(workingToken, igUserId, after, limit);
          if (result.ok) {
            return {
              data: result.items,
              nextCursor: result.nextCursor,
              hasMore: result.hasMore,
              ...(refreshedToken
                ? { refreshedToken, expiresIn: refreshedExpiresIn }
                : {}),
            };
          }
          console.log("[ig/media] graph error", result.lastError);
          const expired = isExpiredTokenError(result.lastError);
          return {
            error: expired
              ? "Instagram session expired. Reconnect Instagram to continue."
              : "Failed to fetch Instagram media",
            details: result.lastError,
            expired,
            code: expired ? 190 : undefined,
            data: [],
            hasMore: false,
            nextCursor: "",
          };
        })();

    if (web || !(res && typeof res.status === "function")) {
      return Response.json(payload, { status: 200 });
    }
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json(payload);
  } catch (error) {
    const payload = { error: String(error), data: [] };
    if (res && typeof res.status === "function") return res.status(200).json(payload);
    return Response.json(payload, { status: 200 });
  }
}
