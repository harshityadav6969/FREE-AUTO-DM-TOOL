import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  History, 
  LogOut, 
  BarChart3, 
  Zap,
  Instagram,
  Menu,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ImageIcon, label: 'Media Manager', path: '/media' },
    { icon: Zap, label: 'Flow Builder', path: '/automation' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: History, label: 'Activity Logs', path: '/logs' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const sidebarContent = (
    <>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
             <Instagram className="text-white size-6" />
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white italic">InstaFlow</h1>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Automation SaaS</p>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden p-2 text-white/40 hover:text-white"
        >
          <X className="size-6" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-sm font-medium",
              isActive 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                : "text-white/40 hover:text-white/70"
            )}
          >
            <item.icon className="size-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-white/5">
         <div className="bg-white/5 rounded-[2.5rem] p-4 flex items-center gap-3 group hover:bg-white/10 transition-colors">
            <div className="size-10 rounded-full overflow-hidden border-2 border-indigo-500/20 shrink-0">
               <img src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`} alt="User" className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-white truncate">{profile?.displayName}</p>
               <p className="text-[10px] text-white/40 truncate">{profile?.subscriptionTier} User</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
            >
              <LogOut className="size-4" />
            </button>
         </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0A0A0B] text-gray-200 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-[#111112] border-r border-white/5 flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 left-0 bottom-0 w-80 bg-[#111112] flex flex-col shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile HeaderBar */}
        <header className="lg:hidden flex items-center justify-between p-6 bg-[#111112] border-b border-white/5">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Instagram className="text-white size-5" />
             </div>
             <h1 className="font-bold text-lg tracking-tight text-white italic">InstaFlow</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-white/5 rounded-xl text-white/60"
          >
            <Menu className="size-6" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto relative no-scrollbar">
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[160px] opacity-[0.03] -z-0 pointer-events-none" />
           <div className="relative z-10 p-6 md:p-10 max-w-7xl mx-auto">
              <Outlet />
           </div>
        </main>
      </div>
    </div>
  );
}
