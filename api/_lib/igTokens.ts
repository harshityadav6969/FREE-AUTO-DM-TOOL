export function parseTokenPayload(data: unknown) {
  const obj = (data || {}) as {
    access_token?: string;
    user_id?: string | number;
    expires_in?: number;
    data?: Array<{ access_token?: string; user_id?: string | number }>;
  };
  const row = obj.data?.[0];
  return {
    token: String(obj.access_token || row?.access_token || ""),
    instagramId: String(obj.user_id || row?.user_id || ""),
    expiresIn: Number(obj.expires_in || 0),
  };
}

export async function exchangeForLongLivedToken(shortToken: string) {
  const appSecret =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";
  if (!appSecret) {
    return {
      ok: false as const,
      error: { error: "INSTAGRAM_APP_SECRET is missing on Vercel" },
    };
  }
  if (!shortToken) {
    return { ok: false as const, error: { error: "Short-lived token missing" } };
  }

  const url =
    `https://graph.instagram.com/access_token` +
    `?grant_type=ig_exchange_token` +
    `&client_secret=${encodeURIComponent(appSecret)}` +
    `&access_token=${encodeURIComponent(shortToken)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    const data = await res.json().catch(() => ({}));
    console.error("[ig-token] long-lived Meta response", res.status, JSON.stringify(data));
    const parsed = parseTokenPayload(data);
    if (!res.ok || !parsed.token) {
      return { ok: false as const, error: data };
    }
    return {
      ok: true as const,
      token: parsed.token,
      expiresIn: parsed.expiresIn || 5184000,
    };
  } catch (error) {
    const payload = {
      message: error instanceof Error ? error.message : String(error),
    };
    console.error("[ig-token] long-lived exception", JSON.stringify(payload));
    return { ok: false as const, error: payload };
  }
}

export async function refreshLongLivedToken(token: string) {
  const url =
    `https://graph.instagram.com/refresh_access_token` +
    `?grant_type=ig_refresh_token` +
    `&access_token=${encodeURIComponent(token)}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json().catch(() => ({}));
    const parsed = parseTokenPayload(data);
    if (!res.ok || !parsed.token) {
      return { ok: false as const, error: data };
    }
    return {
      ok: true as const,
      token: parsed.token,
      expiresIn: parsed.expiresIn || 5184000,
    };
  } catch (error) {
    return {
      ok: false as const,
      error: { message: error instanceof Error ? error.message : String(error) },
    };
  }
}

export function isExpiredTokenError(details: unknown) {
  const text = JSON.stringify(details || {}).toLowerCase();
  return text.includes('"code":190') || text.includes("session has expired") || text.includes("oauthexception");
}
