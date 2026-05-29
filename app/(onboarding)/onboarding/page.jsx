"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { Sparkles, Building2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (userData?.onboarded) {
      // Already onboarded
      router.push("/");
    }
  }, [user, userData, router]);

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

  const handleSubmit = async (e, isSkip = false) => {
    if(e && e.preventDefault) e.preventDefault();
    if (!isSkip && (!businessName.trim() || phone.length !== 10)) {
      return toast.error("Please provide valid details or click Skip.");
    }

    setIsLoading(true);
    
    try {
      const agencyId = await generateUniqueAgencyId();
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        businessName: isSkip ? "" : businessName,
        phone: isSkip ? "" : `+91${phone}`,
        agencyId,
        onboarded: true,
        createdAt: new Date().toISOString(),
        linkedAccounts: [],
      });
      
      setShowSuccess(true);
      // Wait for animation
      setTimeout(() => {
        window.location.href = "/"; // hard reload to refresh context
      }, 2500);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  if (!user || userData?.onboarded) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50/50 p-4">
      
      {showSuccess ? (
        <div className="flex flex-col items-center animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-12 h-12 text-green-500 animate-bounce" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Welcome to PostFlow Pro!</h1>
          <p className="text-slate-500">Setting up your workspace...</p>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
          {step === 1 && (
            <div className="animate-in slide-in-from-left-4 fade-in duration-300">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-2">Welcome to PostFlow Pro</h1>
              <p className="text-sm text-slate-500 mb-8">
                We're excited to have you on board! Let's get your agency workspace set up in just a few steps.
              </p>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={() => setStep(2)}
                  className="w-full h-12 text-md font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                >
                  Get Started
                </Button>
                <Button 
                  variant="ghost"
                  disabled={isLoading}
                  onClick={async () => {
                    setBusinessName("");
                    setPhone("");
                    await handleSubmit(null, true);
                  }}
                  className="w-full h-12 text-md font-medium rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                >
                  Skip for now
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-6">
                <Building2 className="w-8 h-8 text-indigo-600" />
              </div>
              
              <h1 className="text-2xl font-black text-slate-900 mb-2">Agency Details</h1>
              <p className="text-sm text-slate-500 mb-8">
                Tell us a bit about your business to personalize your workspace.
              </p>

              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    Business / Agency Name
                  </label>
                  <input 
                    type="text" 
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. RD Models Studio"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                    WhatsApp Number
                  </label>
                  <div className="flex">
                    <span className="flex items-center justify-center px-4 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-slate-600 font-medium">
                      +91
                    </span>
                    <input 
                      type="text" 
                      maxLength={10}
                      pattern="[0-9]{10}"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210 (Optional)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-4 pt-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                    className="flex-1 h-12 text-md font-bold rounded-xl text-slate-600 hover:bg-slate-50"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 h-12 text-md font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  >
                    {isLoading ? "Setting up..." : "Complete Setup"}
                  </Button>
                </div>
                <Button 
                  type="button"
                  variant="ghost"
                  disabled={isLoading}
                  onClick={async (e) => {
                    setBusinessName("");
                    setPhone("");
                    await handleSubmit(e, true);
                  }}
                  className="w-full h-10 text-sm font-medium rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 mt-1"
                >
                  Skip for now
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
