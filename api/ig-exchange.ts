export const config = { runtime: "nodejs", maxDuration: 10 };

function parseExchange(data: unknown) {
  const obj = (data || {}) as {
    access_token?: string;
    user_id?: string | number;
    data?: Array<{ access_token?: string; user_id?: string | number }>;
  };
  const row = obj.data?.[0];
  return {
    token: String(obj.access_token || row?.access_token || ""),
    instagramId: String(obj.user_id || row?.user_id || ""),
  };
}

function redirectUri(req: { headers?: Record<string, string | string[] | undefined> }) {
  if (process.env.INSTAGRAM_REDIRECT_URI) return process.env.INSTAGRAM_REDIRECT_URI;
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "free-auto-dm-tool.vercel.app")
    .split(",")[0]
    .replace(/\/$/, "");
  const proto = String(req.headers?.["x-forwarded-proto"] || "https").split(",")[0];
  return `${proto}://${host}/`;
}

function readCode(req: { body?: unknown; query?: Record<string, unknown> }) {
  const body = req.body as { code?: string } | string | undefined;
  const fromBody =
    typeof body === "string"
      ? (() => {
          try {
            return JSON.parse(body).code;
          } catch {
            return new URLSearchParams(body).get("code");
          }
        })()
      : body?.code;
  return String(fromBody || req.query?.code || "")
    .split("#")[0]
    .trim();
}

async function exchange(code: string, uri: string) {
  const appId =
    process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "997208969924157";
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
  if (!appSecret) throw new Error("INSTAGRAM_APP_SECRET is missing on Vercel");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: uri,
        code,
      }),
      signal: controller.signal,
    });
    const raw = await res.text();
    let data: unknown = {};
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }
    const parsed = parseExchange(data);
    if (!parsed.token) throw data;
    return parsed;
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  const code = readCode(req);
  if (!code) return res.status(400).json({ error: "Code missing" });

  const uri = redirectUri(req);
  try {
    const result = await Promise.race([
      exchange(code, uri),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Instagram token exchange timed out")), 6500)
      ),
    ]);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      error: "Failed to exchange Instagram code",
      details: error instanceof Error ? error.message : error,
      redirectUri: uri,
    });
  }
}
