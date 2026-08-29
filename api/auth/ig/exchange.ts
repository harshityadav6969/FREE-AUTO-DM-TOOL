import axios from "axios";
import { json } from "../../../src/server/igHelpers";

function originFromReq(req: any) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0];
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  return `${proto}://${host}`.replace(/\/$/, "");
}

function candidates(req: any) {
  const origin = (process.env.APP_URL || originFromReq(req)).replace(/\/$/, "");
  return [
    process.env.INSTAGRAM_REDIRECT_URI,
    `${origin}/`,
    origin,
    `${origin}/auth/ig/callback`,
  ].filter((value, i, list) => value && list.indexOf(value) === i) as string[];
}

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const code = String(req.body?.code || req.query?.code || "");
  if (!code) return json(res, 400, { error: "Code missing" });

  const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "";
  const appSecret = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
  if (!appId || !appSecret) {
    return json(res, 500, { error: "Instagram app credentials missing on Vercel" });
  }

  let lastError: unknown = null;
  let shortToken = "";

  for (const redirectUri of candidates(req)) {
    try {
      const tokenRes = await axios.post(
        "https://api.instagram.com/oauth/access_token",
        new URLSearchParams({
          client_id: appId,
          client_secret: appSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      shortToken =
        tokenRes.data?.access_token || tokenRes.data?.data?.[0]?.access_token || "";
      if (shortToken) break;
    } catch (error: any) {
      lastError = error.response?.data || error.message;
    }
  }

  if (!shortToken) {
    return json(res, 500, { error: "Failed to exchange Instagram code", details: lastError });
  }

  let token = shortToken;
  try {
    const longLived = await axios.get("https://graph.instagram.com/access_token", {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: appSecret,
        access_token: shortToken,
      },
    });
    token = longLived.data?.access_token || shortToken;
  } catch {
    // keep short-lived token
  }

  return json(res, 200, { token });
}
