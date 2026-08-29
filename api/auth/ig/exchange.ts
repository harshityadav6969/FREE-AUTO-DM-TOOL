export const config = { runtime: "nodejs", maxDuration: 10 };

export default async function handler(req: any, res: any) {
  res.statusCode = 410;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Use POST /api/ig-exchange" }));
}
