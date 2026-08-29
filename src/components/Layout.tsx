import React, { useState } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useIgAccounts } from "../lib/igAccounts";
import {
  Home,
  LayoutGrid,
  FileText,
  Image as ImageIcon,
  Users,
  RotateCcw,
  BarChart3,
  CircleHelp,
  LogOut,
  Menu,
  X,
  Plus,
  Crown,
  Instagram,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export default function Layout() {
  const { profile, logout } = useAuth();
  const { primary, connected, loading } = useIgAccounts();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const showReconnect =
    !loading &&
    !connected &&
    !dismissed &&
    !location.pathname.includes("connect-instagram");

  const menu = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: LayoutGrid, label: "Automations", path: "/automation" },
    { icon: FileText, label: "Templates", path: "/templates" },
  ];

  const sidebar = (
    <>
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-[22px] font-black tracking-tight text-black">InstaFlow</h1>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-black/5 bg-black/[0.03] px-3 py-2">
          <img
            src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}`}
            className="size-8 rounded-full object-cover"
            alt=""
          />
          <div className="min-w-0">
            <p className="text-xs font-bold text-black truncate">My Workspace</p>
            <p className="text-[10px] text-black/40">Free Plan</p>
          </div>
        </div>
        <button
          onClick={() => navigate(connected ? "/automation?new=1" : "/connect-instagram")}
          className="mt-4 w-full bg-[#D4FF00] text-black font-bold rounded-2xl py-3 text-sm flex items-center justify-center gap-2 hover:bg-[#c6f000]"
        >
          <Plus className="size-4" /> New Automation
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                isActive ? "bg-black/8 text-black font-semibold" : "text-black/60 hover:bg-black/5"
              )
            }
          >
            <item.icon className="size-4" />
            {item.label}
          </NavLink>
        ))}

        <button
          onClick={() => setContentOpen(!contentOpen)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-black/60 hover:bg-black/5"
        >
          <ImageIcon className="size-4" />
          <span className="flex-1 text-left">My Content</span>
          <ChevronDown className={cn("size-4 transition", contentOpen && "rotate-180")} />
        </button>
        {contentOpen && (
          <div className="ml-4 space-y-0.5">
            <NavLink
              to="/media"
              className={({ isActive }) =>
                cn("flex items-center gap-3 px-3 py-2 rounded-xl text-sm", isActive ? "bg-black/8 font-semibold text-black" : "text-black/55")
              }
            >
              <ImageIcon className="size-4" /> Posts & Reels
            </NavLink>
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-black/35">
              <ImageIcon className="size-4" /> Stories
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-black/60">
          <Users className="size-4" /> Contacts
        </div>
        <NavLink to="/logs" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm", isActive ? "bg-black/8 font-semibold" : "text-black/60")}>
          <RotateCcw className="size-4" /> Rewind
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm", isActive ? "bg-black/8 font-semibold" : "text-black/60")}>
          <BarChart3 className="size-4" /> Analytics
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm", isActive ? "bg-black/8 font-semibold" : "text-black/60")}>
          <CircleHelp className="size-4" /> Support
        </NavLink>
      </nav>

      <div className="p-4 space-y-3 border-t border-black/5">
        <div>
          <div className="flex justify-between text-[11px] font-medium text-black/50 mb-1">
            <span>DMs sent</span>
            <span>0/500</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full w-0 bg-[#D4FF00]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] font-medium text-black/50 mb-1">
            <span>IG accounts</span>
            <span>{connected ? "1/1" : "0/1"}</span>
          </div>
          <div className="h-1.5 rounded-full bg-black/10 overflow-hidden">
            <div className={cn("h-full bg-[#D4FF00]", connected ? "w-full" : "w-0")} />
          </div>
        </div>
        <button className="w-full bg-[#D4FF00] text-black font-bold rounded-2xl py-2.5 text-sm flex items-center justify-center gap-2">
          <Crown className="size-4" /> Upgrade
        </button>
        <button onClick={logout} className="w-full text-xs text-black/40 hover:text-black flex items-center justify-center gap-2 py-1">
          <LogOut className="size-3" /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#F4F4F2] text-black overflow-hidden font-sans">
      <aside className="hidden lg:flex w-64 bg-white border-r border-black/5 flex-col shrink-0">
        {sidebar}
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/40" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="absolute top-0 left-0 bottom-0 w-72 bg-white flex flex-col">
              {sidebar}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {!connected && !loading && (
          <div className="bg-orange-500 text-white text-sm px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <span>Your Instagram account has been disconnected. Automations are paused until you reconnect.</span>
            <button onClick={() => navigate("/connect-instagram")} className="bg-[#D4FF00] text-black font-bold px-3 py-1.5 rounded-lg text-xs whitespace-nowrap flex items-center gap-1">
              <Instagram className="size-3.5" /> Reconnect Instagram
            </button>
          </div>
        )}
        <div className="bg-black text-white text-sm px-4 py-2.5 flex items-center justify-center gap-4 shrink-0">
          <span>Upgrade to unlock every feature and accelerate your growth.</span>
          <button className="bg-[#D4FF00] text-black font-bold px-3 py-1 rounded-lg text-xs">Try 14 Days For Free</button>
        </div>

        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-black/5">
          <h1 className="font-black">InstaFlow</h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
            <Menu className="size-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showReconnect && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40" onClick={() => setDismissed(true)} />
            <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center">
              <div className="mx-auto size-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center mb-4">
                <AlertTriangle className="size-6" />
              </div>
              <h2 className="text-xl font-bold mb-2">Your Instagram is disconnected</h2>
              <p className="text-sm text-black/55 mb-6">
                Automations are paused until you reconnect an Instagram Business account. Connect now to start sending comment-to-DM replies.
              </p>
              <button
                onClick={() => {
                  setDismissed(true);
                  navigate("/connect-instagram");
                }}
                className="w-full bg-[#D4FF00] text-black font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                <Instagram className="size-4" /> Reconnect Instagram
              </button>
              <button onClick={() => setDismissed(true)} className="mt-3 text-sm text-black/40">
                Later
              </button>
              {primary?.username && (
                <p className="mt-4 text-xs text-black/35">Last account: @{primary.username}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
