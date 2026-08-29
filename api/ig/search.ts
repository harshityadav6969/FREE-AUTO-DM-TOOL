export const config = { runtime: "edge" };

function normalizeUsername(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .split(/[/?#\s]/)[0]
    .toLowerCase();
}

export default async function handler(request: Request) {
  const q = normalizeUsername(new URL(request.url).searchParams.get("q") || "");
  const accounts = q
    ? [
        {
          username: q,
          name: q,
          followers: "—",
          posts: "—",
          profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=111827&color=fff`,
        },
      ]
    : [];

  return Response.json({ accounts });
}
