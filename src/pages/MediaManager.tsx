import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  RotateCw,
  Image as ImageIcon,
  Play,
  Zap,
  Plus,
  Loader2,
  ChevronDown,
  Instagram,
  Heart,
  MessageCircle,
  ChevronRight,
  Film,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { persistIgAccount, useIgAccounts } from '../lib/igAccounts';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

type MediaKind = 'ALL' | 'POST' | 'REEL' | 'VIDEO' | 'CAROUSEL';

interface IGMEDIA {
  id: string;
  media_type: string;
  kind: 'POST' | 'REEL' | 'VIDEO' | 'CAROUSEL';
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  ruleCount?: number;
}

interface Account {
  id: string;
  instagramId: string;
  username: string;
  pageAccessToken: string;
  tokenExpiresAt?: string;
  profilePicture: string;
}

function MediaBadge({ kind }: { kind: IGMEDIA['kind'] }) {
  if (kind === 'REEL')
    return (
      <span className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
        <Film className="size-3" /> Reel
      </span>
    );
  if (kind === 'VIDEO')
    return (
      <span className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
        <Play className="size-3 fill-white" /> Video
      </span>
    );
  if (kind === 'CAROUSEL')
    return (
      <span className="absolute top-3 left-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
        <ImageIcon className="size-3" /> Album
      </span>
    );
  return null;
}

