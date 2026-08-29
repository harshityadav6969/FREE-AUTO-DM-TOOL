import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Users, 
  MousePointer2, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

// ✅ keep this
import ConnectInstagram from "../components/ConnectInstagram";

const data = [
  { name: 'Mon', sent: 400 },
  { name: 'Tue', sent: 300 },
  { name: 'Wed', sent: 600 },
  { name: 'Thu', sent: 800 },
  { name: 'Fri', sent: 500 },
  { name: 'Sat', sent: 900 },
  { name: 'Sun', sent: 700 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  // ✅ NEW STATE
  const [connected, setConnected] = useState(false);

  // ✅ CHECK URL PARAM
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const token = hash.get("ig_token");
    if (token) {
      localStorage.setItem("ig_access_token", token);
      window.history.replaceState({}, "", "/dashboard?connected=1");
    }
    if (
      params.get("connected") ||
      token ||
      localStorage.getItem("ig_access_token") ||
      localStorage.getItem("ig_connected") === "1"
    ) {
      setConnected(true);
    }
  }, []);

  const stats = [
    { label: 'DMs Sent Today', val: '1,284', trend: '+12%', icon: MessageSquare, color: 'text-indigo-400' },
    { label: 'Total Messages', val: '45,021', trend: '+5.4%', icon: Zap, color: 'text-yellow-400' },
    { label: 'Lead Conversion', val: '22.4%', trend: '-2%', icon: MousePointer2, color: 'text-pink-400', neg: true },
    { label: 'Active Rules', val: '14', trend: '+3', icon: Plus, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-10">

      {/* ================= HEADER ================= */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight italic">
            Dashboard
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Welcome back. Your automations are running smooth.
          </p>

          {/* ✅ SHOW CONNECTED STATUS */}
          {connected && (
            <div className="mt-2 text-green-400 text-sm font-semibold">
              Instagram Connected ✅
            </div>
          )}
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <ConnectInstagram />

          <button 
            onClick={() => navigate('/automation')}
            className="bg-indigo-600 text-white px-6 py-4 sm:py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 text-sm"
          >
            <Plus className="size-4" /> Create Rule
          </button>
        </div>
      </header>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#161618] p-6 rounded-3xl border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
               <div className="bg-white/5 p-3 rounded-2xl">
                  <stat.icon className={cn("size-5", stat.color)} />
               </div>
               <div className={cn(
                 "flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full",
                 stat.neg ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
               )}>
                  {stat.neg ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
                  {stat.trend}
               </div>
            </div>
            <p className="text-3xl font-light text-white tracking-tight">{stat.val}</p>
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] mt-1">{stat.label}</p>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[100px] opacity-[0.03] -translate-y-1/2 translate-x-1/2" />
          </motion.div>
        ))}
      </div>

      {/* ================= CHART + ACTIVITY ================= */}
      <div className="grid lg:grid-cols-3 gap-8">

         {/* CHART */}
         <section className="lg:col-span-2 bg-[#161618] p-8 rounded-[2.5rem] border border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-10">
               <h3 className="text-lg font-medium text-white italic">Message Volume</h3>
               <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white/60 focus:outline-none">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
               </select>
            </div>

            <div className="h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                     <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 600 }} dy={10} />
                     <YAxis hide />
                     <Tooltip contentStyle={{ backgroundColor: '#111112', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', fontSize: '12px' }} />
                     <Area type="monotone" dataKey="sent" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </section>

         {/* ACTIVITY */}
         <section className="bg-[#161618] p-8 rounded-[2.5rem] border border-white/5 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-lg font-medium text-white italic">Recent Activity</h3>
               <button onClick={() => navigate('/logs')} className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">View All</button>
            </div>

            <div className="flex-1 space-y-6">
              {[
                { user: '@alex_dev', event: 'DM Sent', time: '2m ago' },
                { user: '@sarah_k', event: 'Resource Delivered', time: '15m ago' },
                { user: '@mike_j', event: 'Comment Replied', time: '22m ago' },
                { user: '@laura_w', event: 'AI Response', time: '1h ago' }
              ].map((log, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className="size-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    <MessageSquare className="size-3 text-white/20" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{log.user}</p>
                    <p className="text-[10px] text-white/40 truncate italic">{log.event}</p>
                  </div>
                  <span className="text-[10px] text-white/20 font-medium">{log.time}</span>
                </div>
              ))}
            </div>
         </section>

      </div>
    </div>
  );
}