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

type IgAccount = {
  username: string;
  name: string;
  followers: string;
  posts: string | number;
  profilePic: string;
};

export default function ConnectInstagramPage() {
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
    const timer = setTimeout(() => {
      if (seq !== searchSeq.current) return;
      const suggestion = localAccountSuggestion(query);
      setIsSuggesting(false);
      setSuggestions(suggestion ? [suggestion] : []);
      setShowSuggestions(Boolean(suggestion));
    }, 200);

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
      <div className="text-center space-y-4 mb-12">
        <h1 className="text-4xl font-bold text-white tracking-tight">
          Connect your Creator or <br /> Business Instagram
        </h1>
        <p className="text-white/60 text-sm leading-relaxed max-w-md mx-auto">
          We'll connect through Meta official login - make sure you are logged in a
          Creator or Business account in the browser. <span className="text-white underline decoration-white/20 cursor-pointer hover:decoration-white transition-all">Need Help?</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-white tracking-wide">Your Instagram username</label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors z-10">@</div>
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
                "w-full bg-[#0A0A0B] border-2 rounded-2xl pl-10 pr-12 py-4 text-white focus:outline-none transition-all font-medium",
                step === 'ERROR' ? "border-red-500/50" :
                step === 'FOUND' ? "border-lime-400/50" :
                "border-white/10 focus:border-white"
              )}
            />
            {isSuggesting && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 animate-spin text-white/40" />
            )}

            <AnimatePresence>
              {showSuggestions && step !== 'FOUND' && suggestions.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-80 overflow-auto rounded-2xl border border-white/10 bg-[#111113] shadow-2xl"
                >
                  {suggestions.map((account) => (
                    <li key={account.username}>
                      <button
                        type="button"
                        onClick={() => selectAccount(account)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left"
                      >
                        <img
                          src={account.profilePic}
                          alt=""
                          className="size-10 rounded-xl object-cover bg-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{account.name}</p>
                          <p className="text-[11px] text-white/40 truncate">@{account.username}</p>
                        </div>
                        <span className="ml-auto text-[10px] text-white/30 shrink-0">
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
                  <h4 className="font-bold text-white text-sm">Can't find that account</h4>
                  <div className="space-y-1">
                    <p className="text-[11px] text-white/60">Most likely reasons:</p>
                    <p className="text-[11px] text-white font-medium">1. Typo in username</p>
                    <p className="text-[11px] text-white font-medium">2. You have a Personal account (need Business/Creator)</p>
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
                <button className="bg-white/5 border border-white/10 text-white text-[11px] font-bold px-5 py-2.5 rounded-xl hover:bg-white/10 transition-all font-sans">
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
              className="p-5 border-2 border-lime-400/50 rounded-2xl bg-lime-400/5"
            >
              <div className="flex items-center gap-4">
                <div className="size-5 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-5 text-lime-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm">Account found</h4>
                  <div className="flex items-center gap-4 mt-3 p-3 bg-black/40 rounded-xl border border-white/5">
                    <img src={foundAccount.profilePic} className="size-12 rounded-xl object-cover shrink-0" alt="" />
                    <div>
                      <p className="text-white font-bold text-sm">{foundAccount.name}</p>
                      <p className="text-white/40 text-[10px]">@{foundAccount.username}</p>
                      <p className="text-white/60 text-[10px] mt-0.5">{foundAccount.followers} followers • {foundAccount.posts} posts</p>
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
              className="w-full bg-lime-400 text-black py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2"
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
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {step === 'SEARCHING' ? <Loader2 className="size-4 animate-spin" /> : null}
              Find account
            </button>
          )}
        </div>
      </div>

      <div className="mt-12 p-6 bg-white/5 border border-white/5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-indigo-400">
           <HelpCircle className="size-4" />
           <p className="text-[10px] font-black uppercase tracking-widest">How it works</p>
        </div>
        <div className="grid gap-4">
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
            <div>
              <p className="text-xs text-white font-bold">Search your account</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed italic">Type a username to see matching account suggestions, then confirm it.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
            <div>
              <p className="text-xs text-white font-bold">Meta Official Auth</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed italic">Login securely via Meta. We only use official Graph APIs to sync your comments & media.</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="size-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
            <div>
              <p className="text-xs text-white font-bold">Launch Automation</p>
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed italic">Your media will appear in the manager. Toggle automation and set your keywords!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
