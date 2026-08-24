
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import admin from "firebase-admin";

dotenv.config({
  path: path.resolve(process.cwd(), ".env")
});

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3000;

const REDIRECT_URI =
  "https://claim-ladder-exile.ngrok-free.dev/auth/ig/callback/";

// --------------------------------------------------
// FIREBASE
// --------------------------------------------------

if (process.env.FIREBASE_SERVICE_ACCOUNT) {

  try {

    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT
    );

    if (!admin.apps.length) {

      admin.initializeApp({
        credential:
          admin.credential.cert(serviceAccount)
      });
    }

  } catch (e) {

    console.error(
      "Failed to initialize Firebase Admin:",
      e
    );
  }
}

// --------------------------------------------------
// WEBHOOK ROUTES
// --------------------------------------------------

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];

  const token =
    req.query["hub.verify_token"];

  const challenge =
    req.query["hub.challenge"];

  const verifyToken =
    process.env.WEBHOOK_VERIFY_TOKEN ||
    "BOOSTUPP";

  if (
    mode === "subscribe" &&
    token === verifyToken
  ) {

    res.set("Content-Type", "text/plain");

    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {

  console.log(
    "Webhook Event:",
    JSON.stringify(req.body, null, 2)
  );

  return res
    .status(200)
    .send("EVENT_RECEIVED");
});

// --------------------------------------------------
// INSTAGRAM OAUTH
// --------------------------------------------------

app.get("/api/auth/ig/url", async (req, res) => {

  try {

    const appId =
      process.env.META_APP_ID;


     const authUrl =
      `https://www.instagram.com/oauth/authorize` +
      `?force_reauth=true` +
      `&client_id=${appId}` +
      `&redirect_uri=https://claim-ladder-exile.ngrok-free.dev/auth/ig/callback` +
      `&response_type=code` +
      `&scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`;

    // const authUrl =
    //   https://www.instagram.com/oauth/authorize +
    //   ?enable_fb_login=0 +
    //   &force_authentication=1` +
    //   &client_id=${appId} +
    //   &redirect_uri=${encodeURIComponent(REDIRECT_URI)} +
    //   &response_type=code +
    //   &scope=instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments`;

    console.log("AUTH URL:", authUrl);

    res.json({
      url: authUrl
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: 
        "Failed to generate auth URL"
    });
  }
});

app.get("/auth/ig/callback", async (req, res) => {

  const { code } = req.query;

  const appId =
    process.env.META_APP_ID;

  const appSecret =
    process.env.META_APP_SECRET;

  if (!code) {

    return res
      .status(400)
      .send("Code missing");
  }

 try {

  console.log("APP ID:", appId);
  console.log("APP SECRET:", appSecret);
  console.log("REDIRECT URI:", REDIRECT_URI);
  console.log("CODE:", code);

  const tokenRes = await axios.get(
    "https://graph.facebook.com/v21.0/oauth/access_token",
    {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: REDIRECT_URI,
        code
      }
    }
  );

  console.log(
    "TOKEN RESPONSE:",
    tokenRes.data
  );

  const shortToken =
    tokenRes.data.access_token;

  res.send(`
    <html>
      <body style="
        background:#000;
        color:#fff;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
        font-family:sans-serif;
      ">

        <script>

          if (window.opener) {

            window.opener.postMessage({
              type: "IG_AUTH_SUCCESS",
              token: "${shortToken}"
            }, "*");

            window.close();
          }

        </script>

        <div style="text-align:center;">
          <h2>Instagram Connected ✅</h2>
          <p>You can close this window.</p>
        </div>

      </body>
    </html>
  `);

} catch (error: any) {

  console.error(
    "IG Auth Error:",
    error.response?.data ||
    error.message
  );

  res.status(500).send(`
    <html>
      <body style="
        background:#000;
        color:red;
        display:flex;
        align-items:center;
        justify-content:center;
        height:100vh;
        font-family:sans-serif;
      ">

        <div>
          <h2>
            Authentication Failed ❌
          </h2>

          <pre>
${JSON.stringify(
  error.response?.data,
  null,
  2
)}
          </pre>
        </div>

      </body>
    </html>
  `);
}
// --------------------------------------------------
// INSTAGRAM MEDIA
// --------------------------------------------------

app.get("/api/ig/media", async (req, res) => {

  const { igId, accessToken } =
    req.query;

  if (!igId || !accessToken) {

    return res.status(400).json({
      error:
        "Missing identity or token"
    });
  }

  try {

    const tokenRes = await axios.get(
  "https://graph.facebook.com/v21.0/oauth/access_token",
  {
    params: {
      client_id: appId,
      client_secret: appSecret,
      redirect_uri:
        "https://claim-ladder-exile.ngrok-free.dev/auth/ig/callback",
      code
    }
  }
);

const shortToken =
  tokenRes.data.access_token;

    res.json(response.data);

  } catch (error: any) {

    console.error(
      "IG Media Fetch Error:",
      error.response?.data ||
      error.message
    );

    res.status(500).json({
      error:
        "Failed to fetch Instagram media"
    });
  }
});

// --------------------------------------------------
// GEMINI ANALYSIS
// --------------------------------------------------

app.post(
  "/api/ai/analyze-account",
  async (req, res) => {

    const { username } = req.body;

    if (!process.env.GEMINI_API_KEY) {

      return res.status(500).json({
        error:
          "Gemini API key missing"
      });
    }

    try {

      const ai = new GoogleGenAI({
        apiKey:
          process.env.GEMINI_API_KEY
      });

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

      const response =
        await ai.models.generateContent({
          model: "gemini-1.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: promptValue
                }
              ]
            }
          ],
          tools: [
            { googleSearch: {} }
          ],
          toolConfig: {
            includeServerSideToolInvocations: true
          },
          config: {
            responseMimeType:
              "application/json"
          }
        });

      const text =
        response.text || "";

      const data =
        JSON.parse(text);

      res.json(data);

    } catch (error: any) {

      console.error(
        "AI Analysis Error:",
        error.message || error
      );

      res.status(500).json({
        error:
          "Analysis failed"
      });
    }
  }
);

// --------------------------------------------------
// VITE
// --------------------------------------------------

async function startServer() {

  if (
    process.env.NODE_ENV !==
    "production"
  ) {

    const vite =
      await createViteServer({
        server: {
          middlewareMode: true
        },
        appType: "spa"
      });

    app.use(vite.middlewares);

  } else {

    const distPath = path.join(
      process.cwd(),
      "dist"
    );

    app.use(express.static(distPath));

    app.get("*", (req, res) => {

      res.sendFile(
        path.join(
          distPath,
          "index.html"
        )
      );
    });
  }

  app.listen(
    PORT,
    "0.0.0.0",
    () => {

      console.log(
        `🚀 Server running on http://localhost:${PORT}`
      );
    }
  );
}

startServer();