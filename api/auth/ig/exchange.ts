export const config = { runtime: "edge" };

function originFrom(request: Request) {
  return new URL(request.url).origin.replace(/\/$/, "");
}

function candidates(request: Request) {
  const origin = (process.env.APP_URL || originFrom(request)).replace(/\/$/, "");
  return [
    process.env.INSTAGRAM_REDIRECT_URI,
    `${origin}/`,
    origin,
    `${origin}/auth/ig/callback`,
  ].filter((value, i, list) => Boolean(value) && list.indexOf(value) === i) as string[];
}

export default async function handler(request: Request) {
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

  let code = "";
  if (request.method === "POST") {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json().catch(() => ({}));
      code = String((body as { code?: string }).code || "");
    } else {
      const text = await request.text();
      try {
        const body = JSON.parse(text);
        code = String(body.code || "");
      } catch {
        code = new URLSearchParams(text).get("code") || "";
      }
    }
  }
  if (!code) {
    code = new URL(request.url).searchParams.get("code") || "";
  }

  if (!code) {
    return Response.json({ error: "Code missing" }, { status: 400 });
  }

  const appId =
    process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "997208969924157";
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";

  if (!appSecret) {
    return Response.json(
      { error: "INSTAGRAM_APP_SECRET is missing on Vercel" },
      { status: 500 }
    );
  }

  let lastError: unknown = null;
  let shortToken = "";

  for (const redirectUri of candidates(request)) {
    try {
      const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
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
      const data = await tokenRes.json();
      shortToken = data?.access_token || data?.data?.[0]?.access_token || "";
      if (shortToken) break;
      lastError = data;
    } catch (error) {
      lastError = String(error);
    }
  }

  if (!shortToken) {
    return Response.json(
      { error: "Failed to exchange Instagram code", details: lastError },
      { status: 500 }
    );
  }

  let token = shortToken;
  try {
    const longLived = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`
    );
    const data = await longLived.json();
    token = data?.access_token || shortToken;
  } catch {
    // keep short-lived token
  }

  return Response.json({ token });
}
