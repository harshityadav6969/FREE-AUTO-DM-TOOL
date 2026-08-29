export const config = { runtime: "nodejs", maxDuration: 30 };

function originFrom(request: Request) {
  return new URL(request.url).origin.replace(/\/$/, "");
}

function redirectUris(request: Request) {
  const origin = (process.env.APP_URL || originFrom(request)).replace(/\/$/, "");
  return [
    process.env.INSTAGRAM_REDIRECT_URI,
    `${origin}/`,
    origin,
    `${origin}/auth/ig/callback`,
  ].filter((value, i, list) => Boolean(value) && list.indexOf(value) === i) as string[];
}

function parseToken(data: unknown, raw: string) {
  const obj = data as {
    access_token?: string;
    data?: Array<{ access_token?: string }>;
  };
  return (
    obj?.access_token ||
    obj?.data?.[0]?.access_token ||
    decodeURIComponent((/access_token=([^&]+)/.exec(raw) || [])[1] || "")
  );
}

async function readJsonOrText(res: Response) {
  const raw = await res.text();
  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: {}, raw };
  }
}

async function exchangeCode(code: string, request: Request) {
  const appId =
    process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "997208969924157";
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";

  if (!appSecret) {
    throw new Error("INSTAGRAM_APP_SECRET is missing on Vercel");
  }

  const endpoints = [
    "https://api.instagram.com/oauth/access_token",
    "https://graph.instagram.com/oauth/access_token",
  ];

  let lastError: unknown = null;

  for (const redirectUri of redirectUris(request)) {
    for (const endpoint of endpoints) {
      try {
        const tokenRes = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code,
          }),
        });
        const { data, raw } = await readJsonOrText(tokenRes);
        const shortToken = parseToken(data, raw);
        if (shortToken) {
          let token = shortToken;
          try {
            const longLived = await fetch(
              `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`
            );
            const longParsed = await readJsonOrText(longLived);
            token = parseToken(longParsed.data, longParsed.raw) || shortToken;
          } catch {
            token = shortToken;
          }
          return token;
        }
        lastError = data || raw || { status: tokenRes.status };
      } catch (error) {
        lastError = String(error);
      }
    }
  }

  throw lastError || new Error("Failed to exchange Instagram code");
}

async function readCode(request: Request) {
  const fromQuery = new URL(request.url).searchParams.get("code") || "";
  if (request.method !== "POST") return fromQuery.split("#")[0].trim();

  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => ({}))) as { code?: string };
    return String(body.code || fromQuery).split("#")[0].trim();
  }

  const text = await request.text();
  try {
    const body = JSON.parse(text) as { code?: string };
    return String(body.code || fromQuery).split("#")[0].trim();
  } catch {
    return (new URLSearchParams(text).get("code") || fromQuery).split("#")[0].trim();
  }
}

export default async function handler(request: Request) {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    const code = await readCode(request);
    if (!code) {
      return Response.json({ error: "Code missing" }, { status: 400 });
    }

    const token = await exchangeCode(code, request);
    return Response.json({ token });
  } catch (error) {
    return Response.json(
      { error: "Failed to exchange Instagram code", details: error },
      { status: 500 }
    );
  }
}
