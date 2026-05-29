"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Building2, Phone, Image as ImageIcon, Trash2, UploadCloud, Loader2, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, userData, activeWorkspace } = useAuth();
  
  const [businessName, setBusinessName] = useState(userData?.businessName || "");
  const [phone, setPhone] = useState(userData?.phone ? userData.phone.replace("+91", "") : "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);

  // Logos management
  const logos = userData?.logos || [];

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!activeWorkspace) return;
    
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", activeWorkspace), {
        businessName,
        phone: phone ? `+91${phone}` : "",
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;
    
    if (logos.length >= 3) {
      toast.error("Maximum 3 logos allowed. Please delete one first.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Uploading logo...");
    
    try {
      const extension = file.name.split('.').pop() || 'png';
      const fileName = `logo-${Date.now()}.${extension}`;
      const storageRef = ref(storage, `users/${activeWorkspace}/logos/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newLogo = {
        id: Date.now().toString(),
        name: file.name,
        url,
        fileName
      };

      const updatedLogos = [...logos, newLogo];
      await updateDoc(doc(db, "users", activeWorkspace), {
        logos: updatedLogos
      });

      toast.success("Logo uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo", { id: toastId });
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteLogo = async (logo) => {
    if(!activeWorkspace) return;
    if(!confirm("Are you sure you want to delete this logo?")) return;

    try {
      // 1. Delete from Storage
      const storageRef = ref(storage, `users/${activeWorkspace}/logos/${logo.fileName}`);
      await deleteObject(storageRef).catch(e => console.log("Storage delete error", e));

      // 2. Remove from Firestore array
      const updatedLogos = logos.filter(l => l.id !== logo.id);
      await updateDoc(doc(db, "users", activeWorkspace), {
        logos: updatedLogos
      });

      toast.success("Logo deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete logo");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-800">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your business profile and watermarks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Profile Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-500" />
            Business Profile
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Business / Agency Name
              </label>
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. RD Models Studio"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                  placeholder="9876543210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-r-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-11 w-full mt-2"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </div>

        {/* Logo Manager */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Watermark Logos
              </h2>
              <p className="text-xs text-slate-500 mt-1">Upload up to 3 logos for your edits.</p>
            </div>
            <div className="bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full text-xs">
              {logos.length} / 3
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {logos.map((logo) => (
              <div key={logo.id} className="relative group bg-slate-50 border border-slate-200 rounded-2xl aspect-square flex items-center justify-center overflow-hidden p-4">
                <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="rounded-full shadow-lg"
                    onClick={() => handleDeleteLogo(logo)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {logos.length < 3 && (
              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 rounded-2xl aspect-square flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  ref={fileInputRef}
                  onChange={handleUploadLogo}
                  disabled={isUploading}
                />
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                ) : (
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-600">
                  {isUploading ? "Uploading..." : "Upload Logo"}
                </span>
                <span className="text-xs text-slate-400 mt-1">PNG or JPG</span>
              </label>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
