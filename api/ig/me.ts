export const config = { runtime: "nodejs", maxDuration: 10 };

export default async function handler(request: Request) {
  const token = new URL(request.url).searchParams.get("accessToken") || "";
  if (!token) {
    return Response.json({ error: "Missing access token" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username,name,account_type,profile_picture_url,followers_count,media_count&access_token=${encodeURIComponent(token)}`,
      { signal: AbortSignal.timeout(7000) }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return Response.json({ error: data }, { status: 400 });
    return Response.json({
      instagramId: String(data.user_id || data.id || ""),
      username: data.username || "",
      name: data.name || data.username || "",
      profilePicture: data.profile_picture_url || "",
      followersCount: Number(data.followers_count || 0),
      mediaCount: Number(data.media_count || 0),
      accountType: data.account_type || "BUSINESS",
      pageAccessToken: token,
      isActive: true,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 504 });
  }
}
