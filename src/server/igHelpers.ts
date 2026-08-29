function normalizeUsername(raw: string) {
  return String(raw || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/\/+$/, "")
    .split(/[/?#\s]/)[0]
    .toLowerCase();
}

export function searchAccounts(qRaw: string) {
  const q = normalizeUsername(qRaw);
  if (!q) return [];
  return [
    {
      username: q,
      name: q,
      followers: "—",
      posts: "—",
      profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(q)}&background=111827&color=fff`,
    },
  ];
}

export function json(res: { status: (n: number) => any; setHeader: Function; json: Function; end?: Function }, status: number, body: unknown) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.status(status).json(body);
}
