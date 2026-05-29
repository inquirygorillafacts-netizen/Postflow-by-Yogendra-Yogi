"use client";

import { Sidebar } from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ProcessingProvider } from "@/contexts/ProcessingContext";
import { useEffect, useState } from "react";
import { Shield, Eye, Copy, RefreshCw, X, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    if (!loading) {
      if (user === null) {
        router.push("/login");
      } else if (!userData || !userData.onboarded) {
        router.push("/onboarding");
      }
    }
  }, [user, userData, loading, router]);

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
    </div>
  );
}
