import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Instagram, Zap, Shield, Search, ArrowRight, CheckCircle2, MessageSquare, BarChart3, Lock, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { hasPendingIgToken } from '../lib/pendingIg';

export default function Landing() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const hasIgCode = new URLSearchParams(window.location.search).has('code');
    if (hasIgCode || hasPendingIgToken()) return;
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-200 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
             <Instagram className="text-white size-6" />
          </div>
          <h1 className="font-bold text-2xl tracking-tighter text-white italic">InstaFlow</h1>
        </div>
        <div className="hidden md:flex items-center gap-10">
           <a href="#features" className="text-sm font-medium text-white/40 hover:text-white transition-colors">Features</a>
           <a href="#pricing" className="text-sm font-medium text-white/40 hover:text-white transition-colors">Pricing</a>
           <a href="#about" className="text-sm font-medium text-white/40 hover:text-white transition-colors">About</a>
        </div>
        <div className="flex items-center gap-4">
           {user ? (
             <Link to="/dashboard" className="bg-white text-black px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-gray-200 transition-all active:scale-95 shadow-xl shadow-white/5">
                Dashboard <ArrowRight className="size-4" />
             </Link>
           ) : (
             <button 
               onClick={signIn}
               className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/20"
             >
                Get Started
             </button>
           )}
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-7xl mx-auto px-6 md:px-8 pt-10 md:pt-20 pb-20 md:pb-32 relative">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
           <motion.div 
             initial={{ opacity: 0, x: -20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.8 }}
             className="relative z-10 text-center lg:text-left"
           >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600/10 border border-indigo-500/20 mb-6 md:mb-8 backdrop-blur-md">
                 <Zap className="size-4 text-indigo-400" />
                 <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">v2.0 Now Live</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-light text-white tracking-tighter leading-tight md:leading-[0.9] mb-6 md:mb-8 italic">
                Automate your <br className="hidden sm:block" />
                <span className="text-indigo-500">Instagram Growth</span>
              </h1>
              <p className="text-base md:text-lg text-white/40 mx-auto lg:mx-0 max-w-lg mb-8 md:mb-10 leading-relaxed font-medium">
                The ultimate SaaS for creators and businesses to automate comment replies, DM resources, and lead generation at scale.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4">
                 <button onClick={signIn} className="bg-white text-black px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-bold text-base md:text-lg flex items-center justify-center gap-3 hover:bg-gray-200 transition-all shadow-2xl active:scale-95">
                    Start Automating <ArrowRight className="size-5" />
                 </button>
                 <button className="bg-white/5 border border-white/5 text-white px-8 md:px-10 py-4 md:py-5 rounded-[2rem] font-bold text-base md:text-lg hover:bg-white/10 transition-all">
                    View Demo
                 </button>
              </div>

              <div className="mt-12 md:mt-16 grid grid-cols-3 gap-4 md:gap-8 border-t border-white/5 pt-8">
                 <div>
                    <p className="text-xl md:text-3xl font-light text-white italic">2.4M+</p>
                    <p className="text-[9px] md:text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Messages Sent</p>
                 </div>
                 <div>
                    <p className="text-xl md:text-3xl font-light text-white italic">15k+</p>
                    <p className="text-[9px] md:text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Active Users</p>
                 </div>
                 <div>
                    <p className="text-xl md:text-3xl font-light text-white italic">99.9%</p>
                    <p className="text-[9px] md:text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">Uptime</p>
                 </div>
              </div>
           </motion.div>

           <motion.div 
             initial={{ opacity: 0, scale: 0.8 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 1, delay: 0.2 }}
             className="relative mt-20 lg:mt-0"
           >
              <div className="bg-gradient-to-br from-indigo-600/30 to-pink-600/30 rounded-[4rem] aspect-square blur-[120px] absolute inset-0 -z-10 animate-pulse" />
              <div className="bg-[#111112] rounded-[3.5rem] border border-white/10 p-4 shadow-2xl relative">
                 <div className="bg-[#161618] rounded-[2.5rem] border border-white/5 h-[400px] md:h-[500px] overflow-hidden p-6 md:p-8 flex flex-col gap-6">
                    {/* Mock Chat Interface */}
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                       <div className="size-10 rounded-full bg-indigo-500/20" />
                       <div>
                          <p className="text-xs font-bold text-white italic">Auto-Response Preview</p>
                          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1">
                             <div className="size-1 bg-emerald-400 rounded-full animate-ping" />
                             Online
                          </div>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-none px-5 py-3 ml-12 text-xs font-medium">
                          "I want the link to your guide!"
                       </div>
                       <motion.div 
                         initial={{ opacity: 0, x: -10 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 1 }}
                         className="bg-white/5 border border-white/5 text-white/80 rounded-2xl rounded-tl-none px-5 py-3 mr-12 text-xs italic"
                       >
                          "Sent! Check your DM ✨"
                       </motion.div>
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 2 }}
                         className="bg-indigo-600/20 border border-indigo-500/20 p-4 rounded-3xl mr-12 space-y-3"
                       >
                          <p className="text-xs font-bold text-white">DM DELIVERED 📩</p>
                          <p className="text-[10px] text-white/40">Resource: Beginner's Guide to Reels</p>
                          <div className="bg-white text-black text-center py-2 rounded-xl text-[10px] font-bold">Open Link</div>
                       </motion.div>
                    </div>
                 </div>
              </div>

              {/* Floaties */}
              <div className="absolute -top-10 -right-10 bg-[#161618] border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl animate-bounce duration-[5s]">
                 <Instagram className="size-4 md:size-6 text-pink-500" />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-[#161618] border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-2xl animate-bounce delay-700 duration-[4s]">
                 <Users className="size-4 md:size-6 text-indigo-500" />
              </div>
           </motion.div>
        </div>
      </header>

      {/* Feature Grid */}
      <section id="features" className="max-w-7xl mx-auto px-8 py-32 grid lg:grid-cols-4 gap-8">
        {[
          { icon: Search, title: 'Keyword Triggers', desc: 'Auto-reply to exact words or phrases in comments.' },
          { icon: Shield, title: 'Follow Check', desc: 'Optionally require users to follow you before receiving benefits.' },
          { icon: Lock, title: 'Privacy First', desc: 'Secure Meta-approved API integrations only.' },
          { icon: MessageSquare, title: 'DM Automation', desc: 'Send links, resources, and greetings automatically.' }
        ].map((f, i) => (
          <div key={i} className="bg-[#161618] p-10 rounded-[3rem] border border-white/5 group hover:border-white/10 transition-all">
             <div className="bg-indigo-500/10 p-4 rounded-2xl w-fit mb-8 group-hover:scale-110 transition-transform">
                <f.icon className="size-6 text-indigo-400" />
             </div>
             <h3 className="text-xl font-light text-white italic mb-4">{f.title}</h3>
             <p className="text-sm text-white/40 leading-relaxed font-medium">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Social Proof Overflow */}
      <div className="bg-white/[0.02] border-y border-white/5 py-12">
         <div className="max-w-7xl mx-auto px-8 flex flex-wrap justify-between items-center opacity-30 grayscale hover:grayscale-0 transition-all gap-10">
            <span className="text-2xl font-black italic tracking-tighter">NIKE</span>
            <span className="text-2xl font-black italic tracking-tighter">REVOLUT</span>
            <span className="text-2xl font-black italic tracking-tighter">HYPER</span>
            <span className="text-2xl font-black italic tracking-tighter">SQUARE</span>
            <span className="text-2xl font-black italic tracking-tighter">META</span>
         </div>
      </div>

      <footer className="max-w-7xl mx-auto px-8 py-20 text-center opacity-40">
         <div className="flex items-center justify-center gap-3 mb-6">
            <Instagram className="size-5" />
            <span className="font-bold tracking-tight italic">InstaFlow SaaS</span>
         </div>
         <p className="text-xs">© 2026 InstaFlow. All rights Reserved. Meta Approved.</p>
      </footer>

      {/* Global Glows */}
      <div className="fixed top-0 left-0 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-[200px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[150px] pointer-events-none translate-x-1/4 translate-y-1/4" />
    </div>
  );
}
