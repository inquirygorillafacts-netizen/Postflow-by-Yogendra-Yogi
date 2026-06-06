"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import localforage from "localforage";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, increment } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useProcessing } from "@/contexts/ProcessingContext";
import Cropper from "react-easy-crop";
import { UploadZone } from "@/components/UploadZone";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckSquare, Trash2, Download, Play, Layers, Clock, ZoomIn, ZoomOut, Move, ChevronLeft, ChevronRight, X, Search, UploadCloud, Plus } from "lucide-react";
import JSZip from "jszip";
import { createProcessedImage } from "@/lib/canvasUtils";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";


const ASPECT_RATIOS = [
  { label: "1:1 Square", value: 1 },
  { label: "4:5 Portrait", value: 4 / 5 },
  { label: "16:9 Landscape", value: 16 / 9 },
  { label: "9:16 Story", value: 9 / 16 },
  { label: "Original", value: null },
];

export default function BulkEditPage() {
  const { user, userData, activeWorkspace } = useAuth();
  const [queuedImages, setQueuedImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [workspaceData, setWorkspaceData] = useState(null);

  const [logoUrl, setLogoUrl] = useState("/logo.png");

  // Track exact crop box size using DOM observer
  const containerRef = useRef(null);
  const [cropBoxRect, setCropBoxRect] = useState(null);

  useEffect(() => {
    let observer;
    let timeout;

    const initObserver = () => {
      const cropArea = document.querySelector('.reactEasyCrop_CropArea');
      if (cropArea && containerRef.current) {
        observer = new ResizeObserver(() => {
          const containerRect = containerRef.current.getBoundingClientRect();
          const cropRect = cropArea.getBoundingClientRect();

          setCropBoxRect({
            width: cropRect.width,
            height: cropRect.height,
            left: cropRect.left - containerRect.left + (cropRect.width / 2),
            top: cropRect.top - containerRect.top + (cropRect.height / 2),
          });
        });
        observer.observe(cropArea);
        observer.observe(containerRef.current);
      } else {
        timeout = setTimeout(initObserver, 100);
      }
    };

    initObserver();

    return () => {
      if (observer) observer.disconnect();
      clearTimeout(timeout);
    };
  }, [currentIndex, queuedImages[currentIndex]?.aspect, queuedImages[currentIndex]?.naturalAspect]);

  const getCropBoxStyle = () => {
    if (!cropBoxRect) return { display: 'none' };

    return {
      width: `${cropBoxRect.width}px`,
      height: `${cropBoxRect.height}px`,
      position: 'absolute',
      left: `${cropBoxRect.left}px`,
      top: `${cropBoxRect.top}px`,
      transform: 'translate(-50%, -50%)',
      zIndex: 10,
      pointerEvents: 'none'
    };
  };

  // Processing State
  const { isProcessing, startProcessing } = useProcessing();
  const [gallery, setGallery] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Gallery Selection State
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFolderName, setExportFolderName] = useState("Bulk_Export");

  // Preview Modal State
  const [previewPostIndex, setPreviewPostIndex] = useState(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewCrop, setPreviewCrop] = useState({ x: 0, y: 0 });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedLogo = localStorage.getItem("companyLogo");
    if (savedLogo) setLogoUrl(savedLogo);

    // Load persisted state from localforage for queued items
    async function loadData() {
      try {
        const savedQueue = await localforage.getItem('bulkEdit_queuedImages');
        const savedIndex = await localforage.getItem('bulkEdit_currentIndex');

        if (savedQueue && Array.isArray(savedQueue)) {
          const restoredQueue = savedQueue.map(item => {
            let restoredUrl = item.originalUrl;
            if (!restoredUrl && item.file) {
              try {
                restoredUrl = URL.createObjectURL(item.file);
              } catch (e) {
                console.warn("Could not create object URL for file", item.file);
              }
            }

            // Legacy conversion to multiple logos
            let newLogos = item.logos || [];
            if (newLogos.length === 0 && item.showLogo && item.logoUrl) {
              newLogos.push({
                id: Math.random().toString(36).substring(7),
                url: item.logoUrl,
                opacity: item.logoOpacity !== undefined ? item.logoOpacity : 70,
                size: item.logoSizePercent !== undefined ? item.logoSizePercent : 30,
                position: item.logoPosPercent || { x: 50, y: 50 }
              });
            }

            return {
              ...item,
              logos: newLogos,
              originalUrl: restoredUrl
            };
          });
          setQueuedImages(restoredQueue);
        }

        if (savedIndex !== null) setCurrentIndex(savedIndex);
      } catch (err) {
        console.error("Failed to load state", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();

    // Load gallery from Firebase Firestore if activeWorkspace exists
    if (activeWorkspace) {
      const q = query(collection(db, "users", activeWorkspace, "gallery"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const galleryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGallery(galleryData);
      });
      return () => unsubscribe();
    }
  }, [activeWorkspace]);

  // Fetch logos from the activeWorkspace Firestore document in real-time
  useEffect(() => {
    if (!activeWorkspace) return;
    const unsub = onSnapshot(doc(db, "users", activeWorkspace), (snap) => {
      if (snap.exists()) setWorkspaceData(snap.data());
      else setWorkspaceData(null);
    });
    return () => unsub();
  }, [activeWorkspace]);

  // Save state to localforage when it changes (Debounced)
  useEffect(() => {
    if (!isLoaded) return;

    const timeout = setTimeout(() => {
      // Save queue
      const queueToSave = queuedImages.map(item => {
        const { originalUrl, ...rest } = item;
        // Keep originalUrl if it is a permanent remote URL (http/https)
        if (originalUrl && originalUrl.startsWith('http')) {
          return { ...rest, originalUrl };
        }
        return rest;
      });
      localforage.setItem('bulkEdit_queuedImages', queueToSave);
      localforage.setItem('bulkEdit_currentIndex', currentIndex);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [queuedImages, currentIndex, isLoaded]);

  const handleFilesAdded = (newFiles) => {
    const allowed = newFiles.slice(0, 500 - queuedImages.length);
    if (allowed.length < newFiles.length) {
      toast.error("Maximum 500 files allowed.");
    }

    let defaultSettings = {
      aspect: 1,
      logos: [{
        id: Math.random().toString(36).substring(7),
        url: logoUrl,
        opacity: 70,
        size: 30,
        position: { x: 50, y: 50 }
      }]
    };

    const savedSettings = localStorage.getItem("editorSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        defaultSettings = { ...defaultSettings, ...parsed };
      } catch (e) { }
    }

    const newQueued = allowed.map(file => ({
      id: `q-${Date.now()}-${Math.random()}`,
      file,
      originalUrl: URL.createObjectURL(file),
      crop: { x: 0, y: 0 },
      zoom: 1,
      naturalAspect: 1,
      ...defaultSettings,
      logos: defaultSettings.logos ? JSON.parse(JSON.stringify(defaultSettings.logos)) : []
    }));

    setQueuedImages([...queuedImages, ...newQueued]);
  };

  const updateCurrentImage = (updater) => {
    setQueuedImages(prev => {
      const newImages = [...prev];
      newImages[currentIndex] = { ...newImages[currentIndex], ...updater };
      return newImages;
    });
  };

  const currentImage = queuedImages[currentIndex];

  const logos = workspaceData?.logos || userData?.logos || [];
  const activeLogoUrl = currentImage?.logoUrl || (logos.length > 0 ? logos[0].url : logoUrl);

  const handleApplyLogosToAll = () => {
    if (!currentImage) return;
    setQueuedImages(prev => prev.map(img => ({
      ...img,
      logos: currentImage.logos ? JSON.parse(JSON.stringify(currentImage.logos)) : []
    })));
    toast.success("All logos applied to all images!");
  };

  const handleApplyAspectToAll = () => {
    if (!currentImage) return;
    setQueuedImages(prev => prev.map(img => ({
      ...img,
      aspect: currentImage.aspect
    })));
    toast.success("Aspect ratio applied to all images!");
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspace) return;

    if (logos.length >= 3) {
      toast.error("Maximum 3 logos allowed. Please delete one from Settings.");
      return;
    }

    const toastId = toast.loading("Uploading logo...");

    try {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const { doc, updateDoc } = await import("firebase/firestore");
      const { storage, db } = await import("@/lib/firebase");

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

      updateCurrentImage({ logoUrl: url }); // Auto select newly uploaded logo

      toast.success("Logo uploaded successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload logo", { id: toastId });
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    updateCurrentImage({ croppedArea, croppedAreaPixels });
  }, [currentIndex]);

  const onMediaLoaded = useCallback((mediaSize) => {
    updateCurrentImage({ naturalAspect: mediaSize.width / mediaSize.height });
  }, [currentIndex]);

  const handleRun = async () => {
    if (queuedImages.length === 0) return toast.error("Upload some images first!");
    if (!activeWorkspace) return toast.error("Please login to save to database!");

    // Trigger global processing
    const activeLogos = workspaceData?.logos || [];
    await startProcessing(queuedImages, activeWorkspace, activeLogos);

    // Clear local queue immediately after starting
    const stashedQueue = await localforage.getItem('bulkEdit_stashedQueue');
    if (stashedQueue && stashedQueue.length > 0) {
      const restoredStash = stashedQueue.map(item => {
        let restoredUrl = item.originalUrl;
        if (!restoredUrl && item.file) {
          try { restoredUrl = URL.createObjectURL(item.file); } catch (e) { console.warn(e); }
        }
        return { ...item, originalUrl: restoredUrl };
      });
      setQueuedImages(restoredStash);
      setCurrentIndex(0);
      await localforage.setItem('bulkEdit_queuedImages', stashedQueue);
      await localforage.setItem('bulkEdit_currentIndex', 0);
      await localforage.removeItem('bulkEdit_stashedQueue');
      setTimeout(() => toast.success("Previous images restored to queue!"), 500);
    } else {
      setQueuedImages([]);
      setCurrentIndex(0);
      await localforage.removeItem('bulkEdit_queuedImages');
      await localforage.removeItem('bulkEdit_currentIndex');
    }
  };

  const handleClear = async () => {
    const stashedQueue = await localforage.getItem('bulkEdit_stashedQueue');
    if (stashedQueue && stashedQueue.length > 0) {
      const restoredStash = stashedQueue.map(item => {
        let restoredUrl = item.originalUrl;
        if (!restoredUrl && item.file) {
          try { restoredUrl = URL.createObjectURL(item.file); } catch (e) { console.warn(e); }
        }
        return { ...item, originalUrl: restoredUrl };
      });
      setQueuedImages(restoredStash);
      setCurrentIndex(0);
      await localforage.setItem('bulkEdit_queuedImages', stashedQueue);
      await localforage.setItem('bulkEdit_currentIndex', 0);
      await localforage.removeItem('bulkEdit_stashedQueue');
      toast.success("Previous images restored to queue!");
    } else {
      setQueuedImages([]);
      setCurrentIndex(0);
      await localforage.removeItem('bulkEdit_queuedImages');
      await localforage.removeItem('bulkEdit_currentIndex');
    }
  };

  const getValue = (val) => (Array.isArray(val) ? val[0] : val);

  // Gallery Bulk Actions
  const handleToggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredGallery.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredGallery.map(p => p.id)));
  };

  const confirmDelete = async () => {
    if (!activeWorkspace) return;
    try {
      const promises = Array.from(selectedIds).map(id => deleteDoc(doc(db, "users", activeWorkspace, "gallery", id)));
      await Promise.all(promises);
      toast.success("Deleted successfully from Cloud");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete from cloud");
    } finally {
      setSelectedIds(new Set());
      setShowDeleteModal(false);
    }
  };

  const confirmExport = async () => {
    if (selectedIds.size === 0) return;

    try {
      if (!window.showDirectoryPicker) {
        throw new Error("Your browser does not support saving directly to a folder. Please use Chrome or Edge.");
      }

      const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
      const folderHandle = await dirHandle.getDirectoryHandle(exportFolderName || "Bulk_Export", { create: true });

      let savedCount = 0;
      toast.loading("Saving files to folder...", { id: "export-toast" });

      for (const id of selectedIds) {
        const post = gallery.find(p => p.id === id);
        if (post) {
          const response = await fetch(post.processedUrl || post.originalUrl);
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

  // Re-Edit Action
  const handlePostAction = async (action, post) => {
    if (action === 'delete') {
      setSelectedIds(new Set([post.id]));
      setShowDeleteModal(true);
    } else if (action === 'preview') {
      const idx = filteredGallery.findIndex(p => p.id === post.id);
      if (idx !== -1) {
        setPreviewPostIndex(idx);
        setPreviewZoom(1);
        setPreviewCrop({ x: 0, y: 0 });
      }
    } else if (action === 'download') {
      try {
        toast.loading(`Downloading ${post.filename}...`, { id: 'download-toast' });
        const url = post.processedUrl || post.originalUrl;
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Failed to fetch");
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = post.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(blobUrl);
        toast.success(`Downloaded ${post.filename}`, { id: 'download-toast' });
      } catch (e) {
        console.error("Failed to download image", e);
        toast.error("Failed to download", { id: 'download-toast' });
      }
    } else if (action === 'edit') {
      const restoredItem = {
        id: `re-edit-${post.id}`,
        reEditDocId: post.id, // Store original document ID
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

      if (queuedImages.length > 0) {
        localforage.setItem('bulkEdit_stashedQueue', queuedImages);
      }

      setQueuedImages([restoredItem]);
      setCurrentIndex(0);
      toast.success("Image moved to editor queue");
    }
  };

  const filteredGallery = gallery.filter(item =>
    item.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-[1600px] mx-auto relative px-4 pb-4">
      {/* Page Header */}
      <div className="shrink-0 mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Edit Studio</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Upload, preview, and process multiple images instantly.</p>
        </div>
      </div>

      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">

        {/* COLUMN 1: LEFT (PREVIEW AREA) - 5 Columns */}
        <div className="lg:col-span-5 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {queuedImages.length === 0 ? (
            <div className="p-6 h-full flex flex-col justify-center">
              <UploadZone onFilesSelected={handleFilesAdded} />
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* HEADER NAV */}
              <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-bold w-16 text-center">
                    {currentIndex + 1} / {queuedImages.length}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentIndex(Math.min(queuedImages.length - 1, currentIndex + 1))}
                    disabled={currentIndex === queuedImages.length - 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 px-2">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* EDITOR CROPPER AREA */}
              <div ref={containerRef} className="flex-1 bg-black/5 relative overflow-hidden flex items-center justify-center">
                {currentImage && (
                  <>
                    <Cropper
                      key={currentImage.id}
                      image={currentImage.originalUrl}
                      crop={currentImage.crop}
                      zoom={currentImage.zoom}
                      aspect={currentImage.aspect || currentImage.naturalAspect}
                      onCropChange={(c) => updateCurrentImage({ crop: c })}
                      onZoomChange={(z) => updateCurrentImage({ zoom: z })}
                      onCropComplete={onCropComplete}
                      onMediaLoaded={onMediaLoaded}
                      objectFit={
                        // If image is portrait and crop aspect is square/landscape, use horizontal-cover
                        // so the crop box fills the full width of the container and isn't tiny
                        (currentImage.naturalAspect || 1) < (currentImage.aspect || currentImage.naturalAspect || 1)
                          ? "horizontal-cover"
                          : "contain"
                      }
                      minZoom={0.1}
                      showGrid={true}
                      style={{ containerStyle: { borderRadius: '0' } }}
                    />

                    <div style={getCropBoxStyle()}>
                      {currentImage.logos && currentImage.logos.map((logo, index) => (
                        <div
                          key={logo.id || index}
                          className="absolute select-none cursor-grab active:cursor-grabbing"
                          style={{
                            left: `${logo.position.x}%`,
                            top: `${logo.position.y}%`,
                            width: `${logo.size}%`,
                            opacity: logo.opacity / 100,
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'auto',
                            touchAction: 'none',
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const container = e.currentTarget.parentElement;
                            if (!container) return;

                            const onMouseMove = (moveEvent) => {
                              const rect = container.getBoundingClientRect();
                              const x = Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                              const y = Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));

                              const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, position: { x, y } } : l);
                              updateCurrentImage({ logos: newLogos });
                            };

                            const onMouseUp = () => {
                              window.removeEventListener('mousemove', onMouseMove);
                              window.removeEventListener('mouseup', onMouseUp);
                            };

                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                          }}
                          ref={(node) => {
                            if (!node) return;
                            const handleWheel = (e) => {
                              e.stopPropagation();
                              if (e.ctrlKey || e.metaKey) {
                                e.preventDefault(); // Stop browser zoom
                              }

                              const sensitivity = 0.05;
                              const change = e.deltaY * -sensitivity;
                              let newLogos;

                              if (e.ctrlKey || e.metaKey) {
                                let newOpacity = logo.opacity + (e.deltaY > 0 ? -5 : 5);
                                newOpacity = Math.max(0, Math.min(100, newOpacity));
                                newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, opacity: newOpacity } : l);
                              } else {
                                let newSize = logo.size + change;
                                newSize = Math.max(5, Math.min(100, newSize));
                                newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, size: newSize } : l);
                              }

                              updateCurrentImage({ logos: newLogos });
                            };

                            // Prevent duplicate listeners on re-render
                            if (node._handleWheel) {
                              node.removeEventListener('wheel', node._handleWheel);
                            }
                            node._handleWheel = handleWheel;
                            node.addEventListener('wheel', handleWheel, { passive: false });
                          }}
                        >
                          <img
                            src={logo.url}
                            alt="logo preview"
                            className="w-full h-auto object-contain pointer-events-none"
                            draggable={false}
                          />
                          {/* Drag hint ring */}
                          <div className="absolute inset-0 rounded border-2 border-dashed border-white/0 hover:border-white/60 transition-colors duration-150" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: MIDDLE (SETTINGS) - 3 Columns */}
        <div className="lg:col-span-3 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
          {queuedImages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <Layers className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Upload images to enable settings.</p>
            </div>
          ) : currentImage && (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border shrink-0 flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold">Edit Settings</h3>
                <span className="text-xs text-muted-foreground truncate max-w-[120px] bg-background px-2 py-1 rounded border">
                  {currentImage.file?.name || "re-edited-file"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Size (Aspect Ratio) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">Size (Aspect Ratio)</Label>
                    <span className="text-indigo-500 text-[10px] font-bold cursor-pointer hover:underline" onClick={handleApplyAspectToAll}>
                      Apply to All
                    </span>
                  </div>
                  <select
                    value={currentImage.aspect || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCurrentImage({ aspect: val === "" ? null : parseFloat(val) });
                    }}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <option key={ratio.label} value={ratio.value === null ? "" : ratio.value}>
                        {ratio.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Image Zoom Control */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold text-foreground">
                      Zoom: {Math.round(currentImage.zoom * 100)}%
                    </Label>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <ZoomOut
                        className="w-3.5 h-3.5 cursor-pointer hover:text-foreground active:scale-90"
                        onClick={() => updateCurrentImage({ zoom: Math.max(1, currentImage.zoom - 0.1) })}
                      />
                      <ZoomIn
                        className="w-3.5 h-3.5 cursor-pointer hover:text-foreground active:scale-90"
                        onClick={() => updateCurrentImage({ zoom: Math.min(3, currentImage.zoom + 0.1) })}
                      />
                    </div>
                  </div>
                  <Slider
                    value={[currentImage.zoom]}
                    min={1}
                    max={3}
                    step={0.05}
                    onValueChange={(val) => updateCurrentImage({ zoom: getValue(val) })}
                  />
                </div>

                {/* Image Position Control */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Move className="w-3.5 h-3.5 text-muted-foreground" />
                    Image Position
                  </Label>
                  <div className="space-y-3 pl-1">
                    <div className="space-y-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Horizontal</span>
                      <Slider
                        value={[currentImage.crop.x]}
                        min={-150}
                        max={150}
                        step={1}
                        onValueChange={(val) => updateCurrentImage({ crop: { ...currentImage.crop, x: getValue(val) } })}
                      />
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">Vertical</span>
                      <Slider
                        value={[currentImage.crop.y]}
                        min={-150}
                        max={150}
                        step={1}
                        onValueChange={(val) => updateCurrentImage({ crop: { ...currentImage.crop, y: getValue(val) } })}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border my-2" />

                {/* Logo Watermarks Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">Watermarks</Label>
                    <span className="text-indigo-500 text-xs font-bold cursor-pointer hover:underline" onClick={handleApplyLogosToAll}>
                      Apply All to All
                    </span>
                  </div>

                  {currentImage.logos && currentImage.logos.map((logo, index) => (
                    <div key={logo.id} className="border border-border p-3 rounded-lg bg-card space-y-4 relative">
                      <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground border-b pb-2">
                        <span>Logo {index + 1}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-red-500 hover:bg-red-50"
                          onClick={() => {
                            const newLogos = currentImage.logos.filter(l => l.id !== logo.id);
                            updateCurrentImage({ logos: newLogos });
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Logo Selector */}
                      <div className="space-y-2">
                        <span className="text-xs text-muted-foreground font-medium">Select Image</span>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                          {logos.map(availableLogo => (
                            <div
                              key={availableLogo.id}
                              onClick={() => {
                                const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, url: availableLogo.url } : l);
                                updateCurrentImage({ logos: newLogos });
                              }}
                              className={`w-10 h-10 rounded-lg border-2 p-1 cursor-pointer flex-shrink-0 flex items-center justify-center bg-slate-50 transition-all ${logo.url === availableLogo.url ? "border-indigo-500 shadow-sm" : "border-transparent hover:border-slate-300"
                                }`}
                            >
                              <img src={availableLogo.url} alt={availableLogo.name} className="max-w-full max-h-full object-contain" />
                            </div>
                          ))}
                          {logos.length < 3 && (
                            <label className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer flex-shrink-0 flex flex-col items-center justify-center transition-colors group">
                              <input
                                type="file"
                                accept="image/png, image/jpeg"
                                className="hidden"
                                onChange={handleUploadLogo}
                              />
                              <UploadCloud className="w-3 h-3 text-slate-400 group-hover:text-indigo-500" />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Opacity Control */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Opacity: {Math.round(logo.opacity)}%</span>
                          <span className="text-[9px] text-muted-foreground/60 bg-slate-100 px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold">Ctrl + Mouse</span>
                        </div>
                        <Slider
                          value={[logo.opacity]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(val) => {
                            const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, opacity: getValue(val) } : l);
                            updateCurrentImage({ logos: newLogos });
                          }}
                        />
                      </div>

                      {/* Size Control */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Size: {Math.round(logo.size)}%</span>
                          <span className="text-[9px] text-muted-foreground/60 bg-slate-100 px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold">Mouse Scroll</span>
                        </div>
                        <Slider
                          value={[logo.size]}
                          min={5}
                          max={100}
                          step={1}
                          onValueChange={(val) => {
                            const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, size: getValue(val) } : l);
                            updateCurrentImage({ logos: newLogos });
                          }}
                        />
                      </div>

                      {/* Position X */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">X Position: {Math.round(logo.position.x)}%</span>
                        </div>
                        <Slider
                          value={[logo.position.x]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(val) => {
                            const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, position: { ...l.position, x: getValue(val) } } : l);
                            updateCurrentImage({ logos: newLogos });
                          }}
                        />
                      </div>

                      {/* Position Y */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground font-medium">Y Position: {Math.round(logo.position.y)}%</span>
                        </div>
                        <Slider
                          value={[logo.position.y]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(val) => {
                            const newLogos = currentImage.logos.map((l, i) => i === index ? { ...l, position: { ...l.position, y: getValue(val) } } : l);
                            updateCurrentImage({ logos: newLogos });
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="default"
                    className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg shadow-indigo-500/25 font-bold text-sm group transition-all hover:-translate-y-0.5 rounded-xl mt-2"
                    onClick={() => {
                      const urlToUse = logos.length > 0 ? logos[0].url : logoUrl;
                      const newLogos = [...(currentImage.logos || []), {
                        id: Math.random().toString(36).substring(7),
                        url: urlToUse,
                        opacity: 70,
                        size: 30,
                        position: { x: 50, y: 50 }
                      }];
                      updateCurrentImage({ logos: newLogos });
                    }}
                  >
                    <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Add Another Logo
                  </Button>
                </div>
              </div>

              <div className="p-4 border-t border-border shrink-0 bg-muted/30">
                <Button
                  onClick={handleRun}
                  disabled={isProcessing}
                  className="w-full h-10 font-bold bg-primary hover:bg-primary/90 text-white shadow-sm"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Play className="w-4 h-4 mr-2" fill="currentColor" /> Run Auto-Edit ({queuedImages.length})</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 3: RIGHT (GALLERY) - 4 Columns */}
        <div className="lg:col-span-4 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
          <div className="p-4 border-b border-border shrink-0 bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Gallery
                <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
                  {gallery.length} items
                </span>
              </h3>

              {selectedIds.size > 0 && (
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" className="h-7 w-7 text-destructive" onClick={() => setShowDeleteModal(true)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setShowExportModal(true)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name (e.g. rdmodels-55)"
                className="pl-9 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {gallery.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Layers className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Processed items will appear here.</p>
              </div>
            ) : filteredGallery.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <Search className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">No items match your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pb-20">
                {filteredGallery.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onAction={handlePostAction}
                    isSelected={selectedIds.has(post.id)}
                    onToggleSelect={() => handleToggleSelect(post.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selectedIds.size} item(s)?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete the selected images? This action cannot be undone.</p>
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
            <Input value={exportFolderName} onChange={(e) => setExportFolderName(e.target.value)} placeholder="e.g. RD_Models_Bulk" />
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
                {previewPostIndex !== null && filteredGallery[previewPostIndex]?.filename}
              </span>
              <span className="text-sm text-white/60 ml-2">
                {previewPostIndex !== null && `${previewPostIndex + 1} of ${filteredGallery.length}`}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Optional actions can go here in the future */}
            </div>
          </div>

          <div className="flex-1 relative w-full h-full bg-black">
            {previewPostIndex !== null && filteredGallery[previewPostIndex] && (
              <Cropper
                image={filteredGallery[previewPostIndex].processedUrl}
                crop={previewCrop}
                zoom={previewZoom}
                onCropChange={setPreviewCrop}
                onZoomChange={setPreviewZoom}
                objectFit="contain"
                showGrid={false}
                restrictPosition={false}
                style={{
                  containerStyle: { background: '#000' },
                  cropAreaStyle: { border: 'none', boxShadow: 'none', display: 'none' }, // Hides the cropper mask completely
                  mediaStyle: { filter: 'none' }
                }}
              />
            )}
          </div>

          {/* Floating Navigation Arrows */}
          <div className="absolute inset-y-0 left-4 flex items-center z-50 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/70 pointer-events-auto transition-all"
              disabled={previewPostIndex === 0}
              onClick={() => {
                setPreviewPostIndex(Math.max(0, previewPostIndex - 1));
                setPreviewZoom(1);
                setPreviewCrop({ x: 0, y: 0 });
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>

          <div className="absolute inset-y-0 right-4 flex items-center z-50 pointer-events-none">
            <Button
              variant="ghost"
              size="icon"
              className="w-12 h-12 rounded-full bg-black/40 text-white hover:bg-black/70 pointer-events-auto transition-all"
              disabled={previewPostIndex === filteredGallery.length - 1}
              onClick={() => {
                setPreviewPostIndex(Math.min(filteredGallery.length - 1, previewPostIndex + 1));
                setPreviewZoom(1);
                setPreviewCrop({ x: 0, y: 0 });
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
