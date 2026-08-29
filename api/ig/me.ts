export const config = { runtime: "edge" };

export default async function handler(request: Request) {
  const token = new URL(request.url).searchParams.get("accessToken") || "";
  if (!token) {
    return Response.json({ error: "Missing access token" }, { status: 400 });
  }

  const fields =
    "user_id,username,name,account_type,profile_picture_url,followers_count,media_count";
  const res = await fetch(
    `https://graph.instagram.com/v21.0/me?fields=${fields}&access_token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!res.ok) {
    return Response.json({ error: data }, { status: 500 });
  }

  const id = String(data.user_id || data.id || "");
  return Response.json({
    instagramId: id,
    username: data.username || "",
    name: data.name || data.username || "",
    profilePicture: data.profile_picture_url || "",
    followersCount: Number(data.followers_count || 0),
    mediaCount: Number(data.media_count || 0),
    accountType: data.account_type || "BUSINESS",
    pageAccessToken: token,
    isActive: true,
  });
}
