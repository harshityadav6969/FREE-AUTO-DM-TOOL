export const config = { runtime: "edge" };

export default async function handler(request: Request) {
  const token = new URL(request.url).searchParams.get("accessToken") || "";
  if (!token) {
    return Response.json({ error: "Missing access token" }, { status: 400 });
  }

  const res = await fetch(
    `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=${encodeURIComponent(token)}`
  );
  const data = await res.json();
  if (!res.ok) {
    return Response.json({ error: data }, { status: 500 });
  }
  return Response.json(data);
}
