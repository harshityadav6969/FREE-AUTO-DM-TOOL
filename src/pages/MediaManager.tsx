import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RotateCw, 
  Filter, 
  Image as ImageIcon, 
  Play, 
  Zap,
  MoreVertical,
  Plus,
  Loader2,
  ChevronDown,
  Instagram
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

interface IGMEDIA {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'REEL' | 'CAROUSEL_ALBUM' | 'VIDEO';
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  timestamp: string;
  permalink: string;
  ruleCount?: number;
}

interface Account {
  id: string;
  instagramId: string;
  username: string;
  pageAccessToken: string;
  profilePicture: string;
}

export default function MediaManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [media, setMedia] = useState<IGMEDIA[]>([]);
  const [loading, setLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // 1. Fetch connected accounts
  useEffect(() => {
    if (!user) return;
    const q = collection(db, `users/${user.uid}/accounts`);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
      setAccounts(activeAccounts);
      if (activeAccounts.length > 0 && !selectedAccountId) {
        setSelectedAccountId(activeAccounts[0].instagramId);
      }
      setAccountsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // 2. Fetch media when account changes
  useEffect(() => {
    if (selectedAccountId) {
      fetchMedia();
    }
  }, [selectedAccountId]);

  const fetchMedia = async () => {
    const account = accounts.find(a => a.instagramId === selectedAccountId);
    if (!account) return;

    setLoading(true);
    try {
      const res = await axios.get('/api/ig/media', {
        params: {
          accessToken: account.pageAccessToken,
          igUserId: account.instagramId || "",
        }
      });
      
      const mediaList = res.data.data || [];
      const mediaWithRules = await Promise.all(mediaList.map(async (item: IGMEDIA) => {
        try {
          const rulesRef = collection(db, `users/${user?.uid}/accounts/${account.id}/rules`);
          const q = query(rulesRef, where("mediaId", "==", item.id));
          const snapshot = await getDocs(q);
          return { ...item, ruleCount: snapshot.size, media_url: item.media_url };
        } catch {
          return { ...item, ruleCount: 0 };
        }
      }));

      setMedia(mediaWithRules);
    } catch (e) {
      console.error("Fetch Media Error:", e);
    }
    setLoading(false);
  };

  const filteredMedia = media.filter(m => 
    (m.caption || '').toLowerCase().includes(search.toLowerCase()) || 
    m.id.includes(search)
  );

  const selectedAccount = accounts.find(a => a.instagramId === selectedAccountId);

  if (accountsLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="size-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-20 text-center space-y-6">
        <div className="bg-white/5 size-20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-white/5">
          <Instagram className="size-10 text-white/10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">No accounts linked</h2>
          <p className="text-black/50 text-sm max-w-xs mx-auto">Please connect an Instagram Business account first.</p>
        </div>
        <button 
          onClick={() => navigate('/connect-instagram')}
          className="bg-[#D4FF00] text-black px-8 py-3 rounded-2xl font-bold"
        >
          Go to Connect Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Media Manager</h1>
          <div className="flex items-center gap-3">
             <div className="relative">
                <button 
                  className="flex items-center gap-2 bg-white border border-black/10 px-3 py-1.5 rounded-xl hover:bg-black/5 transition-all text-xs font-bold text-black/70"
                >
                  <img src={selectedAccount?.profilePicture} className="size-4 rounded-full" alt="" />
                  @{selectedAccount?.username}
                  <ChevronDown className="size-3" />
                </button>
                {/* Account Switcher Dropdown could go here */}
             </div>
             <div className="size-1 rounded-full bg-black/20" />
             <p className="text-black/40 text-[10px] font-bold uppercase tracking-widest">
               {media.length} Posts Synced
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-black/30 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-black/10 text-black rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-black transition-all w-full sm:w-64"
              />
           </div>
           <button 
             onClick={fetchMedia}
             disabled={loading}
             className="bg-[#161618] border border-white/5 p-3 rounded-2xl hover:bg-white/10 text-white/60 transition-all active:rotate-180 disabled:opacity-50 shrink-0 shadow-lg"
           >
              <RotateCw className={cn("size-5", loading && "animate-spin")} />
           </button>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        <AnimatePresence mode="popLayout">
          {filteredMedia.map((item, i) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#161618] rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-indigo-500/20 transition-all flex flex-col shadow-2xl"
            >
              <div className="aspect-square relative overflow-hidden bg-black/20">
                 <img 
                   src={item.media_url || item.thumbnail_url} 
                   alt="" 
                   className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                 />
                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[10px] font-black text-white/90 uppercase tracking-widest border border-white/10">
                    {item.media_type === 'VIDEO' ? <Play className="size-3 fill-white" /> : <ImageIcon className="size-3" />}
                    {item.media_type === 'VIDEO' ? 'REEL' : item.media_type}
                 </div>
                 
                 <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end p-6">
                    <button 
                      onClick={() => navigate(`/automation?mediaId=${item.id}&accountId=${selectedAccount?.id}`)}
                      className="w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-lime-400 active:scale-95 transition-all shadow-2xl"
                    >
                       <Zap className="size-3 fill-current" /> Setup Automation
                    </button>
                 </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                       <div className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                       <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Active Post</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="bg-indigo-500/10 px-3 py-1 rounded-lg border border-indigo-500/10">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{item.ruleCount} Rules</p>
                       </div>
                    </div>
                 </div>
                 <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed italic font-medium">
                    {item.caption || "No caption provided."}
                 </p>
              </div>
            </motion.div>
          ))}
          
          {loading && media.length === 0 && (
             Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-[2.5rem] animate-pulse border border-white/5" />
             ))
          )}

          {filteredMedia.length === 0 && !loading && (
             <div className="col-span-full py-40 text-center">
                <div className="bg-white/5 size-20 rounded-[2.5rem] mx-auto flex items-center justify-center mb-6 border border-white/5">
                   <Filter className="size-8 text-black/20" />
                </div>
                <h3 className="text-xl font-bold text-black">No media found</h3>
                <p className="text-black/40 text-sm mt-1">Try syncing your account or clearing filters.</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
