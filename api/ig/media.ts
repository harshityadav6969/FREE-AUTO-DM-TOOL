export const config = { runtime: "nodejs", maxDuration: 20 };

const FIELDS =
  "id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp";

export default async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("accessToken") || "";
    const igUserId = url.searchParams.get("igUserId") || "";
    if (!token) {
      return Response.json({ error: "Missing access token" }, { status: 400 });
    }

    const paths = igUserId
      ? [`https://graph.instagram.com/v21.0/${encodeURIComponent(igUserId)}/media`]
      : [
          "https://graph.instagram.com/v21.0/me/media",
          "https://graph.instagram.com/me/media",
        ];

    let lastError: unknown = null;
    for (const endpoint of paths) {
      const res = await fetch(
        `${endpoint}?fields=${FIELDS}&limit=50&access_token=${encodeURIComponent(token)}`
      );
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data?.data)) {
        const items = data.data.map((item: Record<string, string>) => ({
          ...item,
          media_url: item.media_url || item.thumbnail_url || "",
          media_type:
            item.media_product_type === "REELS" ? "VIDEO" : item.media_type,
        }));
        return Response.json({ data: items });
      }
      lastError = data;
    }

    return Response.json({ error: lastError || "Failed to fetch media" }, { status: 500 });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
