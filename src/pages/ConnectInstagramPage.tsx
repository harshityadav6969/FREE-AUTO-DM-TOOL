import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Instagram,
  XCircle,
  CheckCircle2,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { buildIgAuthUrl, localAccountSuggestion } from '../lib/instagram';
import { useIgAccounts } from '../lib/igAccounts';
import axios from 'axios';

type IgAccount = {
  username: string;
  name: string;
  followers: string;
  posts: string | number;
  profilePic: string;
};

export default function ConnectInstagramPage() {
  const { primary, connected, disconnectAccount } = useIgAccounts();
  const [disconnecting, setDisconnecting] = useState(false);
  const [step, setStep] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'ERROR'>('IDLE');
  const [username, setUsername] = useState('');
  const [foundAccount, setFoundAccount] = useState<IgAccount | null>(null);
  const [suggestions, setSuggestions] = useState<IgAccount[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchSeq = useRef(0);

  const query = useMemo(
    () => username.trim().replace(/^@+/, ''),
    [username]
  );

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggesting(false);
      return;
    }

    const seq = ++searchSeq.current;
    setIsSuggesting(true);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get("/api/ig/search", {
          params: {
            q: query,
            accessToken: primary?.pageAccessToken || "",
            igUserId: primary?.instagramId || "",
          },
        });
        if (seq !== searchSeq.current) return;
        const accounts = res.data?.accounts?.length
          ? res.data.accounts
          : localAccountSuggestion(query)
            ? [localAccountSuggestion(query)]
            : [];
        setSuggestions(accounts);
        setShowSuggestions(accounts.length > 0);
      } catch {
        if (seq !== searchSeq.current) return;
        const suggestion = localAccountSuggestion(query);
        setSuggestions(suggestion ? [suggestion] : []);
        setShowSuggestions(Boolean(suggestion));
      } finally {
        if (seq === searchSeq.current) setIsSuggesting(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const selectAccount = (account: IgAccount) => {
    setUsername(account.username);
    setFoundAccount(account);
    setStep('FOUND');
    setShowSuggestions(false);
  };

  const handleFindAccount = async () => {
    if (!query) return;
    setStep('SEARCHING');
    setShowSuggestions(false);

    const suggestion = localAccountSuggestion(query);
    if (suggestion) {
      selectAccount(suggestion);
      return;
    }
    setStep('ERROR');
  };

  const handleOAuth = async () => {
    setIsOAuthLoading(true);
    window.location.href = buildIgAuthUrl();
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-6">
      {connected ? (
        <div className="mb-8 p-5 rounded-3xl border border-black/10 bg-white flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-bold text-black">Connected as @{primary?.username || "instagram"}</p>
            <p className="text-xs text-black/50 mt-1">Disconnect to remove the saved token, then connect again for a fresh 60-day login.</p>
          </div>
          <button
            type="button"
            disabled={disconnecting}
            onClick={async () => {
              if (!window.confirm("Disconnect this Instagram account from InstaFlow?")) return;
              setDisconnecting(true);
              try {
                await disconnectAccount(primary?.id);
              } finally {
                setDisconnecting(false);
              }
            }}
            className="bg-black text-white font-bold px-4 py-2.5 rounded-xl text-sm"
          >
            {disconnecting ? "Disconnecting…" : "Disconnect Instagram"}
          </button>
        </div>
      ) : null}

      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-black text-black tracking-tight">
          Connect your Instagram <br /> Business account
        </h1>
        <p className="text-black/60 text-sm leading-relaxed max-w-md mx-auto">
          We'll connect through Meta official login — make sure you are logged into an
          Instagram Business or Professional account in the browser. <span className="text-black underline decoration-black/20 cursor-pointer hover:decoration-black transition-all">Need Help?</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-black tracking-wide">Your Instagram username</label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors z-10">@</div>
            <input
              type="text"
              placeholder="your_username"
              value={username}
              autoComplete="off"
              onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
              onChange={(e) => {
                setUsername(e.target.value);
                if (step !== 'IDLE') setStep('IDLE');
                setFoundAccount(null);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFindAccount();
              }}
              className={cn(
                "w-full bg-white border-2 rounded-2xl pl-10 pr-12 py-4 text-black placeholder:text-black/30 focus:outline-none transition-all font-medium",
                step === 'ERROR' ? "border-red-500/50" :
                step === 'FOUND' ? "border-[#D4FF00]" :
                "border-black/10 focus:border-black"
              )}
            />
            {isSuggesting && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 animate-spin text-black/40" />
            )}

            <AnimatePresence>
              {showSuggestions && step !== 'FOUND' && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-80 overflow-auto rounded-2xl border border-black/10 bg-white shadow-2xl"
                >
                  {suggestions.map((account) => (
                    <li key={account.username}>
                      <button
                        type="button"
                        onClick={() => selectAccount(account)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 text-left"
                      >
                        <img
                          src={account.profilePic}
                          alt=""
                          className="size-10 rounded-xl object-cover bg-black/5"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-black truncate">{account.name}</p>
                          <p className="text-[11px] text-black/40 truncate">@{account.username}</p>
                        </div>
                        <span className="ml-auto text-[10px] text-black/30 shrink-0">
                          {account.followers} followers
                        </span>
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'ERROR' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 border-2 border-red-500/50 rounded-2xl bg-red-500/5 space-y-4"
            >
              <div className="flex items-start gap-4">
                <XCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-bold text-black text-sm">Can't find that account</h4>
                  <div className="space-y-1">
                    <p className="text-[11px] text-black/60">Most likely reasons:</p>
                    <p className="text-[11px] text-black font-medium">1. Typo in username</p>
                    <p className="text-[11px] text-black font-medium">2. You have a Personal account (need Business or Professional)</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('IDLE')}
                  className="bg-red-500 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl hover:bg-red-600 transition-all font-sans"
                >
                  Try again
                </button>
                <button className="bg-black/5 border border-black/10 text-black text-[11px] font-bold px-5 py-2.5 rounded-xl hover:bg-black/10 transition-all font-sans">
                  Switch account type
                </button>
              </div>
            </motion.div>
          )}

          {step === 'FOUND' && foundAccount && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 border-2 border-[#D4FF00] rounded-2xl bg-[#D4FF00]/10"
            >
              <div className="flex items-center gap-4">
                <div className="size-5 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5 text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-black text-sm">Account found</h4>
                  <div className="flex items-center gap-4 mt-3 p-3 bg-white rounded-xl border border-black/10">
                    <img src={foundAccount.profilePic} className="size-12 rounded-xl object-cover shrink-0" alt="" />
                    <div>
                      <p className="text-black font-bold text-sm">{foundAccount.name}</p>
                      <p className="text-black/40 text-[10px]">@{foundAccount.username}</p>
                      <p className="text-black/60 text-[10px] mt-0.5">{foundAccount.followers} followers • {foundAccount.posts} posts</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 space-y-4">
          {step === 'FOUND' ? (
            <button
              onClick={handleOAuth}
              disabled={isOAuthLoading}
              className="w-full bg-[#D4FF00] text-black py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#c6f000] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isOAuthLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <>
                  <Instagram className="size-4" /> Sign in as @{foundAccount?.username}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleFindAccount}
              disabled={step === 'SEARCHING' || !username}
              className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 'SEARCHING' ? <Loader2 className="size-4 animate-spin" /> : null}
              Find account
            </button>
          )}
        </div>
      </div>

      <div className="mt-12 p-6 bg-white border border-black/5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-black">
           <HelpCircle className="size-4" />
           <p className="text-[10px] font-black uppercase tracking-widest">How it works</p>
        </div>
        <div className="grid gap-4">
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-[#D4FF00] text-black flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
            <div>
              <p className="text-xs text-black font-bold">Search your account</p>
              <p className="text-[10px] text-black/50 mt-0.5 leading-relaxed italic">Enter your username. We'll search for your account on InstaFlow.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-[#D4FF00] text-black flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
            <div>
              <p className="text-xs text-black font-bold">Meta Official Auth</p>
              <p className="text-[10px] text-black/50 mt-0.5 leading-relaxed italic">Login securely via Meta. We only use official Graph APIs to sync your comments & media.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-[#D4FF00] text-black flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
            <div>
              <p className="text-xs text-black font-bold">Launch Automation</p>
              <p className="text-[10px] text-black/50 mt-0.5 leading-relaxed italic">Your media will appear in the manager. Toggle automation and set your keywords!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
