"use client";

import { Construction, Sparkles, Image as ImageIcon, Eraser, Type, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SingleUploadPage() {
  const router = useRouter();

  const upcomingFeatures = [
    {
      icon: <ImageIcon className="w-5 h-5 text-indigo-500" />,
      title: "Advanced AI Background Removal",
      desc: "Remove or replace backgrounds with just one click."
    },
    {
      icon: <Eraser className="w-5 h-5 text-pink-500" />,
      title: "Smart Object Eraser",
      desc: "Instantly remove unwanted people or objects from your photos."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: "Custom Filters & Color Grading",
      desc: "Professional LUTs and color correction tools."
    },
    {
      icon: <Crop className="w-5 h-5 text-emerald-500" />,
      title: "AI Auto-Crop",
      desc: "Automatically frame your subject for Instagram and TikTok."
    },
    {
      icon: <Type className="w-5 h-5 text-blue-500" />,
      title: "Advanced Typography",
      desc: "Add beautiful 3D text and typography overlays."
    }
  ];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-3xl border border-slate-100">
      
      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Construction className="w-10 h-10 text-indigo-600 animate-pulse" />
      </div>

      <h1 className="text-3xl font-black tracking-tight text-slate-800 mb-2">
        Single Edit is Evolving!
      </h1>
      <p className="text-slate-500 text-center max-w-md mb-8">
        Since you can already edit single photos in the <span className="font-semibold text-slate-700">Bulk Edit</span> section, we are transforming this page into an Advanced Pro Editor.
      </p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 w-full max-w-2xl mb-8">
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          Upcoming Pro Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upcomingFeatures.map((feat, idx) => (
            <div key={idx} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
              <div className="mt-1">{feat.icon}</div>
              <div>
                <h3 className="font-semibold text-sm text-slate-800">{feat.title}</h3>
                <p className="text-xs text-slate-500 leading-snug mt-1">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button 
        onClick={() => router.push('/bulk-edit')}
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-12 shadow-md shadow-indigo-200"
      >
        Go to Bulk Edit
      </Button>
    </div>
  );
}
