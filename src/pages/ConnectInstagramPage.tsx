import React, { useState } from 'react';
import { 
  Instagram, 
  Search, 
  XCircle, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import axios from 'axios';

interface ConnectInstagramProps {
  onSuccess: (token: string) => void;
}

export default function ConnectInstagram({ onSuccess }: ConnectInstagramProps) {
  const [step, setStep] = useState<'IDLE' | 'SEARCHING' | 'FOUND' | 'ERROR'>('IDLE');
  const [username, setUsername] = useState('');
  const [foundAccount, setFoundAccount] = useState<any>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const handleFindAccount = async () => {
    if (!username) return;
    setStep('SEARCHING');
    
    // Simulate finding account to match the user's flow in screenshots
    // In a real production app, you might check if this username is a known business account
    // or has been previously connected.
    setTimeout(() => {
      // Mocking account "boostuppmedia" from screenshot for demo purposes
      if (username.toLowerCase().includes('boostupp')) {
        setFoundAccount({
          username: 'boostuppmedia',
          name: 'Boostupp media',
          followers: '66.6K',
          posts: 10,
          profilePic: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=128&h=128&fit=crop'
        });
        setStep('FOUND');
      } else {
        setStep('ERROR');
      }
    }, 1500);
  };

const handleOAuth = async () => {
  setIsOAuthLoading(true);

  try {

    const res = await axios.get(
      "http://localhost:3000/api/auth/ig/url"
    );

    const { url } = res.data;

    console.log("AUTH URL:", url);

    if (!url) {
      alert("OAuth URL missing");
      return;
    }

    const authWindow = window.open(
      url,
      "ig_auth",
      "width=600,height=800"
    );

    const handleMessage = (event: MessageEvent) => {

      if (event.data?.type === "IG_AUTH_SUCCESS") {

        const { token } = event.data;

        console.log("INSTAGRAM TOKEN:", token);

        onSuccess(token);

        setIsOAuthLoading(false);

        window.removeEventListener(
          "message",
          handleMessage
        );

        alert("Instagram Connected ✅");
      }
    };

    window.addEventListener(
      "message",
      handleMessage
    );

  } catch (error) {

    console.error("IG Auth Error:", error);

    alert("Failed to start Instagram connection.");

    setIsOAuthLoading(false);
  }
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
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors">@</div>
            <input 
              type="text" 
              placeholder="your_username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (step !== 'IDLE') setStep('IDLE');
              }}
              className={cn(
                "w-full bg-[#0A0A0B] border-2 rounded-2xl pl-10 pr-6 py-4 text-white focus:outline-none transition-all font-medium",
                step === 'ERROR' ? "border-red-500/50" : 
                step === 'FOUND' ? "border-lime-400/50" : 
                "border-white/10 focus:border-white"
              )}
            />
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
                  <Instagram className="size-4" /> Sign in as @{foundAccount.username}
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
              <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed italic">Enter your username so we can verify if your account is eligible for automation.</p>
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
