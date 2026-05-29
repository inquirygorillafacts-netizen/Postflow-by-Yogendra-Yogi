"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Shield, CreditCard, Bell, Settings as SettingsIcon, Eye, RefreshCw, Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userData, logout } = useAuth();
  const router = useRouter();
  
  const [imageError, setImageError] = useState(false);

  const handleShowId = () => {
    setShowId(true);
    setTimeout(() => {
      setShowId(false);
    }, 3000); // hides after 3 seconds
  };

  const handleRegenerateId = async () => {
    if(!confirm("Are you sure? This will disconnect all currently linked freelancers instantly.")) return;
    try {
      const newAgencyId = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(db, "users", user.uid), {
        agencyId: newAgencyId,
        allowedFreelancers: [] // Clear all allowed freelancers
      });
      alert("Agency ID regenerated! All previous access has been revoked.");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to regenerate ID");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4">
      <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: User Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-indigo-50 mb-4 overflow-hidden shadow-inner border-4 border-white flex items-center justify-center relative">
              {user?.photoURL && !imageError ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                  <User className="w-10 h-10 text-white animate-pulse" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {user?.displayName || "Admin User"}
            </h2>
            <p className="text-sm text-slate-500 mb-6 flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              {user?.email || "No email provided"}
            </p>
            
            <Button 
              variant="destructive" 
              className="w-full rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border-none shadow-none"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="font-bold mb-2">Pro Subscription</h3>
            <p className="text-indigo-100 text-sm mb-4">Unlimited cloud storage and AI editing features.</p>
            <div className="bg-white/20 rounded-lg h-2 mb-2">
              <div className="bg-white w-3/4 h-full rounded-lg" />
            </div>
            <p className="text-xs text-indigo-100 mb-4">75% Storage Used</p>
            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 border-none rounded-xl text-xs h-9" onClick={() => router.push('/pricing')}>
              Upgrade Plan
            </Button>
          </div>

          {/* Freelancer Access Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-1">Freelancer Access</h3>
            <p className="text-xs text-slate-500 mb-4">You can manage and view your Agency ID by clicking the "My Agency ID" button in the top right corner of the dashboard.</p>
          </div>

          {/* Connected Freelancers Section */}
          {userData?.allowedFreelancers?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Connected Freelancers
              </h3>
              <div className="space-y-3">
                {userData.allowedFreelancers.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">{f.name}</h4>
                      <p className="text-xs text-slate-500">{f.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Settings */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-slate-400" />
              Account Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm">Personal Information</h4>
                    <p className="text-xs text-slate-500">Update your name and photo</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Edit</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm">Security</h4>
                    <p className="text-xs text-slate-500">Password and authentication</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">Manage</Button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-400" />
              Preferences
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm">Email Notifications</h4>
                  <p className="text-xs text-slate-500">Receive updates about your exports</p>
                </div>
                <div className="w-11 h-6 bg-indigo-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-semibold text-slate-700 text-sm">Marketing Emails</h4>
                  <p className="text-xs text-slate-500">Receive news and offers</p>
                </div>
                <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1 shadow-sm" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
