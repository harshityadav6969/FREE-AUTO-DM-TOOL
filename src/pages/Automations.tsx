import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Automation } from '../types';
import { Plus, Search, Filter, MoreVertical, Play, Pause, Trash2, Edit2, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Automations() {
  const { profile } = useAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchAutomations() {
      if (!profile) return;
      const q = query(collection(db, 'automations'), where('userId', '==', profile.uid));
      const snap = await getDocs(q);
      setAutomations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Automation)));
      setLoading(false);
    }
    fetchAutomations();
  }, [profile]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'automations', id), { isActive: !current });
      setAutomations(automations.map(a => a.id === id ? { ...a, isActive: !current } : a));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    try {
      await deleteDoc(doc(db, 'automations', id));
      setAutomations(automations.filter(a => a.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = automations.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-black tracking-tight">Automations</h1>
          <p className="text-black/50 text-sm mt-1">Manage your active flows and message triggers.</p>
        </div>
        <Link 
          to="/automations/new"
          className="bg-[#D4FF00] text-black px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#c6f000] transition-all active:scale-95"
        >
          <Plus className="size-5" />
          + New Automation
        </Link>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
         <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/20" />
            <input 
               type="text" 
               placeholder="Search automations..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full bg-[#161618] border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all shadow-sm"
            />
         </div>
         <button className="bg-[#161618] border border-white/5 p-2 rounded-xl text-white/40 hover:text-white/70 transition-colors shadow-sm">
            <Filter className="size-5" />
         </button>
      </div>

      {automations.length === 0 ? (
        <div className="bg-[#161618] rounded-[2.5rem] border-2 border-dashed border-white/5 p-20 text-center">
           <div className="bg-white/5 p-6 rounded-full w-fit mx-auto mb-6">
              <Zap className="size-12 text-white/10" />
           </div>
           <h3 className="text-xl font-medium text-white mb-2">No automations found</h3>
           <p className="text-white/30 max-w-sm mx-auto mb-10 text-sm italic">Create your first trigger flow to start automating your Instagram engagement.</p>
           <Link 
            to="/automations/new"
            className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-medium hover:bg-indigo-500 transition-all inline-block shadow-2xl shadow-indigo-600/10"
           >
              Let's Build One
           </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filtered.map(automation => (
             <div key={automation.id} className="bg-[#161618] border border-white/5 p-6 rounded-2xl shadow-sm hover:border-white/20 transition-all group">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black border border-white/10 text-white/60 px-2 py-0.5 rounded uppercase tracking-wider">{automation.trigger}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <Link to={`/automations/edit/${automation.id}`} className="p-2 text-white/20 hover:text-indigo-400 rounded-lg hover:bg-indigo-500/10 transition-colors">
                         <Edit2 className="size-4" />
                      </Link>
                      <button onClick={() => deleteAutomation(automation.id)} className="p-2 text-white/20 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                         <Trash2 className="size-4" />
                      </button>
                   </div>
                </div>

                <h3 className="text-base font-semibold text-white font-mono tracking-tight mb-2 truncate group-hover:text-indigo-400 transition-colors">{automation.name}</h3>
                <p className="text-xs text-white/40 line-clamp-2 mb-6 min-h-[32px] italic">
                   {automation.message}
                </p>

                <div className="space-y-4 pt-4 border-t border-white/5">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div>
                            <p className="text-sm font-medium text-white">128</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">Sent</p>
                         </div>
                         <div>
                            <p className="text-sm font-medium text-white">24%</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest leading-none">Conv.</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => toggleActive(automation.id, automation.isActive)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all outline-none",
                          automation.isActive 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}
                      >
                         {automation.isActive ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                         {automation.isActive ? 'Active' : 'Paused'}
                      </button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