export default function MediaManager() {
  const { user } = useAuth();
  const { accounts: ctxAccounts, primary, loading: ctxLoading } = useIgAccounts();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [media, setMedia] = useState<IGMEDIA[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MediaKind>('ALL');
  const [nextCursor, setNextCursor] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [accountDropOpen, setAccountDropOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fromCtx = ctxAccounts.map((a) => ({
      id: a.id,
      instagramId: a.instagramId,
      username: a.username,
      pageAccessToken: a.pageAccessToken,
      tokenExpiresAt: a.tokenExpiresAt,
      profilePicture: a.profilePicture || '',
    }));
    setAccounts(fromCtx);
    if (fromCtx.length > 0 && !selectedAccountId) {
      setSelectedAccountId(fromCtx[0].instagramId || fromCtx[0].id);
    }
  }, [ctxAccounts, selectedAccountId]);

  const getAccount = useCallback(() => {
    return (
      accounts.find((a) => a.instagramId === selectedAccountId || a.id === selectedAccountId) ||
      (primary
        ? {
            id: primary.id,
            instagramId: primary.instagramId,
            username: primary.username,
            pageAccessToken: primary.pageAccessToken,
            tokenExpiresAt: primary.tokenExpiresAt,
            profilePicture: primary.profilePicture || '',
          }
        : null)
    );
  }, [accounts, selectedAccountId, primary]);

  const enrichWithRules = useCallback(
    async (items: IGMEDIA[], accountId: string) => {
      if (!user?.uid) return items;
      return Promise.all(
        items.map(async (item) => {
          try {
            const rulesRef = collection(db, `users/${user.uid}/accounts/${accountId}/rules`);
            const q = query(rulesRef, where('mediaId', '==', item.id));
            const snapshot = await getDocs(q);
            return { ...item, ruleCount: snapshot.size };
          } catch {
            return { ...item, ruleCount: 0 };
          }
        })
      );
    },
    [user]
  );

  const fetchMedia = useCallback(
    async (cursor = '', append = false) => {
      const account = getAccount();
      if (!account?.pageAccessToken) return;

      append ? setLoadingMore(true) : setLoading(true);
      if (!append) setFetchError('');

      try {
        const res = await axios.post(
          '/api/ig/media',
          {
            accessToken: account.pageAccessToken,
            igUserId: account.instagramId || '',
            tokenExpiresAt: account.tokenExpiresAt || '',
            after: cursor,
            limit: 25,
          },
          { timeout: 25000 }
        );

        if (res.data.refreshedToken && user?.uid) {
          await persistIgAccount(user.uid, res.data.refreshedToken, account.instagramId || account.id, {
            expiresIn: Number(res.data.expiresIn || 0) || undefined,
            tokenType: 'long-lived',
          });
        }

        const rawList: IGMEDIA[] = res.data.data || [];

        if (res.data.expired || res.data.code === 190) {
          setFetchError('expired');
        } else if (res.data.error) {
          setFetchError(typeof res.data.error === 'string' ? res.data.error : JSON.stringify(res.data.details || res.data.error));
        }

        const enriched = await enrichWithRules(rawList, account.id);
        setMedia((prev) => (append ? [...prev, ...enriched] : enriched));
        setNextCursor(res.data.nextCursor || '');
        setHasMore(Boolean(res.data.hasMore));
      } catch (e) {
        if (!append) {
          setFetchError(
            axios.isAxiosError(e) ? JSON.stringify(e.response?.data || e.message) : 'Could not load posts and reels.'
          );
          setMedia([]);
        }
      } finally {
        append ? setLoadingMore(false) : setLoading(false);
      }
    },
    [getAccount, user, enrichWithRules]
  );

  useEffect(() => {
    if (selectedAccountId && accounts.length) {
      setMedia([]);
      setNextCursor('');
      setHasMore(false);
      void fetchMedia();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccountId, accounts.length]);

  const selectedAccount =
    accounts.find((a) => a.instagramId === selectedAccountId || a.id === selectedAccountId) || accounts[0];

  const filteredMedia = media.filter((m) => {
    const matchesFilter = filter === 'ALL' || m.kind === filter;
    const matchesSearch =
      (m.caption || '').toLowerCase().includes(search.toLowerCase()) || m.id.includes(search);
    return matchesFilter && matchesSearch;
  });

  const counts = {
    ALL: media.length,
    POST: media.filter((m) => m.kind === 'POST').length,
    REEL: media.filter((m) => m.kind === 'REEL').length,
    VIDEO: media.filter((m) => m.kind === 'VIDEO').length,
    CAROUSEL: media.filter((m) => m.kind === 'CAROUSEL').length,
  };

  if (ctxLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="size-8 text-black/30 animate-spin" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="py-24 text-center space-y-6">
        <div className="size-20 rounded-[2.5rem] flex items-center justify-center mx-auto bg-black/5">
          <Instagram className="size-10 text-black/20" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">No accounts linked</h2>
          <p className="text-black/50 text-sm max-w-xs mx-auto">Connect an Instagram Business account to see your posts and reels.</p>
        </div>
        <button
          onClick={() => navigate('/connect-instagram')}
          className="bg-black text-white px-8 py-3 rounded-2xl font-bold hover:bg-black/80 transition-colors"
        >
          Connect Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Posts & Reels</h1>
          <p className="text-black/45 text-sm mt-0.5">Pick a post to set up comment automation</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Account picker */}
          <div className="relative">
            <button
              onClick={() => setAccountDropOpen(!accountDropOpen)}
              className="flex items-center gap-2 bg-white border border-black/10 px-3 py-2 rounded-xl hover:bg-black/5 transition-all text-sm font-medium text-black"
            >
              {selectedAccount?.profilePicture && (
                <img src={selectedAccount.profilePicture} className="size-5 rounded-full object-cover" alt="" />
              )}
              @{selectedAccount?.username}
              <ChevronDown className={cn('size-4 transition-transform text-black/40', accountDropOpen && 'rotate-180')} />
            </button>
            <AnimatePresence>
              {accountDropOpen && accounts.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute top-full mt-2 left-0 w-52 bg-white rounded-2xl border border-black/10 shadow-xl z-20 overflow-hidden"
                >
                  {accounts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedAccountId(a.instagramId || a.id);
                        setAccountDropOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 text-sm text-left"
                    >
                      {a.profilePicture && <img src={a.profilePicture} className="size-6 rounded-full" alt="" />}
                      @{a.username}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-black/30" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white border border-black/10 text-black rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-black/30 transition-all w-44"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={() => fetchMedia()}
            disabled={loading}
            className="bg-white border border-black/10 p-2 rounded-xl hover:bg-black/5 transition-all disabled:opacity-40"
          >
            <RotateCw className={cn('size-4 text-black/60', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Error banners */}
      {fetchError === 'expired' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
          <p className="text-red-700 text-sm flex-1">Your Instagram session expired. Reconnect to restore access.</p>
          <button
            onClick={() => navigate('/connect-instagram')}
            className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap"
          >
            Reconnect Instagram
          </button>
        </div>
      )}
      {fetchError && fetchError !== 'expired' && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-2xl p-4">{fetchError}</p>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {(['ALL', 'POST', 'REEL', 'VIDEO', 'CAROUSEL'] as MediaKind[]).map((k) => {
          if (k !== 'ALL' && counts[k] === 0) return null;
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all',
                filter === k
                  ? 'bg-black text-white'
                  : 'bg-white border border-black/10 text-black/60 hover:bg-black/5'
              )}
            >
              {k === 'ALL' ? 'All' : k === 'CAROUSEL' ? 'Albums' : k.charAt(0) + k.slice(1).toLowerCase()}
              <span className={cn('ml-1.5 tabular-nums', filter === k ? 'text-white/60' : 'text-black/30')}>
                {counts[k]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <AnimatePresence mode="popLayout">
          {loading &&
            media.length === 0 &&
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-black/5 rounded-2xl animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}

          {filteredMedia.map((item, i) => (
            <motion.div
              layout
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-black/5 cursor-pointer"
              onClick={() => navigate(`/automation?mediaId=${item.id}&accountId=${selectedAccount?.id}`)}
            >
              <img
                src={item.media_url || item.thumbnail_url}
                alt=""
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              <MediaBadge kind={item.kind} />

              {/* Rule count badge */}
              {(item.ruleCount ?? 0) > 0 && (
                <span className="absolute top-3 right-3 bg-[#D4FF00] text-black text-[10px] font-black px-2 py-0.5 rounded-full">
                  {item.ruleCount} rule{(item.ruleCount ?? 0) > 1 ? 's' : ''}
                </span>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                {/* Stats row */}
                {((item.like_count ?? 0) > 0 || (item.comments_count ?? 0) > 0) && (
                  <div className="flex items-center gap-3 mb-3">
                    {(item.like_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-white/80 text-[11px]">
                        <Heart className="size-3 fill-white" /> {item.like_count}
                      </span>
                    )}
                    {(item.comments_count ?? 0) > 0 && (
                      <span className="flex items-center gap-1 text-white/80 text-[11px]">
                        <MessageCircle className="size-3" /> {item.comments_count}
                      </span>
                    )}
                  </div>
                )}

                {item.caption && (
                  <p className="text-white/70 text-[11px] line-clamp-2 leading-snug mb-3">{item.caption}</p>
                )}

                <button className="w-full bg-[#D4FF00] text-black py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                  <Zap className="size-3 fill-current" /> Automate
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => fetchMedia(nextCursor, true)}
            disabled={loadingMore}
            className="flex items-center gap-2 bg-white border border-black/10 px-6 py-3 rounded-2xl text-sm font-bold text-black hover:bg-black/5 transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                Load more <ChevronRight className="size-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Empty state */}
      {filteredMedia.length === 0 && !loading && (
        <div className="py-24 text-center">
          <div className="size-16 rounded-[1.5rem] mx-auto flex items-center justify-center bg-black/5 mb-5">
            <ImageIcon className="size-7 text-black/20" />
          </div>
          <h3 className="text-lg font-bold text-black">No media found</h3>
          <p className="text-black/40 text-sm mt-1">
            {search || filter !== 'ALL' ? 'Try adjusting your filters.' : 'Sync your account to pull in posts and reels.'}
          </p>
          {!search && filter === 'ALL' && (
            <button
              onClick={() => fetchMedia()}
              className="mt-4 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black/80 transition-colors"
            >
              Sync now
            </button>
          )}
        </div>
      )}

      {/* New automation CTA */}
      {media.length > 0 && !loading && (
        <div className="flex items-center justify-between bg-[#D4FF00]/20 border border-[#D4FF00]/40 rounded-2xl px-6 py-4">
          <div>
            <p className="text-sm font-bold text-black">Want to automate all posts at once?</p>
            <p className="text-xs text-black/50 mt-0.5">Create a rule that applies to every post and reel.</p>
          </div>
          <button
            onClick={() => navigate(`/automation?mediaId=all&accountId=${selectedAccount?.id}`)}
            className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap hover:bg-black/80 transition-colors"
          >
            <Plus className="size-4" /> All Posts Rule
          </button>
        </div>
      )}
    </div>
  );
}
