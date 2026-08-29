import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  CheckCircle2, 
  UserCheck, 
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

const logs = [
  { id: '1', type: 'DM_SENT', user: '@creative_mind', mediaId: '29384', msg: 'Sent "LINK" resource', time: 'Just now', status: 'SUCCESS' },
  { id: '2', type: 'RESOURCE_DELIVERED', user: '@visionary', mediaId: '29384', msg: 'Guide delivered via DM', time: '4m ago', status: 'SUCCESS' },
  { id: '3', type: 'FOLLOW_PROMPT', user: '@the_runner', mediaId: '11202', msg: 'Sent follow requirement prompt', time: '12m ago', status: 'PENDING' },
  { id: '4', type: 'ERROR', user: '@bot_tester', mediaId: '55621', msg: 'DMs blocked by user privacy', time: '22m ago', status: 'FAILED' },
  { id: '5', type: 'COMMENT_REPLICED', user: '@alex_dev', mediaId: '29384', msg: 'Replied to "How to join?"', time: '1h ago', status: 'SUCCESS' },
  { id: '6', type: 'DM_SENT', user: '@sarah_k', mediaId: '29384', msg: 'Sent welcome flow', time: '2h ago', status: 'SUCCESS' },
];

export default function ActivityLogs() {
  const [filter, setFilter] = useState('ALL');

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">Activity Logs</h1>
          <p className="text-black/50 text-sm mt-1">Real-time stream of all automation events and responses.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white border border-black/10 rounded-2xl flex p-1 overflow-x-auto no-scrollbar">
              {['ALL', 'SUCCESS', 'PENDING', 'FAILED'].map(f => (
                <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    filter === f ? "bg-black text-white shadow-lg" : "text-black/40 hover:text-black"
                  )}
                >
                  {f}
                </button>
              ))}
           </div>
        </div>
      </header>

      {/* Logs Table / Mobile Cards */}
      <div className="bg-[#161618] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
             {/* ... existing table structure ... */}
             <thead>
               <tr className="border-bottom border-white/5 bg-white/[0.02]">
                 <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Event Type</th>
                 <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">User</th>
                 <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Impact</th>
                 <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Status</th>
                 <th className="px-8 py-5 text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Time</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors cursor-default">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                             "p-2 rounded-xl border border-white/5 shadow-sm",
                             log.status === 'FAILED' ? "bg-red-500/10 text-red-400" : "bg-indigo-500/10 text-indigo-400"
                          )}>
                             {log.type === 'ERROR' ? <AlertCircle className="size-4" /> : <MessageSquare className="size-4" />}
                          </div>
                          <span className="text-xs font-bold text-white italic">{log.type.replace('_', ' ')}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">{log.user}</span>
                          <span className="text-[10px] text-white/20 flex items-center gap-1 mt-1">
                             Media ID: {log.mediaId} <ExternalLink className="size-2" />
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs text-white/60 font-medium italic">"{log.msg}"</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                          log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-400" : 
                          log.status === 'FAILED' ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                       )}>
                          <div className="size-1.5 rounded-full bg-current" />
                          {log.status}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-bold text-white/20 uppercase">{log.time}</span>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-white/5">
           {logs.map((log) => (
             <div key={log.id} className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={cn(
                         "p-2 rounded-xl border border-white/5",
                         log.status === 'FAILED' ? "bg-red-500/10 text-red-400" : "bg-indigo-500/10 text-indigo-400"
                      )}>
                         {log.type === 'ERROR' ? <AlertCircle className="size-4" /> : <MessageSquare className="size-4" />}
                      </div>
                      <span className="text-xs font-bold text-white italic">{log.type.replace('_', ' ')}</span>
                   </div>
                   <span className="text-[10px] font-bold text-white/20 uppercase">{log.time}</span>
                </div>
                <div>
                   <p className="text-sm font-medium text-white">{log.user}</p>
                   <p className="text-xs text-white/60 mt-1 italic">"{log.msg}"</p>
                </div>
                <div className="flex items-center justify-between">
                   <span className="text-[10px] text-white/20 flex items-center gap-1">Media ID: {log.mediaId}</span>
                   <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      log.status === 'SUCCESS' ? "bg-emerald-500/10 text-emerald-400" : 
                      log.status === 'FAILED' ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
                   )}>
                      {log.status}
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
           <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Showing 6 of 1,284 entries</p>
           <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all">
                 <ChevronLeft className="size-4" />
              </button>
              <div className="px-4 py-2 rounded-xl bg-indigo-600 text-[10px] font-bold text-white">1</div>
              <button className="p-2 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all">
                 <ChevronRight className="size-4" />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
