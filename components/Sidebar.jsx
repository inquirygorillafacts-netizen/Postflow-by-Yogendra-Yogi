import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Images,
  Upload,
  Calendar,
  Layers,
  Camera,
  Settings,
  User,
  LogOut,
  X,
  Link as LinkIcon,
  Loader2,
  PlusCircle,
  ChevronDown,
  Check
} from "lucide-react";
import toast from "react-hot-toast";
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

const mainNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Single Edit", icon: Upload },
  { href: "/bulk-edit", label: "Bulk Edit", icon: Layers },
  { href: "/library", label: "Library", icon: Images },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/instagram", label: "Instagram", icon: Camera },
];

const bottomNavItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, userData, logout, activeWorkspace, switchWorkspace } = useAuth();
  
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [linkId, setLinkId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [linkError, setLinkError] = useState("");

  const handleLinkWorkspace = async () => {
    setIsLinking(true);
    setLinkError("");
    
    if (linkId === userData?.agencyId) {
      setLinkError("You cannot link your own workspace.");
      setIsLinking(false);
      return;
    }

    try {
      const q = query(collection(db, "users"), where("agencyId", "==", linkId));
      const snapshot = await getDocs(q);
      
      if(snapshot.empty) {
        setLinkError("Invalid Agency ID");
        setIsLinking(false);
        return;
      }
      
      const clientDoc = snapshot.docs[0];
      const clientData = clientDoc.data();
      
      // Add to current user's linkedAccounts
      await updateDoc(doc(db, "users", user.uid), {
        linkedAccounts: arrayUnion({
          uid: clientDoc.id,
          businessName: clientData.businessName,
          agencyId: clientData.agencyId
        })
      });

      // Add to Owner's allowedFreelancers
      await updateDoc(doc(db, "users", clientDoc.id), {
        allowedFreelancers: arrayUnion({
          uid: user.uid,
          email: user.email,
          name: user.displayName || "Freelancer"
        })
      });
      
      toast.success("Client Workspace Linked!");
      setShowLinkModal(false);
      setLinkId("");
      switchWorkspace(clientDoc.id); // auto switch to it
    } catch (err) {
      console.error(err);
      setLinkError("Failed to connect. Try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const renderLink = (item) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-colors overflow-hidden group text-[13px] lg:text-sm
          ${isActive ? "text-primary font-medium" : "text-foreground/70 hover:text-foreground hover:bg-muted"}
        `}
      >
        {/* Animated green left border on hover or active */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full"
            initial={false}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full -translate-x-full group-hover:translate-x-0 transition-transform duration-200" />
        
        <item.icon className="w-4.5 h-4.5 z-10" />
        <span className="z-10">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="w-[235px] flex-shrink-0 bg-card border-r border-border h-full flex flex-col justify-between">
      <div>
        <div className="p-4.5 flex flex-col gap-3 border-b border-slate-100 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-7.5 h-7.5 bg-primary rounded-md flex items-center justify-center text-white font-bold text-lg">
              RD
            </div>
            <span className="font-bold text-base tracking-tight">PostFlow</span>
          </div>
          
          {/* Workspace Switcher */}
          <div className="flex flex-col gap-2 mt-2 relative">
            {userData?.linkedAccounts && userData.linkedAccounts.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/50 rounded-xl text-xs p-2.5 outline-none flex items-center justify-between transition-all"
                >
                  <div className="flex flex-col items-start gap-0.5 overflow-hidden">
                    <span className="font-semibold text-slate-800 truncate w-full text-left">
                      {activeWorkspace === user?.uid 
                        ? `My Workspace (${userData.businessName || "Me"})`
                        : `${userData.linkedAccounts.find(a => a.uid === activeWorkspace)?.businessName || "Client"}'s Workspace`
                      }
                    </span>
                    {activeWorkspace !== user?.uid && (
                      <span className="text-[10px] font-mono font-medium text-indigo-600 bg-indigo-100/50 px-1.5 py-0.5 rounded">
                        ID: {userData.linkedAccounts.find(a => a.uid === activeWorkspace)?.agencyId || "****"}
                      </span>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 z-50 overflow-hidden"
                    >
                      <div className="p-1 max-h-48 overflow-y-auto scrollbar-thin">
                        <button
                          onClick={() => {
                            switchWorkspace(user?.uid);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors ${activeWorkspace === user?.uid ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                        >
                          <span>My Workspace ({userData.businessName || "Me"})</span>
                          {activeWorkspace === user?.uid && <Check className="w-3.5 h-3.5" />}
                        </button>
                        
                        {userData.linkedAccounts.map((acc, idx) => (
                          <button
                            key={`${acc.uid}-${idx}`}
                            onClick={() => {
                              switchWorkspace(acc.uid);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors mt-0.5 ${activeWorkspace === acc.uid ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'}`}
                          >
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="truncate">{acc.businessName}'s Workspace</span>
                              <span className="text-[10px] font-mono text-slate-400">ID: {acc.agencyId || "****"}</span>
                            </div>
                            {activeWorkspace === acc.uid && <Check className="w-3.5 h-3.5 flex-shrink-0 text-indigo-600" />}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            <button 
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors w-full justify-center border border-indigo-100/50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Link New Workspace
            </button>
          </div>
        </div>
        
        <div className="px-3 flex flex-col gap-1 mt-3">
          {mainNavItems.map(renderLink)}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-1 border-t border-border mt-auto">
        {bottomNavItems.map(renderLink)}
        <button
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-1.5 text-left w-full text-[13px] lg:text-sm"
          onClick={logout}
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Logout</span>
        </button>
      </div>

      {/* Link Workspace Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 shadow-xl w-full max-w-sm border border-slate-100 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => {
                setShowLinkModal(false);
                setLinkId("");
                setLinkError("");
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-indigo-500" />
              Link Workspace
            </h3>
            <p className="text-sm text-slate-500 mb-6">Enter the 4-digit Agency ID provided by your client.</p>

            {isLinking ? (
              <div className="flex flex-col items-center justify-center py-6">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                <p className="text-sm font-semibold text-slate-700 animate-pulse">Connecting to Workspace...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="0000" 
                    maxLength={4}
                    value={linkId}
                    onChange={(e) => {
                      setLinkId(e.target.value.replace(/\D/g, ''));
                      setLinkError("");
                    }}
                    className={`w-full bg-slate-50 border ${linkError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-indigo-500'} rounded-xl px-4 py-3 text-center tracking-[0.5em] font-mono text-2xl font-black focus:outline-none focus:ring-2 transition-all`} 
                  />
                  {linkError && <p className="text-xs text-red-500 mt-2 font-medium flex justify-center">{linkError}</p>}
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => {
                      setShowLinkModal(false);
                      setLinkId("");
                      setLinkError("");
                    }}
                    className="flex-1 h-12 text-sm font-bold rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleLinkWorkspace}
                    disabled={linkId.length !== 4}
                    className="flex-1 h-12 text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {linkError ? "Retry" : "Connect"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
