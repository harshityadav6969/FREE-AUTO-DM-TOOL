import express, { type Request, type Response } from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

function stripSlash(url: string) {
  return url.replace(/\/$/, "");
}

function isNgrok(url: string) {
  return /ngrok/i.test(url);
}

export function getPublicOrigin(req?: Request) {
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${stripSlash(vercelHost)}`;
  }

  const configured = process.env.APP_URL || "";
  if (configured && !isNgrok(configured)) {
    return stripSlash(configured);
  }

  if (req) {
    const proto = String(
      req.headers["x-forwarded-proto"] || req.protocol || "http"
    ).split(",")[0];
    const host = String(
      req.headers["x-forwarded-host"] || req.get("host") || "localhost:3000"
    ).split(",")[0];
    const safeHost = host.replace(":5173", ":3000");
    return `${proto}://${safeHost}`;
  }

  return "http://localhost:3000";
}

export function getRedirectUri(req?: Request) {
  if (process.env.INSTAGRAM_REDIRECT_URI) {
    return process.env.INSTAGRAM_REDIRECT_URI;
  }
  const origin = getPublicOrigin(req);
  // Meta for this live app is registered as the site root (trailing slash).
  if (process.env.VERCEL || /vercel\.app$/i.test(origin)) {
    return `${origin}/`;
  }
  return `${origin}/auth/ig/callback`;
}

function redirectCandidates(req?: Request) {
  const origin = getPublicOrigin(req);
  const configured = process.env.INSTAGRAM_REDIRECT_URI;
  return [
    configured,
    `${origin}/`,
    origin,
    `${origin}/auth/ig/callback`,
  ].filter((value, index, list): value is string =>
    Boolean(value) && list.indexOf(value) === index
  );
}

