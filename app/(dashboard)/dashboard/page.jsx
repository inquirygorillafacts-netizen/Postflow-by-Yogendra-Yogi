"use client";

import { useState, useEffect } from "react";
import { Images, Edit3, Repeat, FolderOpen, UploadCloud, Calendar, Activity, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Light Mode Neon Glass Card Component
function NeonStatsCard({ title, value, icon: Icon, delay, isLoading, glowColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 100 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative group rounded-3xl p-6 overflow-hidden backdrop-blur-2xl bg-white/70 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500`}
    >
      {/* Hover Glow Effect */}
      <div className={`absolute -inset-2 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 ${glowColor}`} />
      
      {/* Top Border Accent */}
      <div className={`absolute top-0 left-0 w-full h-1 opacity-60 ${glowColor} bg-gradient-to-r from-transparent via-current to-transparent`} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mb-2">{title}</p>
          {isLoading ? (
            <div className="h-10 w-24 bg-slate-200/80 animate-pulse rounded-lg mt-1"></div>
          ) : (
            <motion.h3 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl font-black text-slate-900 tracking-tight"
            >
              {value}
            </motion.h3>
          )}
        </div>
        
        <div className={`p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white shadow-sm group-hover:bg-white transition-colors duration-300`}>
          <Icon className={`w-6 h-6 ${glowColor.replace('bg-', 'text-').replace('500', '600')}`} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, activeWorkspace } = useAuth();
  
  const [stats, setStats] = useState({
    totalLibrary: 0,
    totalUploads: 0,
    totalEdits: 0,
    totalReEdits: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace) return;

    // 1. Listen to gallery collection just for "Library" count
    const q = query(collection(db, "users", activeWorkspace, "gallery"));
    const unsubGallery = onSnapshot(q, (snap) => {
      setStats(prev => ({ ...prev, totalLibrary: snap.docs.length }));
    });

    // 2. Listen to workspace document for lifetime counters
    const unsubWorkspace = onSnapshot(doc(db, "users", activeWorkspace), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats(prev => ({
          ...prev,
          totalUploads: data.lifetimeUploads || 0,
          totalEdits: data.lifetimeEdits || 0,
          totalReEdits: data.lifetimeReEdits || 0
        }));
      }
      setIsLoading(false);
    });

    return () => {
      unsubGallery();
      unsubWorkspace();
    };
  }, [activeWorkspace]);

  return (
    <div className="relative min-h-[calc(100vh-2rem)] rounded-[2.5rem] bg-slate-50/50 overflow-hidden p-6 md:p-10 border border-slate-200/50 shadow-inner">
      
      {/* Light Animated Neon Blobs Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ 
            x: [0, 100, 0], 
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40vw] h-[40vw] bg-indigo-300/30 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0], 
            y: [0, -50, 0],
            scale: [1, 1.5, 1]
          }}
          transition={{ repeat: Infinity, duration: 20, ease: "easeInOut", delay: 2 }}
          className="absolute top-[20%] -right-[10%] w-[30vw] h-[30vw] bg-fuchsia-300/30 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            x: [0, 50, 0], 
            y: [0, -100, 0],
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-[20%] left-[20%] w-[35vw] h-[35vw] bg-pink-300/30 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 space-y-10">
        
        {/* Premium Light Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white p-2.5 rounded-2xl backdrop-blur-md border border-slate-100 shadow-sm">
                <Sparkles className="w-6 h-6 text-fuchsia-500" />
              </div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-indigo-900 to-fuchsia-900 tracking-tight">
                Welcome back, {user?.displayName?.split(' ')[0] || 'Creator'}
              </h1>
            </div>
            <p className="text-slate-500 text-lg font-medium ml-2 tracking-wide">Here's your studio overview and post flow activity.</p>
          </motion.div>

          <Link href="/upload">
            <Button className="group gap-2 bg-white hover:bg-slate-50 backdrop-blur-md text-slate-800 border border-slate-200 shadow-[0_8px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(99,102,241,0.15)] transition-all h-12 px-6 rounded-2xl">
              <UploadIcon className="w-5 h-5 text-indigo-600 group-hover:-translate-y-1 transition-transform" />
              <span className="font-bold text-sm tracking-wide">Quick Upload</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <NeonStatsCard 
            title="Photos in Library" 
            value={stats.totalLibrary} 
            icon={FolderOpen} 
            glowColor="bg-indigo-500"
            delay={0.1}
            isLoading={isLoading}
          />
          <NeonStatsCard 
            title="Total Uploads" 
            value={stats.totalUploads} 
            icon={UploadCloud} 
            glowColor="bg-fuchsia-500"
            delay={0.2}
            isLoading={isLoading}
          />
          <NeonStatsCard 
            title="Total Edits" 
            value={stats.totalEdits} 
            icon={Edit3} 
            glowColor="bg-pink-500"
            delay={0.3}
            isLoading={isLoading}
          />
          <NeonStatsCard 
            title="Total Re-Edits" 
            value={stats.totalReEdits} 
            icon={Repeat} 
            glowColor="bg-cyan-500"
            delay={0.4}
            isLoading={isLoading}
          />
        </div>

        {/* Activity & Upcoming Sections - Light Mode */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="group relative bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white p-8 shadow-[0_8px_40px_rgb(0,0,0,0.03)] h-[400px] overflow-hidden"
            >
              {/* Soft Holographic lines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
              
              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                  <Activity className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-wide">Recent Activity</h2>
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.div 
                  animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.1)", "0 0 40px rgba(99,102,241,0.3)", "0 0 20px rgba(99,102,241,0.1)"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-6 py-3 bg-white backdrop-blur-md border border-indigo-100 shadow-lg text-indigo-600 text-sm font-black tracking-widest uppercase rounded-2xl"
                >
                  Coming Soon
                </motion.div>
                <p className="mt-5 text-slate-500 font-medium text-sm tracking-wide">Activity tracking is under construction</p>
              </div>
            </motion.div>
          </div>
          
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="group relative bg-white/60 backdrop-blur-2xl rounded-[2rem] border border-white p-8 shadow-[0_8px_40px_rgb(0,0,0,0.03)] h-[400px] overflow-hidden"
            >
              <div className="absolute inset-0 bg-[linear-gradient(rgba(217,70,239,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

              <div className="relative z-10 flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-100 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-800 tracking-wide">Upcoming Posts</h2>
              </div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <motion.div 
                  animate={{ boxShadow: ["0 0 20px rgba(217,70,239,0.1)", "0 0 40px rgba(217,70,239,0.3)", "0 0 20px rgba(217,70,239,0.1)"] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="px-6 py-3 bg-white backdrop-blur-md border border-fuchsia-100 shadow-lg text-fuchsia-600 text-sm font-black tracking-widest uppercase rounded-2xl"
                >
                  Coming Soon
                </motion.div>
                <p className="mt-5 text-slate-500 font-medium text-sm text-center px-4 tracking-wide">Social media scheduling arriving in next update</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
