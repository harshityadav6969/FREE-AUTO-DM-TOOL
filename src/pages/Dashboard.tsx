import React from "react";
import { useNavigate } from "react-router-dom";
import { useIgAccounts } from "../lib/igAccounts";
import { Plus } from "lucide-react";

const templates = [
  {
    title: "Send link on keyword",
    tag: "MOST POPULAR",
    desc: "Someone comments LINK → they get your link in DMs.",
    comment: "Need the LINK please!",
    reply: "Here's your link!",
    cta: "Shop the look",
  },
  {
    title: "Send link on story reaction",
    desc: "Someone reacts or replies → they get your link in DMs.",
    comment: "reacted to your story",
    reply: "Here's the link!",
    cta: "Shop now",
  },
  {
    title: "Require follow before link",
    desc: "Ask them to follow you first. Grow your audience with every link.",
    comment: "LINK",
    reply: "Follow me first!",
    cta: "I'm following",
  },
  {
    title: "Auto-reply to DMs",
    desc: "Someone DMs INFO or PRICE — they get an instant reply.",
    comment: "What's the PRICE?",
    reply: "Here's my pricing!",
    cta: "View packages",
  },
];

export default function Dashboard() {
  const { primary, connected } = useIgAccounts();
  const navigate = useNavigate();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {connected ? `Welcome @${primary?.username}!` : "Create your first automation"}
        </h1>
        <p className="text-black/50 mt-1">Turn Instagram comments into DMs automatically.</p>
      </div>

      <section>
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map((t) => (
            <div key={t.title} className="bg-white rounded-3xl p-5 border border-black/5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{t.title}</h3>
                {t.tag && (
                  <span className="text-[10px] font-black bg-[#D4FF00] px-2 py-1 rounded-full">{t.tag}</span>
                )}
              </div>
              <p className="text-sm text-black/50 mt-1 mb-4">{t.desc}</p>
              <div className="rounded-2xl bg-[#F6F6F4] p-3 text-xs space-y-2 mb-4">
                <div className="bg-white rounded-xl px-3 py-2">{t.comment}</div>
                <div className="bg-[#111] text-white rounded-xl px-3 py-2">
                  {t.reply}
                  <div className="mt-2 inline-flex bg-white/15 rounded-lg px-2 py-1">{t.cta} →</div>
                </div>
              </div>
              <button
                onClick={() => navigate(connected ? `/automation?new=1&template=${encodeURIComponent(t.title)}` : "/connect-instagram")}
                className="w-full bg-black text-white font-bold py-2.5 rounded-xl text-sm"
              >
                Use template
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg mb-4">Performance snapshot</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["DMs SENT", "0"],
            ["LINK CLICKS", "0"],
            ["LEADS COLLECTED", "0"],
            ["TOTAL FOLLOWERS", primary?.followersCount ? primary.followersCount.toLocaleString() : "0"],
          ].map(([k, v]) => (
            <div key={k} className="bg-white rounded-2xl p-4 border border-black/5">
              <p className="text-[10px] font-bold text-black/40 tracking-widest">{k}</p>
              <p className="text-2xl font-bold mt-1">{v}</p>
              <p className="text-xs text-black/35 mt-1">0% last 7 days</p>
            </div>
          ))}
        </div>
      </section>

      {!connected && (
        <button
          onClick={() => navigate("/connect-instagram")}
          className="fixed bottom-6 right-6 bg-[#D4FF00] text-black font-bold px-5 py-3 rounded-full shadow-lg flex items-center gap-2"
        >
          <Plus className="size-4" /> Connect Instagram
        </button>
      )}
    </div>
  );
}
