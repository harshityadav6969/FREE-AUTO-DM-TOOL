import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIgAccounts } from "../lib/igAccounts";
import { cn } from "../lib/utils";

const cats = ["All", "Featured", "Engage audience", "Sell & earn", "Capture leads", "Book clients"];

const templates = [
  { title: "Send link on keyword", desc: "Someone comments 'LINK' → they get your link in DMs.", keyword: "LINK", cat: "Featured" },
  { title: "Send link on story reaction", desc: "Someone reacts or replies → they get your link in DMs.", keyword: "STORY", cat: "Engage audience" },
  { title: "Require follow before link", desc: "Ask them to follow you first.", keyword: "LINK", cat: "Capture leads" },
  { title: "Auto-reply to DMs", desc: "Someone DMs INFO or PRICE — they get an instant reply.", keyword: "INFO", cat: "Sell & earn" },
];

export default function Templates() {
  const [cat, setCat] = useState("Featured");
  const { connected } = useIgAccounts();
  const navigate = useNavigate();
  const list = templates.filter((t) => cat === "All" || t.cat === cat || cat === "Featured");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Automation templates</h1>
        <p className="text-black/50 mt-1">Pre-filled automations to get you started. Pick one, customize the message and link, then go live.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold border",
              cat === c ? "bg-black text-white border-black" : "bg-white border-black/10 text-black/70"
            )}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="font-bold">Popular</p>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((t) => (
          <div key={t.title} className="bg-white rounded-3xl p-5 border border-black/5">
            <h3 className="font-bold">{t.title}</h3>
            <p className="text-sm text-black/50 mt-1 mb-4">{t.desc}</p>
            <button
              onClick={() =>
                navigate(
                  connected
                    ? `/automation?new=1&keyword=${t.keyword}`
                    : "/connect-instagram"
                )
              }
              className="w-full bg-black text-white font-bold py-2.5 rounded-xl text-sm"
            >
              Use template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
