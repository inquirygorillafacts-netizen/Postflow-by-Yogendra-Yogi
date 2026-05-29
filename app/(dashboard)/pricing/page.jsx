"use client";

import { useState } from "react";
import { Check, Zap, Building2, Shield, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function PricingPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setShowMockRazorpay(true);
  };

  const handlePaymentSuccess = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowMockRazorpay(false);
      toast.success("Payment Successful! Welcome to Pro.");
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      
      {/* Mock Razorpay Popup */}
      {showMockRazorpay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Razorpay Header */}
            <div className="bg-blue-600 p-4 text-white flex justify-between items-start">
              <div>
                <div className="font-bold mb-1">PostFlow Pro</div>
                <div className="text-sm opacity-90">{selectedPlan?.name} Subscription</div>
                <div className="text-2xl font-semibold mt-2">₹{selectedPlan?.price}</div>
              </div>
              <button onClick={() => setShowMockRazorpay(false)} className="opacity-80 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Razorpay Body */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center gap-3 cursor-pointer hover:border-blue-500">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">UPI</div>
                  <div className="text-sm font-medium">Pay with UPI</div>
                </div>
                <div className="bg-slate-50 p-3 rounded border border-slate-200 flex items-center gap-3 cursor-pointer hover:border-blue-500">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">💳</div>
                  <div className="text-sm font-medium">Cards (Credit/Debit)</div>
                </div>
              </div>

              <Button 
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 h-12 text-md"
                onClick={handlePaymentSuccess}
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : `Pay ₹${selectedPlan?.price}`}
              </Button>

              <div className="text-center mt-4 text-[10px] text-slate-400 font-medium">
                🔒 Secured by Razorpay (Mock)
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Simple, transparent pricing</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          No hidden fees. No surprise charges. Choose the plan that best fits your agency's needs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Starter Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
          <p className="text-sm text-slate-500 mb-6">Perfect for individuals starting out.</p>
          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900">Free</span>
          </div>
          <Button className="w-full mb-8 bg-slate-100 text-slate-900 hover:bg-slate-200" disabled>
            Current Plan
          </Button>
          <div className="space-y-4">
            <FeatureItem text="Up to 50 edits per day" />
            <FeatureItem text="Basic watermarking" />
            <FeatureItem text="Standard export quality" />
            <FeatureItem text="Community support" />
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-indigo-600 rounded-3xl p-8 border border-indigo-500 shadow-xl shadow-indigo-200 transform md:-translate-y-4 relative">
          <div className="absolute top-0 right-8 transform -translate-y-1/2">
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </span>
          </div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" /> Pro
          </h3>
          <p className="text-sm text-indigo-200 mb-6">For power users and small teams.</p>
          <div className="mb-6">
            <span className="text-4xl font-black text-white">₹999</span>
            <span className="text-indigo-200">/mo</span>
          </div>
          <Button 
            className="w-full mb-8 bg-white text-indigo-600 hover:bg-indigo-50 font-bold"
            onClick={() => handleSubscribe({ name: "Pro", price: 999 })}
          >
            Upgrade to Pro
          </Button>
          <div className="space-y-4 text-white">
            <FeatureItem text="Unlimited edits" light />
            <FeatureItem text="HD/4K export quality" light />
            <FeatureItem text="AI Background Removal" light />
            <FeatureItem text="Link 1 Freelancer Account" light />
            <FeatureItem text="Priority email support" light />
          </div>
        </div>

        {/* Agency Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-700" /> Agency
          </h3>
          <p className="text-sm text-slate-500 mb-6">For large teams and enterprises.</p>
          <div className="mb-6">
            <span className="text-4xl font-black text-slate-900">₹2499</span>
            <span className="text-slate-500">/mo</span>
          </div>
          <Button 
            className="w-full mb-8 bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => handleSubscribe({ name: "Agency", price: 2499 })}
          >
            Get Agency
          </Button>
          <div className="space-y-4">
            <FeatureItem text="Everything in Pro" />
            <FeatureItem text="Link Unlimited Freelancers" />
            <FeatureItem text="Custom domain integration" />
            <FeatureItem text="API Access" />
            <FeatureItem text="24/7 Phone support" />
          </div>
        </div>

      </div>
    </div>
  );
}

function FeatureItem({ text, light = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${light ? 'bg-indigo-500/50 text-white' : 'bg-green-100 text-green-600'}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className={`text-sm ${light ? 'text-indigo-50' : 'text-slate-600'}`}>{text}</span>
    </div>
  );
}
