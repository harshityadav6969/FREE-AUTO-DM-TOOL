import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Target, 
  Users,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';

const conversionData = [
  { name: 'Mon', comments: 400, dms: 240 },
  { name: 'Tue', comments: 300, dms: 139 },
  { name: 'Wed', comments: 200, dms: 980 },
  { name: 'Thu', comments: 278, dms: 390 },
  { name: 'Fri', comments: 189, dms: 480 },
  { name: 'Sat', comments: 239, dms: 380 },
  { name: 'Sun', comments: 349, dms: 430 },
];

const pieData = [
  { name: 'Exact Match', value: 400 },
  { name: 'Wildcard', value: 300 },
  { name: 'AI Assisted', value: 300 },
  { name: 'Direct DM', value: 200 },
];

const COLORS = ['#818cf8', '#fbbf24', '#f472b6', '#34d399'];

export default function Analytics() {
  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight italic">Analytics</h1>
          <p className="text-white/40 text-sm mt-1">Deep dive into your engagement and automation performance.</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-white/5 border border-white/5 px-4 sm:px-6 py-3 rounded-2xl flex items-center justify-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/60 hover:border-white/20 transition-all w-full sm:w-auto">
              Export Report
              <ChevronDown className="size-4" />
           </button>
        </div>
      </header>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {[
          { label: 'Avg. Response Time', val: '1.2s', trend: '-0.4s', icon: Activity },
          { label: 'Rule Success Rate', val: '98.2%', trend: '+1.2%', icon: Target },
          { label: 'New Leads Found', val: '432', trend: '+14%', icon: Users },
        ].map((item, i) => (
          <div key={i} className="bg-[#161618] p-8 rounded-[2rem] border border-white/5 flex items-center gap-6">
             <div className="bg-indigo-500/10 p-4 rounded-2xl">
                <item.icon className="size-6 text-indigo-400" />
             </div>
             <div>
                <p className="text-3xl font-light text-white italic">{item.val}</p>
                <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">{item.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
         <section className="bg-[#161618] p-6 md:p-8 rounded-[2.5rem] border border-white/5 h-[400px] md:h-[450px]">
            <h3 className="text-base md:text-lg font-medium text-white italic mb-8 md:mb-10">Conversion Funnel</h3>
            <div className="h-[250px] md:h-[300px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.2)', fontWeight: 600 }}
                    />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#111112', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }} />
                    <Bar dataKey="comments" fill="#312e81" radius={[8, 8, 0,0]} />
                    <Bar dataKey="dms" fill="#818cf8" radius={[8, 8, 0,0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </section>

         <section className="bg-[#161618] p-6 md:p-8 rounded-[2.5rem] border border-white/5 h-auto lg:h-[450px] flex flex-col">
            <h3 className="text-base md:text-lg font-medium text-white italic mb-8 md:mb-10">Trigger Distribution</h3>
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-6 md:gap-8">
               <div className="h-[200px] md:h-[250px] w-full flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={pieData}
                           innerRadius={50}
                           outerRadius={70}
                           paddingAngle={5}
                           dataKey="value"
                        >
                           {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="space-y-3 sm:space-y-4 pr-0 sm:pr-12 w-full sm:w-auto">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="size-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <p className="text-xs font-medium text-white/60">{item.name}</p>
                       <span className="text-[10px] font-black text-white/20 ml-auto">{(item.value / 1200 * 100).toFixed(0)}%</span>
                    </div>
                  ))}
               </div>
            </div>
         </section>
      </div>
    </div>
  );
}
