"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Layers, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      toast.success("Successfully logged in!");
      router.push("/");
    } catch (error) {
      toast.error("Failed to login with Google");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50 to-pink-50">
      
      {/* Floating Background Shapes */}
      <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] bg-primary rounded-full opacity-10 animate-[floatSlow_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] bg-blue-500 rounded-full opacity-10 animate-[floatSlow_6s_ease-in-out_infinite_2s]" />
      <div className="absolute top-[40%] left-[10%] w-[200px] h-[200px] bg-indigo-500 rounded-full opacity-10 animate-[floatSlow_6s_ease-in-out_infinite_4s]" />
      <div className="absolute bottom-[20%] right-[15%] w-[150px] h-[150px] bg-pink-500 rounded-full opacity-10 animate-[floatSlow_6s_ease-in-out_infinite_1s]" />

      <div className="w-full max-w-[420px] p-4 relative z-10">
        
          {/* Glassmorphism Card Container (Perspective for 3D flip) */}
          <div className="relative w-full" style={{ perspective: "1000px" }}>
            <motion.div
              className="w-full h-full relative"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              
              {/* Front Side (Login) */}
              <div 
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-10 shadow-[0_25px_50px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.5)] w-full min-h-[460px] flex flex-col justify-center backface-hidden"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-5 flex-shrink-0 shadow-lg shadow-indigo-500/30 animate-[float_3s_ease-in-out_infinite]">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                
                <h1 className="text-center mb-1 text-2xl font-black tracking-tight text-slate-900">PostFlow Pro</h1>
                <p className="text-center text-sm text-slate-500 mb-8 flex items-center justify-center gap-1.5">
                  by <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent font-black text-lg tracking-tight">Yogendra Yogi</span>
                </p>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 p-3.5 bg-white border-2 border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-pointer transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-[1px] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {isLoading ? "Signing in..." : "Continue with Google"}
                </button>

                <div className="flex items-center gap-4 my-5 text-xs text-slate-400">
                  <div className="flex-1 h-px bg-slate-200" />
                  or secure access
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                <div className="text-center mt-6 flex flex-col gap-2 items-center">
                  <p className="text-xs text-slate-400">Admin Access Only. <button onClick={() => setIsFlipped(true)} className="text-primary font-bold hover:underline">Contact Support</button></p>
                  <motion.span 
                    animate={{ scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(52,211,153,0)", "0 0 20px rgba(52,211,153,0.6)", "0 0 0px rgba(52,211,153,0)"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-[11px] font-black text-white tracking-wider uppercase mt-1 relative overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" style={{ transform: "skewX(-20deg)" }} />
                    <span className="relative z-10 drop-shadow-md">🎉 15 Days Free Trial</span>
                  </motion.span>
                </div>
              </div>

              {/* Back Side (Support) */}
              <div 
                className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-10 shadow-[0_25px_50px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.5)] w-full absolute top-0 left-0 h-full flex flex-col justify-center backface-hidden"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex-1 flex flex-col items-center justify-center text-center mt-0">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                    <Layers className="w-8 h-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Yogendra Yogi</h2>
                  <p className="text-sm font-medium text-slate-500 mb-5">+91 8302806913</p>

                  <div className="w-full flex flex-col gap-3 px-2">
                    <a 
                      href="tel:+918302806913" 
                      className="w-full flex items-center justify-center gap-3 p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
                    >
                      <Phone className="w-4 h-4" />
                      Call Now
                    </a>
                    <a 
                      href="https://wa.me/918302806913" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 p-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-sm font-bold shadow-md shadow-green-200 transition-all active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-200 w-full flex justify-center pb-0">
                  <button 
                    onClick={() => setIsFlipped(false)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

        {/* Features Row */}
        <div className="flex justify-center gap-6 mt-8 opacity-0 animate-[fade-in_0.6s_ease-out_0.3s_forwards]">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            AI Powered
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <svg className="w-4 h-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
            Secure Cloud
          </div>
        </div>
      </div>
    </div>
  );
}
