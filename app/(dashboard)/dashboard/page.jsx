"use client";

import { useState, useEffect } from "react";
import { StatsCard } from "@/components/StatsCard";
import { Images, Edit3, Repeat, FolderOpen, UploadCloud, Calendar, Activity } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Overview of your post flow and activity.</p>
        </div>
        <Link href="/upload">
          <Button className="gap-2 bg-primary hover:bg-primary/90 text-white font-medium shadow-sm hover:shadow-md transition-all scale-100 active:scale-95 h-9 px-4 text-xs">
            <UploadIcon className="w-4 h-4" />
            Quick Upload
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          title="Photos in Library" 
          value={stats.totalLibrary} 
          icon={FolderOpen} 
          color="bg-primary/10 text-primary"
          delay={0.1}
          isLoading={isLoading}
        />
        <StatsCard 
          title="Total Uploads" 
          value={stats.totalUploads} 
          icon={UploadCloud} 
          color="bg-accent/10 text-accent"
          delay={0.2}
          isLoading={isLoading}
        />
        <StatsCard 
          title="Total Edits" 
          value={stats.totalEdits} 
          icon={Edit3} 
          color="bg-info/10 text-info"
          delay={0.3}
          isLoading={isLoading}
        />
        <StatsCard 
          title="Total Re-Edits" 
          value={stats.totalReEdits} 
          icon={Repeat} 
          color="bg-success/10 text-success"
          delay={0.4}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-card/50 rounded-xl border border-border border-dashed p-4.5 shadow-sm h-[330px] relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Activity className="w-4.5 h-4.5 text-muted-foreground" />
              <h2 className="text-base font-semibold">Recent Activity</h2>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] z-10">
              <div className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                Coming Soon
              </div>
            </div>
          </motion.div>
        </div>
        
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="bg-card/50 rounded-xl border border-border border-dashed p-4.5 shadow-sm h-[330px] relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 opacity-50">
              <Calendar className="w-4.5 h-4.5 text-muted-foreground" />
              <h2 className="text-base font-semibold">Upcoming Posts</h2>
            </div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] z-10">
              <div className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full shadow-lg">
                Coming Soon
              </div>
            </div>
          </motion.div>
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
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  )
}
