export const config = { runtime: "edge" };

const IG_APP_ID =
  process.env.INSTAGRAM_APP_ID ||
  process.env.META_APP_ID ||
  "997208969924157";

const SCOPES =
  "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights";

function redirectUri(request: Request) {
  if (process.env.INSTAGRAM_REDIRECT_URI) return process.env.INSTAGRAM_REDIRECT_URI;
  const origin = new URL(request.url).origin.replace(/\/$/, "");
  return `${origin}/`;
}

export default async function handler(request: Request) {
  const uri = redirectUri(request);
  const url =
    `https://www.instagram.com/oauth/authorize` +
    `?force_reauth=true` +
    `&client_id=${encodeURIComponent(IG_APP_ID)}` +
    `&redirect_uri=${encodeURIComponent(uri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES)}`;

  return Response.json({ url, redirectUri: uri });
}
