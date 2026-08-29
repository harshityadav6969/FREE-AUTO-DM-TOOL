export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || "BOOSTUPP";
    if (mode === "subscribe" && token === verifyToken) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).end();
    return;
  }

  res.status(200).send("EVENT_RECEIVED");
}
