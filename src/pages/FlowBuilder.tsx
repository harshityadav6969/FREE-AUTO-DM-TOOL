import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Plus, 
  Trash2, 
  Search, 
  ChevronRight, 
  Link as LinkIcon,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
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
  where 
} from 'firebase/firestore';

interface Rule {
  id: string;
  triggerKeyword: string;
  resource: string;
  requireFollow: boolean;
  isActive: boolean;
  delay: number;
  mediaId?: string | null;
}

export default function FlowBuilder() {
  const { user } = useAuth();
  const { primary } = useIgAccounts();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mediaId = searchParams.get('mediaId');
  const accountId = searchParams.get('accountId') || primary?.id || "";
  
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // New Rule State
  const [triggerKeyword, setTriggerKeyword] = useState('');
  const [resource, setResource] = useState('');
  const [requireFollow, setRequireFollow] = useState(true);

  useEffect(() => {
    if (!user || !accountId) {
      setLoading(false);
      return;
    }

    const rulesRef = collection(db, `users/${user.uid}/accounts/${accountId}/rules`);
    let q = query(rulesRef);
    
    // If mediaId is provided, we can filter or highlight, 
    // but usually users want to see all rules for the account or just this media.
    // For now, let's show all rules but maybe filter if mediaId exists.
    if (mediaId && mediaId !== 'all') {
      q = query(rulesRef, where("mediaId", "==", mediaId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRules(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Rule)));
      setLoading(false);
    }, (error) => {
      console.error("Rules Error:", error);
      setLoading(false);
    });

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
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setTriggerKeyword('');
      setResource('');
    } catch (error) {
      console.error("Save Error:", error);
      alert("Failed to save rule.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRule = async (rule: Rule) => {
    if (!user || !accountId) return;
    try {
      const ruleRef = doc(db, `users/${user.uid}/accounts/${accountId}/rules`, rule.id);
      await updateDoc(ruleRef, { isActive: !rule.isActive });
    } catch (error) {
      console.error("Update Error:", error);
    }
  };

  const deleteRule = async (id: string) => {
    if (!user || !accountId || !confirm("Delete this rule?")) return;
    try {
      const ruleRef = doc(db, `users/${user.uid}/accounts/${accountId}/rules`, id);
      await deleteDoc(ruleRef);
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  if (!accountId) {
    return (
      <div className="py-20 text-center space-y-6">
        <h2 className="text-2xl font-bold">Connect Instagram first</h2>
        <p className="text-black/50 text-sm">Automations need a connected Business or Creator account.</p>
        <button 
          onClick={() => navigate('/connect-instagram')}
          className="bg-[#D4FF00] text-black px-8 py-3 rounded-2xl font-bold"
        >
          Reconnect Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight italic">
            Automation Rules {mediaId && <span className="text-white/20 ml-2"># {mediaId}</span>}
          </h1>
          <p className="text-white/40 text-sm mt-1">Set triggers and automated responses for your comments.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-6 py-4 sm:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 whitespace-nowrap"
        >
          <Plus className="size-4" /> Create New Rule
        </button>
      </header>

      {/* Rules List */}
      <div className="grid gap-6">
        <AnimatePresence mode="popLayout">
          {rules.map((rule, i) => (
            <motion.div
              layout
              key={rule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#161618] p-6 md:p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row md:items-center gap-6 md:gap-8 group hover:border-white/10 transition-all relative"
            >
              <div className="bg-indigo-500/10 p-4 rounded-3xl w-fit">
                 <Zap className="size-6 text-indigo-400" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 flex-1 gap-6 md:gap-8">
                 <div>
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">Trigger Keyword</label>
                    <div className="flex items-center gap-2">
                       <span className="bg-white/5 px-3 py-1.5 rounded-lg text-sm font-bold border border-white/5 text-white italic">"{rule.triggerKeyword}"</span>
                    </div>
                 </div>

                 <div className="lg:col-span-2">
                    <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-2">Resource Delivered</label>
                    <div className="flex items-center gap-2 text-indigo-400">
                       <LinkIcon className="size-3 shrink-0" />
                       <span className="text-sm font-medium truncate underline underline-offset-4 decoration-indigo-400/30">{rule.resource}</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between md:justify-end gap-6 md:mr-12">
                    <div className="md:text-right">
                       <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-1">Options</label>
                       <div className="flex items-center gap-3">
                          {rule.requireFollow && <div title="Requires Follow" className="size-5 rounded-full bg-emerald-500/10 flex items-center justify-center"><UserCheck className="size-3 text-emerald-400" /></div>}
                          {rule.delay > 0 && <div title={`Delayed ${rule.delay}s`} className="size-5 rounded-full bg-yellow-500/10 flex items-center justify-center"><Clock className="size-3 text-yellow-400" /></div>}
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={() => toggleRule(rule)}
                          className={cn(
                           "w-12 h-6 rounded-full relative transition-colors p-1",
                           rule.isActive ? "bg-indigo-600" : "bg-white/10"
                        )}>
                           <div className={cn("size-4 bg-white rounded-full transition-transform", rule.isActive && "translate-x-6")} />
                        </button>
                        <button 
                          onClick={() => deleteRule(rule.id)}
                          className="p-3 text-white/10 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                        >
                           <Trash2 className="size-4" />
                        </button>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Placeholder */}
      <AnimatePresence>
        {isModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[#111112] w-full max-w-xl rounded-[3rem] border border-white/10 p-10 relative z-10 shadow-2xl"
              >
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-light text-white italic">New Rule</h2>
                    <button onClick={() => setIsModalOpen(false)} className="bg-white/5 p-2 rounded-xl text-white/40 hover:text-white transition-colors">
                       <X className="size-5" />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div>
                       <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-4">Trigger Configuration</label>
                       <input 
                         type="text" 
                         placeholder="Keyword (e.g. LINK)"
                         value={triggerKeyword}
                         onChange={(e) => setTriggerKeyword(e.target.value)}
                         className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-white/20 uppercase tracking-widest block mb-4">Resource URL</label>
                       <input 
                         type="url" 
                         placeholder="https://..."
                         value={resource}
                         onChange={(e) => setResource(e.target.value)}
                         className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                       />
                    </div>
                    <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="bg-indigo-500/10 p-3 rounded-2xl"><UserCheck className="size-5 text-indigo-400" /></div>
                          <div>
                             <p className="text-xs font-bold text-white">Require Follow</p>
                             <p className="text-[10px] text-white/20">Only send DM to followers</p>
                          </div>
                       </div>
                       <button 
                         onClick={() => setRequireFollow(!requireFollow)}
                         className={cn("w-12 h-6 rounded-full relative p-1 transition-colors", requireFollow ? "bg-indigo-600" : "bg-white/10")}
                       >
                          <div className={cn("size-4 bg-white rounded-full transition-transform", requireFollow && "translate-x-6")} />
                       </button>
                    </div>

                    <button 
                      onClick={handleCreateRule}
                      disabled={isSaving || !triggerKeyword || !resource}
                      className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-bold text-lg hover:bg-indigo-500 transition-all active:scale-[0.98] mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                       {isSaving && <Loader2 className="size-5 animate-spin" />}
                       Create Rule
                    </button>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