function isLocalHost(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function getFrontendOrigin(req?: Request) {
  const configured = process.env.FRONTEND_URL || "";
  if (configured && !isNgrok(configured) && !isLocalHost(configured)) {
    return stripSlash(configured);
  }
  return getPublicOrigin(req);
}

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  // Vercel catch-all functions often strip the /api prefix.
  app.use((req, _res, next) => {
    const [pathname, query] = req.url.split("?");
    if (
      pathname &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/auth") &&
      !pathname.startsWith("/webhook")
    ) {
      req.url = `/api${pathname.startsWith("/") ? pathname : `/${pathname}`}${
        query ? `?${query}` : ""
      }`;
    }
    next();
  });

  const APP_ID =
    process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID || "";
  const APP_SECRET =
    process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET || "";

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
      }
    } catch (e) {
      console.error("Failed to initialize Firebase Admin:", e);
    }
  }

  function appAccessToken() {
    return `${APP_ID}|${APP_SECRET}`;
  }

  function normalizeUsername(raw: string) {
    return String(raw || "")
      .trim()
      .replace(/^@+/, "")
      .replace(/\/+$/, "")
      .split(/[/?#\s]/)[0]
      .toLowerCase();
  }

  function formatCount(value: unknown) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return "—";
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(Math.round(n));
  }

  async function exchangeInstagramCode(code: string, req: Request) {
    if (!APP_ID || !APP_SECRET) {
      throw new Error("Instagram app credentials missing");
    }

    let lastError: any = null;
    let shortToken = "";

    for (const redirectUri of redirectCandidates(req)) {
      try {
        const tokenRes = await axios.post(
          "https://api.instagram.com/oauth/access_token",
          new URLSearchParams({
            client_id: APP_ID,
            client_secret: APP_SECRET,
            grant_type: "authorization_code",
            redirect_uri: redirectUri,
            code: String(code)
          }),
          { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        shortToken =
          tokenRes.data?.access_token ||
          tokenRes.data?.data?.[0]?.access_token ||
          "";

        if (shortToken) break;
      } catch (error: any) {
        lastError = error;
      }
    }

    if (!shortToken) {
      throw lastError || new Error("No access token returned from Instagram");
    }

    try {
      const longLived = await axios.get(
        "https://graph.instagram.com/access_token",
        {
          params: {
            grant_type: "ig_exchange_token",
            client_secret: APP_SECRET,
            access_token: shortToken
          }
        }
      );
      console.error(
        "[ig-exchange local] long-lived Meta response",
        JSON.stringify(longLived.data)
      );
      const accessToken = longLived.data?.access_token;
      if (!accessToken) {
        throw Object.assign(new Error("Instagram connection incomplete, please reconnect"), {
          response: { data: longLived.data }
        });
      }
      return accessToken;
    } catch (e: any) {
      console.error(
        "Long-lived token exchange failed:",
        JSON.stringify(e.response?.data ?? e.message ?? e)
      );
      const err = new Error("Instagram connection incomplete, please reconnect");
      (err as any).response = e.response || { data: e.response?.data || e.message };
      throw err;
    }
  }

  const igCallback = async (req: Request, res: Response) => {
    const { code, error, error_description } = req.query as Record<
      string,
      string
    >;
    const frontend = getFrontendOrigin(req);

    if (error) {
      return res
        .status(400)
        .send(`Instagram auth error: ${error_description || error}`);
    }

    if (!code) {
      return res.status(400).send("Code missing");
    }

    try {
      const accessToken = await exchangeInstagramCode(String(code), req);

      const safeToken = JSON.stringify(accessToken);
      const safeFrontend = JSON.stringify(
        `${stripSlash(frontend)}/dashboard?connected=1`
      );

      res.send(`
        <html>
          <body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
            <script>
              (function () {
                var token = ${safeToken};
                var next = ${safeFrontend};
                try { localStorage.setItem("ig_access_token", token); } catch (e) {}
                if (window.opener) {
                  window.opener.postMessage({ type: "IG_AUTH_SUCCESS", token: token }, "*");
                  window.close();
                  return;
                }
                window.location.replace(next + "#ig_token=" + encodeURIComponent(token));
              })();
            </script>
            <div style="text-align:center;">
              <h2>Instagram Connected</h2>
              <p>You can close this window.</p>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("IG Auth Error:", error.response?.data || error.message);
      res.status(500).send(`
        <html>
          <body style="background:#000;color:red;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
            <div>
              <h2>Authentication Failed</h2>
              <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
            </div>
          </body>
        </html>
      `);
    }
  };

  const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || "BOOSTUPP";

    if (mode === "subscribe" && token === verifyToken) {
      res.set("Content-Type", "text/plain");
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  };

  const receiveWebhook = (req: Request, res: Response) => {
    console.log("Webhook Event:", JSON.stringify(req.body, null, 2));
    return res.status(200).send("EVENT_RECEIVED");
  };

  app.get(["/webhook", "/api/webhook"], verifyWebhook);
  app.post(["/webhook", "/api/webhook"], receiveWebhook);

  app.get("/api/ig/search", async (req, res) => {
    const q = normalizeUsername(String(req.query.q || ""));

    if (q.length < 1) {
      return res.json({ accounts: [] });
    }

    const accounts: Array<{
      username: string;
      name: string;
      followers: string;
      posts: string | number;
      profilePic: string;
    }> = [];

    const seen = new Set<string>();

    const pushAccount = (account: {
      username?: string;
      name?: string;
      followers?: string | number;
      posts?: string | number;
      profilePic?: string;
    }) => {
      const username = normalizeUsername(account.username || "");
      if (!username || seen.has(username)) return;
      seen.add(username);
      accounts.push({
        username,
        name: account.name || username,
        followers:
          typeof account.followers === "number"
            ? formatCount(account.followers)
            : String(account.followers || "—"),
        posts: account.posts ?? "—",
        profilePic:
          account.profilePic ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=111827&color=fff`
      });
    };

    pushAccount({
      username: q,
      name: q,
      followers: "—",
      posts: "—"
    });

    try {
      if (APP_ID && APP_SECRET) {
        const pageRes = await axios.get(
          "https://graph.facebook.com/v21.0/pages/search",
          {
            params: {
              q,
              type: "page",
              fields: "id,name,username,fan_count,picture.type(large)",
              limit: 8,
              access_token: appAccessToken()
            },
            timeout: 8000,
            validateStatus: () => true
          }
        );

        const pages = pageRes.data?.data;
        if (Array.isArray(pages)) {
          for (const page of pages) {
            const username = normalizeUsername(page.username || page.name || "");
            if (!username) continue;
            if (
              username.includes(q) ||
              String(page.name || "")
                .toLowerCase()
                .includes(q)
            ) {
              pushAccount({
                username,
                name: page.name || username,
                followers: page.fan_count,
                posts: "—",
                profilePic: page.picture?.data?.url
              });
            }
          }
        }
      }
    } catch (error: any) {
      console.error(
        "IG page search error:",
        error.response?.data || error.message
      );
    }

    return res.json({ accounts: accounts.slice(0, 8) });
  });

  app.get("/api/auth/ig/url", async (req, res) => {
    try {
      if (!APP_ID) {
        return res.status(500).json({ error: "META_APP_ID is missing" });
      }

      const redirectUri = getRedirectUri(req);
      const authUrl =
        `https://www.instagram.com/oauth/authorize` +
        `?force_reauth=true` +
        `&client_id=${encodeURIComponent(APP_ID)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent(
          "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights"
        )}`;

      console.log("Instagram redirect URI:", redirectUri);
      return res.json({ url: authUrl, redirectUri });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to generate auth URL" });
    }
  });

  app.get("/auth/ig/callback", igCallback);
  app.get("/api/auth/ig/callback", igCallback);

  app.post("/api/auth/ig/exchange", async (req, res) => {
    const code = String(req.body?.code || req.query.code || "");
    if (!code) {
      return res.status(400).json({ error: "Code missing" });
    }
    try {
      const token = await exchangeInstagramCode(code, req);
      return res.json({ token });
    } catch (error: any) {
      console.error("IG exchange error:", error.response?.data || error.message);
      return res.status(500).json({
        error: "Failed to exchange Instagram code",
        details: error.response?.data || error.message
      });
    }
  });

  app.get("/api/ig/media", async (req, res) => {
    const accessToken = String(req.query.accessToken || "");

    if (!accessToken) {
      return res.status(400).json({ error: "Missing access token" });
    }

    try {
      const response = await axios.get(
        "https://graph.instagram.com/v21.0/me/media",
        {
          params: {
            fields:
              "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp",
            access_token: accessToken
          }
        }
      );
      return res.json(response.data);
    } catch (error: any) {
      console.error(
        "IG Media Fetch Error:",
        error.response?.data || error.message
      );
      return res.status(500).json({ error: "Failed to fetch Instagram media" });
    }
  });

  app.post("/api/ai/analyze-account", async (req, res) => {
    const { username } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key missing" });
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const promptValue = `
Use Google Search to research the Instagram account "@${username}".

Return JSON:
{
  "name": "",
  "username": "",
  "followers": "",
  "posts": 0,
  "isBusiness": true
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: promptValue }] }],
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "";
      return res.json(JSON.parse(text));
    } catch (error: any) {
      console.error("AI Analysis Error:", error.message || error);
      return res.status(500).json({ error: "Analysis failed" });
    }
  });

  return app;
}
