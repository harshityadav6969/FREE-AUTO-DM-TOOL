import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Trash2,
  Link as LinkIcon,
  UserCheck,
  Clock,
  X,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  Play,
  Film,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useIgAccounts } from '../lib/igAccounts';
import { db } from '../lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore';
import axios from 'axios';

interface Rule {
  id: string;
  triggerKeyword: string;
  resource: string;
  requireFollow: boolean;
  isActive: boolean;
  delay: number;
  mediaId?: string | null;
}

interface PostPreview {
  id: string;
  kind: 'POST' | 'REEL' | 'VIDEO' | 'CAROUSEL';
  media_url: string;
  thumbnail_url?: string;
  caption: string;
  permalink: string;
}

function KindBadge({ kind }: { kind: PostPreview['kind'] }) {
  if (kind === 'REEL') return <><Film className="size-3" /> Reel</>;
  if (kind === 'VIDEO') return <><Play className="size-3 fill-current" /> Video</>;
  if (kind === 'CAROUSEL') return <><ImageIcon className="size-3" /> Album</>;
  return <><ImageIcon className="size-3" /> Post</>;
}

export default function FlowBuilder() {
  const { user } = useAuth();
  const { primary } = useIgAccounts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get('mediaId');
  const accountId = searchParams.get('accountId') || primary?.id || '';

  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [postPreview, setPostPreview] = useState<PostPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [resource, setResource] = useState('');
  const [requireFollow, setRequireFollow] = useState(true);

  // Fetch post preview when a specific mediaId is given
  useEffect(() => {
    if (!mediaId || mediaId === 'all' || !primary?.pageAccessToken) return;
    setPreviewLoading(true);
    axios
      .post(
        '/api/ig/media',
        {
          accessToken: primary.pageAccessToken,
          igUserId: primary.instagramId || '',
          tokenExpiresAt: primary.tokenExpiresAt || '',
          limit: 25,
        },
        { timeout: 25000 }
      )
      .then((res) => {
        const found = (res.data.data || []).find((m: any) => m.id === mediaId);
        if (found) setPostPreview(found as PostPreview);
      })
      .catch(() => {})
      .finally(() => setPreviewLoading(false));
  }, [mediaId, primary]);

  useEffect(() => {
    if (!user || !accountId) {
      setLoading(false);
      return;
    }

    const rulesRef = collection(db, `users/${user.uid}/accounts/${accountId}/rules`);
    let q = query(rulesRef);
    if (mediaId && mediaId !== 'all') {
      q = query(rulesRef, where('mediaId', '==', mediaId));
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRules(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Rule)));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, [user, accountId, mediaId]);

  const handleCreateRule = async () => {
    if (!user || !accountId || !triggerKeyword || !resource) return;
    setIsSaving(true);
    try {
      const rulesRef = collection(db, `users/${user.uid}/accounts/${accountId}/rules`);
      await addDoc(rulesRef, {
        triggerKeyword: triggerKeyword.toUpperCase(),
        resource,
        requireFollow,
        isActive: true,
        delay: 0,
        mediaId: mediaId === 'all' ? null : mediaId,
        createdAt: serverTimestamp(),
      });
      setIsModalOpen(false);
      setTriggerKeyword('');
      setResource('');
    } catch {
      alert('Failed to save rule.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (rule: Rule) => {
    if (!user || !accountId) return;
    const ruleRef = doc(db, `users/${user.uid}/accounts/${accountId}/rules`, rule.id);
    await updateDoc(ruleRef, { isActive: !rule.isActive }).catch(() => {});
  };

  const deleteRule = async (id: string) => {
    if (!user || !accountId || !confirm('Delete this rule?')) return;
    const ruleRef = doc(db, `users/${user.uid}/accounts/${accountId}/rules`, id);
    await deleteDoc(ruleRef).catch(() => {});
  };

  if (!accountId) {
    return (
      <div className="py-20 text-center space-y-6">
        <h2 className="text-2xl font-bold">Connect Instagram first</h2>
        <p className="text-black/50 text-sm">Automations need a connected Instagram Business account.</p>
        <button
          onClick={() => navigate('/connect-instagram')}
          className="bg-black text-white px-8 py-3 rounded-2xl font-bold"
        >
          Connect Instagram
        </button>
      </div>
    );
  }

  const scopeLabel =
    !mediaId || mediaId === 'all'
      ? 'All posts & reels'
      : postPreview
        ? null
        : `Post ${mediaId.slice(0, 8)}…`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/media')}
            className="mt-1 p-2 rounded-xl hover:bg-black/5 transition-colors text-black/50 hover:text-black shrink-0"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-black tracking-tight">Automation Rules</h1>
            <p className="text-black/45 text-sm mt-0.5">
              {scopeLabel || (postPreview ? `For: ${postPreview.caption?.slice(0, 60) || 'this post'}` : 'Loading post…')}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-black/80 transition-colors whitespace-nowrap"
        >
          <Plus className="size-4" /> New Rule
        </button>
      </div>

      {/* Post preview card */}
      {mediaId && mediaId !== 'all' && (
        <div className="bg-white border border-black/10 rounded-2xl p-4 flex items-center gap-4">
          {previewLoading ? (
            <div className="size-14 rounded-xl bg-black/5 animate-pulse shrink-0" />
          ) : postPreview ? (
            <div className="relative shrink-0">
              <img
                src={postPreview.media_url || postPreview.thumbnail_url}
                alt=""
                className="size-14 rounded-xl object-cover"
              />
              <span className="absolute -bottom-1.5 -right-1.5 flex items-center gap-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full">
                <KindBadge kind={postPreview.kind} />
              </span>
            </div>
          ) : (
            <div className="size-14 rounded-xl bg-black/5 flex items-center justify-center shrink-0">
              <ImageIcon className="size-5 text-black/20" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-black line-clamp-2 leading-snug">
              {postPreview?.caption || 'Post preview'}
            </p>
            {postPreview?.permalink && (
              <a
                href={postPreview.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-black/40 hover:text-black flex items-center gap-1 mt-1"
              >
                View on Instagram <ChevronRight className="size-3" />
              </a>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-2xl font-black text-black">{rules.length}</p>
            <p className="text-[10px] text-black/40 uppercase tracking-wider font-bold">Rule{rules.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* How it works hint */}
      {rules.length === 0 && !loading && (
        <div className="bg-[#D4FF00]/20 border border-[#D4FF00]/50 rounded-2xl p-5">
          <p className="text-sm font-bold text-black mb-2">How it works</p>
          <ol className="text-sm text-black/60 space-y-1 list-none">
            {[
              'Someone comments a keyword on your post',
              'Instagram sends them a DM with your resource link',
              'Optionally require them to follow you first',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="shrink-0 size-5 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Rules list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-black/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {rules.map((rule, i) => (
              <motion.div
                layout
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white border border-black/10 rounded-2xl p-5 flex items-center gap-5 hover:border-black/20 transition-colors"
              >
                <div
                  className={cn(
                    'size-9 rounded-xl flex items-center justify-center shrink-0',
                    rule.isActive ? 'bg-[#D4FF00]' : 'bg-black/5'
                  )}
                >
                  <Zap className={cn('size-4', rule.isActive ? 'fill-black text-black' : 'text-black/30')} />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Keyword</p>
                    <span className="bg-black/5 px-2.5 py-1 rounded-lg text-sm font-bold font-mono">
                      "{rule.triggerKeyword}"
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1">Sends link</p>
                    <div className="flex items-center gap-1.5 text-black/70">
                      <LinkIcon className="size-3 shrink-0" />
                      <a
                        href={rule.resource}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm truncate underline underline-offset-2 hover:text-black"
                      >
                        {rule.resource}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {rule.requireFollow && (
                    <div title="Requires follow" className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <UserCheck className="size-3.5 text-emerald-600" />
                    </div>
                  )}
                  {rule.delay > 0 && (
                    <div title={`${rule.delay}s delay`} className="size-7 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Clock className="size-3.5 text-amber-600" />
                    </div>
                  )}
                  <button
                    onClick={() => toggleRule(rule)}
                    className={cn(
                      'w-10 h-5 rounded-full relative transition-colors p-0.5',
                      rule.isActive ? 'bg-black' : 'bg-black/15'
                    )}
                    aria-label={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    <div
                      className={cn(
                        'size-4 bg-white rounded-full transition-transform shadow-sm',
                        rule.isActive && 'translate-x-5'
                      )}
                    />
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-2 text-black/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create Rule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="bg-white w-full max-w-md rounded-3xl p-7 relative z-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-black">New Rule</h2>
                  <p className="text-xs text-black/40 mt-0.5">
                    {!mediaId || mediaId === 'all' ? 'Applies to all posts' : 'Applies to this post'}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl text-black/30 hover:text-black hover:bg-black/5 transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-black/60 block mb-2">
                    Trigger keyword
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LINK, INFO, FREE"
                    value={triggerKeyword}
                    onChange={(e) => setTriggerKeyword(e.target.value)}
                    className="w-full bg-black/[0.04] border border-black/10 rounded-xl px-4 py-3 text-black font-mono font-bold focus:outline-none focus:border-black/30 transition-colors placeholder:font-normal placeholder:font-sans"
                  />
                  <p className="text-[11px] text-black/35 mt-1.5">
                    When someone comments this word, they'll receive your link.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-bold text-black/60 block mb-2">
                    Resource URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://your-link.com"
                    value={resource}
                    onChange={(e) => setResource(e.target.value)}
                    className="w-full bg-black/[0.04] border border-black/10 rounded-xl px-4 py-3 text-black focus:outline-none focus:border-black/30 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-black/[0.03] rounded-2xl border border-black/8">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <UserCheck className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-black">Require follow</p>
                      <p className="text-[11px] text-black/40">Only DM people who follow you</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRequireFollow(!requireFollow)}
                    className={cn(
                      'w-10 h-5 rounded-full relative p-0.5 transition-colors',
                      requireFollow ? 'bg-black' : 'bg-black/15'
                    )}
                  >
                    <div
                      className={cn(
                        'size-4 bg-white rounded-full transition-transform shadow-sm',
                        requireFollow && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>

                <button
                  onClick={handleCreateRule}
                  disabled={isSaving || !triggerKeyword || !resource}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-sm hover:bg-black/80 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Create Rule
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
