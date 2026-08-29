import { searchAccounts, json } from "../../src/server/igHelpers";

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const accounts = searchAccounts(String(req.query?.q || ""));
  return json(res, 200, { accounts });
}
