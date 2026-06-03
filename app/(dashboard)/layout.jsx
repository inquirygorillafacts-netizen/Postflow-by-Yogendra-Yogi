"use client";

import { Sidebar } from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProcessingProvider } from "@/contexts/ProcessingContext";
import { useEffect, useState } from "react";
import { Shield, Eye, Copy, RefreshCw, X, AlertTriangle, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { doc, updateDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userData, loading, activeWorkspace } = useAuth();
  
  const [showIdModal, setShowIdModal] = useState(false);
  const [showId, setShowId] = useState(false);
  const [showConfirmRegen, setShowConfirmRegen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (user === null) {
        router.push("/login");
      } else if (!userData || !userData.onboarded) {
        router.push("/onboarding");
      } else if (userData.hasUnseenUpgrades === true || userData.hasUnseenUpgrades === undefined) {
        setShowUpgradeModal(true);
      }
    }
  }, [user, userData, loading, router]);

  const handleDismissUpgrade = async () => {
    setShowUpgradeModal(false);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        hasUnseenUpgrades: false
      });
    } catch (err) {
      console.error("Failed to update upgrade status:", err);
    }
  };

  const handleShowId = () => {
    setShowId(true);
    setTimeout(() => setShowId(false), 3000);
  };

  const generateUniqueAgencyId = async () => {
    while (true) {
      const newId = Math.floor(1000 + Math.random() * 9000).toString();
      const q = query(collection(db, "users"), where("agencyId", "==", newId));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return newId; // Unique ID found
      }
    }
  };

  const handleRegenerateId = async () => {
    setIsRegenerating(true);
    try {
      const newId = await generateUniqueAgencyId();
      await updateDoc(doc(db, "users", user.uid), {
        agencyId: newId,
        allowedFreelancers: [] // Kick everyone
      });
      toast.success("Agency ID regenerated! All freelancers kicked.");
      setShowConfirmRegen(false);
      setShowId(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to regenerate ID");
    } finally {
      setIsRegenerating(false);
    }
  };

  if (loading || user === null || !userData || !userData.onboarded) return null;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 overflow-auto relative flex flex-col">
        {/* Global Header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center">
            <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center">
              PostFlow <span className="text-xs font-semibold bg-primary/15 text-primary px-2.5 py-1 rounded-full ml-2 shadow-sm border border-primary/20">by Yogendra Yogi</span>
            </h1>
          </div>
          {activeWorkspace === user?.uid && (
            <button 
              onClick={() => setShowIdModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
            >
              <Shield className="w-4 h-4 text-indigo-500" />
              My Agency ID
            </button>
          )}
        </header>

        <ProcessingProvider>
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 p-4 lg:p-5"
            >
              {children}
            </motion.main>
          </AnimatePresence>
        </ProcessingProvider>
      </div>

      {/* ID Modal */}
      {showIdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-sm border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowIdModal(false);
                setShowConfirmRegen(false);
                setShowId(false);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-500" />
              Your Agency ID
            </h3>
            
            {!showConfirmRegen ? (
              <>
                <p className="text-sm text-slate-500 mb-6">Share this 4-digit code with your freelancer to grant them access to this workspace.</p>
                
                <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-200 flex items-center justify-between">
                  <span className="text-3xl font-mono tracking-[0.25em] font-black text-indigo-600 ml-2">
                    {showId ? userData?.agencyId : "****"}
                  </span>
                  <div className="flex items-center gap-1">
                    {showId && (
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(userData?.agencyId);
                          toast.success("ID Copied!");
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Copy ID"
                      >
                        <Copy className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={handleShowId}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="Click to view for 3s"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowConfirmRegen(true)}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate ID
                </Button>
              </>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-200 mt-4">
                <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-medium">
                      <p className="mb-2">Are you sure you want to regenerate?</p>
                      <ul className="list-disc pl-4 space-y-1 text-red-700/80">
                        <li>Your current ID will become invalid.</li>
                        <li>All connected freelancers will instantly lose access.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowConfirmRegen(false)}
                    disabled={isRegenerating}
                    className="flex-1 h-12 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={handleRegenerateId}
                    disabled={isRegenerating}
                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-white"
                  >
                    {isRegenerating ? "Regenerating..." : "Confirm"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={handleDismissUpgrade}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl relative my-8 overflow-hidden z-10 border border-white/50"
            >
              {/* Decorative Background Gradient */}
              <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10 blur-3xl pointer-events-none" />
              
              <div className="p-8 md:p-10 relative">
                <div className="flex flex-col items-center text-center mb-10">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-500/30 mb-6"
                  >
                    <Sparkles className="w-10 h-10" />
                  </motion.div>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                    What's New in PostFlow
                  </h3>
                  <p className="text-lg text-slate-500 font-medium max-w-md mx-auto">
                    We've crafted some powerful new features to make your workflow even smoother.
                  </p>
                </div>

                <div className="space-y-6 mb-10">
                  {/* Feature 1: Download ZIP */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] hover:border-indigo-100 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex gap-5">
                      <div className="bg-indigo-50 p-3 rounded-2xl h-fit shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Download ZIP in Library</h4>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-1.5 block">The Problem</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Downloading files one by one into folders takes a lot of time and can be tedious.</p>
                          </div>
                          <div>
                            <span className="text-xs font-black text-emerald-500 uppercase tracking-wider mb-1.5 block">The Solution</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Select multiple photos and click <b>"Download ZIP"</b>. It will ask for a folder name. The downloaded ZIP file and the folder inside it will both have this name, keeping your gallery perfectly organized in one click!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 2: Apply to All */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(217,70,239,0.1)] hover:border-fuchsia-100 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex gap-5">
                      <div className="bg-fuchsia-50 p-3 rounded-2xl h-fit shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-fuchsia-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Granular "Apply to All"</h4>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-black text-fuchsia-500 uppercase tracking-wider mb-1.5 block">The Problem</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Previously, applying a logo would also apply its position and size to everything, ruining your individual adjustments.</p>
                          </div>
                          <div>
                            <span className="text-xs font-black text-pink-500 uppercase tracking-wider mb-1.5 block">The Solution</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">You now have laser-focused control! Separate buttons let you apply <b>only</b> the Aspect Ratio, <b>only</b> the Logo, or <b>only</b> the Logo Settings independently across all photos.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Feature 3: WhatsApp Share */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="group relative bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.1)] hover:border-green-100 transition-all duration-300"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-green-400 to-emerald-600 rounded-l-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex gap-5">
                      <div className="bg-green-50 p-3 rounded-2xl h-fit shrink-0">
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xl tracking-tight mb-4">Native WhatsApp Share</h4>
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-black text-green-600 uppercase tracking-wider mb-1.5 block">The Problem</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Downloading a ZIP, extracting it, and then manually attaching 50 photos to WhatsApp is exhausting.</p>
                          </div>
                          <div>
                            <span className="text-xs font-black text-emerald-600 uppercase tracking-wider mb-1.5 block">The Solution</span>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">Just select your photos in the Library and click <b>"Send WhatsApp"</b>. It natively opens your device's share menu, letting you instantly send all selected photos directly to any WhatsApp chat!</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  <Button 
                    onClick={handleDismissUpgrade}
                    className="w-full h-16 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 font-bold text-white text-xl transition-all shadow-[0_10px_40px_rgb(99,102,241,0.4)] hover:shadow-[0_10px_50px_rgb(99,102,241,0.6)] hover:-translate-y-1 relative overflow-hidden group border-none"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Let's Explore 
                      <motion.span 
                        animate={{ x: [0, 5, 0] }} 
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        🚀
                      </motion.span>
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
