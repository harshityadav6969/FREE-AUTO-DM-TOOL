export const IG_APP_ID = "997208969924157";

export const IG_SCOPES = [
  "instagram_business_basic",
  "instagram_business_manage_messages",
  "instagram_business_manage_comments",
  "instagram_business_content_publish",
  "instagram_business_manage_insights",
].join(",");

export function igRedirectUri() {
  const origin = window.location.origin.replace(/\/$/, "");
  return `${origin}/`;
}

export function buildIgAuthUrl() {
  const params = new URLSearchParams({
    force_reauth: "true",
    client_id: IG_APP_ID,
    redirect_uri: igRedirectUri(),
    response_type: "code",
    scope: IG_SCOPES,
  });
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

export function localAccountSuggestion(raw: string) {
  const username = raw.trim().replace(/^@+/, "").split(/[/?#\s]/)[0].toLowerCase();
  if (!username) return null;
  return {
    username,
    name: username,
    followers: "—",
    posts: "—" as const,
    profilePic: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=111827&color=fff`,
  };
}
