import { json } from "../../../src/server/igHelpers";

function originFromReq(req: any) {
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "free-auto-dm-tool.vercel.app").split(",")[0];
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  return `${proto}://${host}`.replace(/\/$/, "");
}

function redirectUri(req: any) {
  if (process.env.INSTAGRAM_REDIRECT_URI) return process.env.INSTAGRAM_REDIRECT_URI;
  const origin = (process.env.APP_URL || originFromReq(req)).replace(/\/$/, "");
  if (process.env.VERCEL || /vercel\.app/i.test(origin)) return `${origin}/`;
  return `${origin}/auth/ig/callback`;
}

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  const appId = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "";
  if (!appId) {
    return json(res, 500, { error: "INSTAGRAM_APP_ID is missing on Vercel" });
  }

  const uri = redirectUri(req);
  const url =
    `https://www.instagram.com/oauth/authorize` +
    `?force_reauth=true` +
    `&client_id=${encodeURIComponent(appId)}` +
    `&redirect_uri=${encodeURIComponent(uri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(
      "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights"
    )}`;

  return json(res, 200, { url, redirectUri: uri });
}
