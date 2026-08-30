import { exchangeForLongLivedToken, parseTokenPayload } from "./_lib/igTokens";

export const config = { runtime: "nodejs", maxDuration: 10 };

const CANONICAL_REDIRECT = "https://free-auto-dm-tool.vercel.app/";

function resolveRedirectUri(hostHeader: string) {
  const host = String(hostHeader || "")
    .split(",")[0]
    .replace(/\/$/, "")
    .toLowerCase();
  if (host.includes("free-auto-dm-tool.vercel.app")) return CANONICAL_REDIRECT;
  return process.env.INSTAGRAM_REDIRECT_URI || CANONICAL_REDIRECT;
}

function header(req: { headers?: Record<string, unknown> }, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function codeFromUnknown(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") {
    try {
      return String(JSON.parse(value).code || "");
    } catch {
      return String(new URLSearchParams(value).get("code") || "");
    }
  }
  if (typeof value === "object" && value && "code" in value) {
    return String((value as { code?: string }).code || "");
  }
  return "";
}

async function readCode(req: any) {
  let fromBody = codeFromUnknown(req.body);
  if (!fromBody && req.query) fromBody = String(req.query.code || "");
  if (!fromBody && typeof req.json === "function") {
    const json = await req.json().catch(() => ({}));
    fromBody = codeFromUnknown(json);
  }
  if (!fromBody && req.readable && req.body == null) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    fromBody = codeFromUnknown(Buffer.concat(chunks).toString("utf8"));
  }
  return fromBody.split("#")[0].trim();
}

async function exchangeCode(code: string, redirectUri: string) {
  const appId =
    process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "997208969924157";
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
  if (!appSecret) {
    return { ok: false as const, meta: { error: "INSTAGRAM_APP_SECRET is missing on Vercel" } };
  }

  const res = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    }),
    signal: AbortSignal.timeout(5000),
  });
  const raw = await res.text();
  console.log("[ig-exchange] short-lived status", res.status, redirectUri);
  let data: unknown = {};
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  const parsed = parseTokenPayload(data);
  if (!parsed.token) return { ok: false as const, meta: data };

  let longLived = {
    token: parsed.token,
    expiresIn: 3600,
    longLived: false as boolean,
  };
  try {
    longLived = await exchangeForLongLivedToken(parsed.token);
  } catch (error) {
    console.log("[ig-exchange] long-lived skipped", error instanceof Error ? error.message : error);
  }

  return {
    ok: true as const,
    parsed: {
      token: longLived.token,
      instagramId: parsed.instagramId,
      expiresIn: longLived.expiresIn,
      tokenType: longLived.longLived ? "long-lived" : "short-lived",
    },
  };
}

export default async function handler(req: any, res: any) {
  const json = (status: number, payload: unknown) => {
    if (res && typeof res.status === "function") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(status).json(payload);
    }
    return Response.json(payload, {
      status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  };

  try {
    if (req?.method === "OPTIONS") {
      if (res && typeof res.status === "function") {
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
        return res.status(204).end();
      }
      return new Response(null, { status: 204 });
    }

    const host = header(req, "x-forwarded-host") || header(req, "host") || "free-auto-dm-tool.vercel.app";
    const redirectUri = resolveRedirectUri(host);
    const code = await readCode(req);
    if (!code) return json(400, { error: "Code missing", redirectUri });

    const result = await exchangeCode(code, redirectUri);
    if (result.ok) return json(200, result.parsed);
    return json(400, {
      error: "Failed to exchange Instagram code",
      details: result.meta,
      redirectUri,
    });
  } catch (error) {
    console.log("[ig-exchange] exception", error instanceof Error ? error.message : error);
    return json(400, {
      error: "Failed to exchange Instagram code",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
