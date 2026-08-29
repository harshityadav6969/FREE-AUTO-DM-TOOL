export const config = { runtime: "edge" };

function formatCount(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function normalizeUsername(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .split(/[/?#\s]/)[0]
    .toLowerCase();
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const q = normalizeUsername(url.searchParams.get("q") || "");
  const token = url.searchParams.get("accessToken") || "";
  const igUserId = url.searchParams.get("igUserId") || "";

  if (!q) return Response.json({ accounts: [] });

  const fallback = {
    username: q,
    name: q,
    followers: "—",
    posts: "—",
    followersCount: 0,
    profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=111827&color=fff`,
  };

  if (token && igUserId) {
    try {
      const fields = `business_discovery.username(${q}){username,name,profile_picture_url,followers_count,media_count}`;
      const res = await fetch(
        `https://graph.instagram.com/v21.0/${encodeURIComponent(igUserId)}?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      const d = data?.business_discovery;
      if (d?.username) {
        return Response.json({
          accounts: [
            {
              username: d.username,
              name: d.name || d.username,
              followers: formatCount(Number(d.followers_count || 0)),
              posts: d.media_count ?? "—",
              followersCount: Number(d.followers_count || 0),
              profilePic:
                d.profile_picture_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(d.username)}&background=111827&color=fff`,
            },
          ],
        });
      }
    } catch {
      // fall through
    }
  }

  return Response.json({ accounts: [fallback] });
}
