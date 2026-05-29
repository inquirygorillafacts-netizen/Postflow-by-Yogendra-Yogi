"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import localforage from "localforage";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, Filter, Download, Trash2, CheckSquare, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import JSZip from "jszip";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function LibraryPage() {
  const router = useRouter();
  const { activeWorkspace } = useAuth();
  
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Modals state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [previewPostIndex, setPreviewPostIndex] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [exportFolderName, setExportFolderName] = useState("RD_Models_Export");

  // Reset zoom when switching images
  useEffect(() => {
    setPreviewZoom(1);
  }, [previewPostIndex]);

  // Must be defined before useCallback hooks that reference it
  const filteredPosts = posts.filter(post =>
    post.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const goPreviewPrev = useCallback(() => {
    setPreviewPostIndex(i => (i > 0 ? i - 1 : filteredPosts.length - 1));
  }, [filteredPosts.length]);

  const goPreviewNext = useCallback(() => {
    setPreviewPostIndex(i => (i < filteredPosts.length - 1 ? i + 1 : 0));
  }, [filteredPosts.length]);

  // Keyboard arrow navigation for preview
  useEffect(() => {
    if (previewPostIndex === null) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') goPreviewPrev();
      if (e.key === 'ArrowRight') goPreviewNext();
      if (e.key === 'Escape') setPreviewPostIndex(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [previewPostIndex, goPreviewPrev, goPreviewNext]);

  useEffect(() => {
    if (!activeWorkspace) return;

    const q = query(
      collection(db, "users", activeWorkspace, "gallery"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(galleryData);
    });

    return () => unsubscribe();
  }, [activeWorkspace]);


  // Selection Logic
  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPosts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPosts.map(p => p.id)));
    }
  };

  // Bulk Delete
  const confirmDelete = async () => {
    if (!activeWorkspace) return;
    try {
      const promises = Array.from(selectedIds).map(id => deleteDoc(doc(db, "users", activeWorkspace, "gallery", id)));
      await Promise.all(promises);
      toast.success(`Deleted ${selectedIds.size} images from Library`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete images");
    } finally {
      setSelectedIds(new Set());
      setShowDeleteModal(false);
    }
  };

  // Bulk Export
  const confirmExport = async () => {
    if (selectedIds.size === 0) return;
    
    try {
      if (!window.showDirectoryPicker) {
        throw new Error("Your browser does not support saving directly to a folder. Please use Chrome or Edge.");
      }

      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folderHandle = await dirHandle.getDirectoryHandle(exportFolderName || "Library_Export", { create: true });

      let savedCount = 0;
      toast.loading("Saving files to folder...", { id: "export-toast" });

      for (const id of selectedIds) {
        const post = posts.find(p => p.id === id);
        if (post) {
          const url = post.processedUrl || post.originalUrl;
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Failed to fetch proxy");
          const blob = await response.blob();

          const fileHandle = await folderHandle.getFileHandle(post.filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          savedCount++;
        }
      }

      toast.success(`Successfully saved ${savedCount} files to folder!`, { id: "export-toast" });
      setShowExportModal(false);
      setSelectedIds(new Set());
    } catch (error) {
      if (error.name !== 'AbortError') {
         console.error(error);
         toast.error(error.message || "Export failed", { id: "export-toast" });
      } else {
         toast.dismiss("export-toast");
      }
    }
  };

  const handlePostAction = async (action, post) => {
    switch(action) {
      case 'delete':
        setSelectedIds(new Set([post.id]));
        setShowDeleteModal(true);
        break;
      case 'download':
        try {
          toast.loading(`Downloading ${post.filename}...`, { id: 'download' });
          const url = post.processedUrl || post.originalUrl;
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
          const response = await fetch(proxyUrl);
          if (!response.ok) throw new Error("Failed to fetch");
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = post.filename;
          link.click();
          
          URL.revokeObjectURL(blobUrl);
          toast.success(`Downloaded ${post.filename}`, { id: 'download' });
        } catch (e) {
          console.error("Failed to download image", e);
          toast.error("Failed to download", { id: 'download' });
        }
        break;
      case 'preview':
        const idx = filteredPosts.findIndex(p => p.id === post.id);
        if (idx !== -1) {
          setPreviewPostIndex(idx);
        }
        break;
      case 'edit':
        try {
          const restoredItem = {
            id: `re-edit-${post.id}`,
            reEditDocId: post.id,
            file: { name: post.filename }, // mock file object
            originalUrl: post.originalUrl,
            processedUrl: post.processedUrl,
            ...(post.savedSettings || {
              crop: { x: 0, y: 0 },
              zoom: 1,
              aspect: 1,
              naturalAspect: 1,
              showLogo: true,
              logoOpacity: 70,
              logoSizePercent: 30,
              logoPosPercent: { x: 50, y: 50 }
            })
          };

          // Get existing queue or create new
          const savedQueue = await localforage.getItem('bulkEdit_queuedImages') || [];
          
          if (savedQueue.length > 0) {
            // Stash the old queue so the user only edits the new one
            await localforage.setItem('bulkEdit_stashedQueue', savedQueue);
          }
          
          const newArr = [restoredItem];
          
          await localforage.setItem('bulkEdit_queuedImages', newArr);
          await localforage.setItem('bulkEdit_currentIndex', 0);
          
          toast.success("Image added to Edit Queue");
          router.push("/bulk-edit");
        } catch (err) {
          console.error("Failed to transfer to editor", err);
          toast.error("Failed to open in editor");
        }
        break;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto pb-12">
      <div className="sticky top-[-16px] lg:top-[-20px] bg-background/95 backdrop-blur-sm z-30 pt-4 lg:pt-5 pb-4 -mx-4 px-4 lg:-mx-5 lg:px-5 -mt-4 lg:-mt-5 mb-5 space-y-5 border-b border-border/40 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Post Library</h1>
            <p className="text-[13px] text-muted-foreground mt-0.5">Manage and export all your processed images.</p>
          </div>
          
          {/* Bulk Actions Toolbar */}
          {selectedIds.size > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 bg-card border border-border p-2 rounded-lg shadow-md"
            >
              <span className="text-sm font-medium px-3 text-primary">{selectedIds.size} selected</span>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteModal(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowExportModal(true)}>
                <Download className="w-4 h-4 mr-2" /> Export to Folder
              </Button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-3 rounded-xl border border-border shadow-sm">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search filenames..." 
              className="pl-9 w-full bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleSelectAll}>
              <CheckSquare className="w-4 h-4 mr-2" /> 
              {selectedIds.size === filteredPosts.length ? "Deselect All" : "Select All"}
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onAction={handlePostAction} 
            isSelected={selectedIds.has(post.id)}
            onToggleSelect={() => handleToggleSelect(post.id)}
          />
        ))}
        {filteredPosts.length === 0 && (
          <div className="col-span-full py-20 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
            <Filter className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No posts found matching your search.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} item(s)?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete the selected images? This action cannot be undone.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Folder Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save {selectedIds.size} item(s) to Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Create Folder Name</label>
            <Input 
              value={exportFolderName} 
              onChange={(e) => setExportFolderName(e.target.value)} 
              placeholder="e.g. RD_Models_Instagram" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              You will be prompted to select a destination on your computer. A folder with this name will be created there.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button onClick={confirmExport}>Select Destination & Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Preview Modal */}
      <Dialog open={previewPostIndex !== null} onOpenChange={(open) => !open && setPreviewPostIndex(null)}>
        <DialogContent className="!max-w-full !w-screen !h-screen !m-0 !p-0 !rounded-none !bg-black !border-none overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200">
          {/* Top bar */}
          <div className="flex items-center justify-between p-4 text-white shrink-0 absolute top-0 inset-x-0 z-50 pointer-events-auto bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full"
                onClick={() => setPreviewPostIndex(null)}
              >
                <X className="w-6 h-6" />
              </Button>
              <span className="font-medium text-lg">
                {previewPostIndex !== null && filteredPosts[previewPostIndex]?.filename}
              </span>
            </div>
            <span className="text-sm text-white/60">
              {previewPostIndex !== null ? `${previewPostIndex + 1} / ${filteredPosts.length}` : ''}
            </span>
          </div>
          
          {/* Image */}
          <div 
            className="flex-1 w-full h-full flex items-center justify-center p-4 md:p-16 select-none overflow-hidden relative"
            onWheel={(e) => {
              const newZoom = previewZoom + e.deltaY * -0.002;
              setPreviewZoom(Math.min(Math.max(0.5, newZoom), 8));
            }}
          >
            {previewPostIndex !== null && (
              <motion.img 
                key={previewPostIndex}
                src={filteredPosts[previewPostIndex]?.processedUrl || filteredPosts[previewPostIndex]?.originalUrl} 
                className="max-w-full max-h-full object-contain drop-shadow-2xl cursor-grab active:cursor-grabbing" 
                alt="Preview" 
                drag
                dragConstraints={{ left: -2000, right: 2000, top: -2000, bottom: 2000 }}
                dragElastic={0.1}
                animate={{ scale: previewZoom }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Zoom Controls Overlay */}
            {previewPostIndex !== null && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white z-50">
                <button 
                  onClick={() => setPreviewZoom(z => Math.max(0.5, z - 0.5))}
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium w-12 text-center">{Math.round(previewZoom * 100)}%</span>
                <button 
                  onClick={() => setPreviewZoom(z => Math.min(8, z + 0.5))}
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Left Nav Button */}
          {filteredPosts.length > 1 && (
            <button
              onClick={goPreviewPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Right Nav Button */}
          {filteredPosts.length > 1 && (
            <button
              onClick={goPreviewNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
