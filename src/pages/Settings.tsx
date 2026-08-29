import React, { useState } from 'react';
import { 
  Shield, 
  Key, 
  Instagram, 
  User, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Save,
  MessageSquare,
  Plus,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/AuthContext';
import { useIgAccounts } from '../lib/igAccounts';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('ACCOUNTS');
  const { profile } = useAuth();
  const { primary, connected } = useIgAccounts();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState({
    SUCCESS: ["Sent! Check your DM ✨", "Done! Open your inbox 🎁"],
    FOLLOW: ["Follow + DM again", "Check message requests"],
  });

  const tabs = [
    { id: 'ACCOUNTS', label: 'Meta Accounts', icon: Instagram },
    { id: 'TEMPLATES', label: 'Message Pools', icon: MessageSquare },
    { id: 'PROFILE', label: 'My Info', icon: User },
    { id: 'SECURITY', label: 'Integrations', icon: Shield },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
          <p className="text-black/40 text-sm mt-1">Configure your workspace and connected Instagram account.</p>
        </div>
        <button className="bg-[#D4FF00] text-black px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#c6f000] transition-all active:scale-95 w-full sm:w-auto">
          <Save className="size-4" /> Save Changes
        </button>
      </header>

      <div className="flex flex-col lg:flex-row gap-10 md:gap-12">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 no-scrollbar shrink-0">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-sm font-bold transition-all relative group whitespace-nowrap min-w-max lg:min-w-0",
                 activeTab === tab.id ? "bg-black/5 text-black" : "text-black/70 hover:text-black"
               )}
             >
                <tab.icon className={cn("size-5", activeTab === tab.id ? "text-black" : "text-black/70")} />
                {tab.label}
                {activeTab === tab.id && <motion.div layoutId="tab-indicator" className="absolute bottom-0 lg:bottom-auto lg:left-0 w-full lg:w-1 h-1 lg:h-6 bg-[#D4FF00] rounded-full" />}
             </button>
           ))}
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
           <motion.div 
             key={activeTab}
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-[#161618] p-6 md:p-10 rounded-[2.5rem] border border-white/5 shadow-sm"
           >
              {activeTab === 'ACCOUNTS' && (
                <div className="space-y-8">
                   <h3 className="text-xl font-light text-white italic">Linked Account</h3>
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex flex-col sm:flex-row items-center gap-6">
                      <div className="size-16 rounded-[1.5rem] bg-[#D4FF00] flex items-center justify-center border-2 border-black/5">
                         <Instagram className="size-8 text-black" />
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                         <p className="text-sm font-black text-white">{connected ? `@${primary?.username}` : "No Instagram connected"}</p>
                         <p className="text-xs text-white/70">{connected ? `${primary?.followersCount?.toLocaleString() || 0} followers` : "Connect an Instagram Business account"}</p>
                      </div>
                      <button onClick={() => navigate("/connect-instagram")} className="text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-[#D4FF00] rounded-xl">
                        {connected ? "Reconnect" : "Connect"}
                      </button>
                   </div>

                   <div className="grid gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-4">Page Access Token</label>
                         <div className="relative">
                            <Key className="absolute left-5 top-5 size-4 text-white/20" />
                            <input 
                              type="password" 
                              value="••••••••••••••••••••••••"
                              readOnly
                              className="w-full bg-white/5 border border-white/5 rounded-2xl px-14 py-4 text-white/60 focus:outline-none focus:border-[#D4FF00]/50 transition-all font-mono text-xs"
                            />
                            <button className="absolute right-5 top-4 px-3 py-1 bg-[#D4FF00] text-black rounded-lg text-[10px] font-bold">Update</button>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-white/20 uppercase tracking-widest pl-4">Webhook Verify Token</label>
                         <input 
                            type="text" 
                            placeholder="BOOSTUPP"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-[#D4FF00]/50 transition-all font-mono text-xs"
                         />
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'TEMPLATES' && (
                <div className="space-y-8">
                   <h3 className="text-xl font-light text-white italic">Response Pools</h3>
                   <p className="text-xs text-white/40 leading-relaxed italic">The system will randomly select one message from these pools to prevent triggering Meta's spam filters.</p>
                   
                   <div className="space-y-10">
                      {Object.entries(templates).map(([key, pool]) => (
                        <div key={key} className="space-y-4">
                           <div className="flex items-center justify-between">
                              <h4 className="text-[11px] font-black text-[#D4FF00] uppercase tracking-[0.2em]">{key} MESSAGES</h4>
                              <button className="text-[#D4FF00] hover:text-white transition-colors">
                                 <Plus className="size-4" />
                              </button>
                           </div>
                           <div className="space-y-3">
                              {(pool as string[]).map((msg, idx) => (
                                <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center gap-4 group">
                                   <p className="text-xs text-white flex-1 font-medium italic">"{msg}"</p>
                                   <button className="text-white/10 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                      <Trash2 className="size-3" />
                                   </button>
                                </div>
                              ))}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </motion.div>
        </div>
      </div>
    </div>
  );
}
