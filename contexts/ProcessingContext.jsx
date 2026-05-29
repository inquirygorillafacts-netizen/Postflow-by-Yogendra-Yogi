"use client";

import { createContext, useContext, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, updateDoc, doc, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createProcessedImage } from "@/lib/canvasUtils";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";

const ProcessingContext = createContext(null);

export function ProcessingProvider({ children }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const startProcessing = async (queuedImages, activeWorkspace, logos) => {
    if (queuedImages.length === 0) return;
    if (!activeWorkspace) {
      toast.error("Please login to save to database!");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalItems(queuedImages.length);

    let counter = parseInt(localStorage.getItem("imageCounter") || "1", 10);

    for (let i = 0; i < queuedImages.length; i++) {
      const img = queuedImages[i];
      const extension = img.file?.name?.split('.').pop() || 'jpg';
      const newName = `rdmodels-${counter}.${extension}`;
      counter++;

      try {
        if (img.reEditDocId) {
          const resolvedLogoUrl = img.logoUrl || (logos.length > 0 ? logos[0].url : null);
          const processedBlob = await createProcessedImage(
            img.originalUrl,
            {
              croppedAreaPixels: img.croppedAreaPixels,
              zoom: img.zoom,
              crop: img.crop,
              aspect: img.aspect,
              naturalAspect: img.naturalAspect,
              showLogo: img.showLogo,
              logoOpacity: img.logoOpacity,
              logoSizePercent: img.logoSizePercent,
              logoPosPercent: img.logoPosPercent
            },
            resolvedLogoUrl
          );
          
          const finalName = newName.replace(/\.[^/.]+$/, "") + ".jpg";
          const storageRef = ref(storage, `users/${activeWorkspace}/gallery/${finalName}`);
          await uploadBytes(storageRef, processedBlob);
          const downloadUrl = await getDownloadURL(storageRef);

          await updateDoc(doc(db, "users", activeWorkspace, "gallery", img.reEditDocId), {
            updatedAt: new Date().toISOString(),
            processedUrl: downloadUrl,
            savedSettings: {
              aspect: img.aspect,
              crop: img.crop,
              zoom: img.zoom,
              naturalAspect: img.naturalAspect,
              showLogo: img.showLogo,
              logoOpacity: img.logoOpacity,
              logoSizePercent: img.logoSizePercent,
              logoPosPercent: img.logoPosPercent
            }
          });

          await updateDoc(doc(db, "users", activeWorkspace), {
            lifetimeReEdits: increment(1)
          });
        } else {
          const resolvedLogoUrl = img.logoUrl || (logos.length > 0 ? logos[0].url : null);
          const processedBlob = await createProcessedImage(
            img.originalUrl,
            {
              croppedAreaPixels: img.croppedAreaPixels,
              zoom: img.zoom,
              crop: img.crop,
              aspect: img.aspect,
              naturalAspect: img.naturalAspect,
              showLogo: img.showLogo,
              logoOpacity: img.logoOpacity,
              logoSizePercent: img.logoSizePercent,
              logoPosPercent: img.logoPosPercent
            },
            resolvedLogoUrl
          );
          
          const finalName = newName.replace(/\.[^/.]+$/, "") + ".jpg";
          const storageRef = ref(storage, `users/${activeWorkspace}/gallery/${finalName}`);
          await uploadBytes(storageRef, processedBlob);
          const downloadUrl = await getDownloadURL(storageRef);

          let originalDownloadUrl = downloadUrl;
          if (img.file) {
            const origStorageRef = ref(storage, `users/${activeWorkspace}/gallery/orig-${newName}`);
            await uploadBytes(origStorageRef, img.file);
            originalDownloadUrl = await getDownloadURL(origStorageRef);
          }

          await addDoc(collection(db, "users", activeWorkspace, "gallery"), {
            filename: finalName,
            originalUrl: originalDownloadUrl,
            processedUrl: downloadUrl,
            createdAt: new Date().toISOString(),
            status: "completed",
            savedSettings: {
              aspect: img.aspect,
              crop: img.crop,
              zoom: img.zoom,
              naturalAspect: img.naturalAspect,
              showLogo: img.showLogo,
              logoOpacity: img.logoOpacity,
              logoSizePercent: img.logoSizePercent,
              logoPosPercent: img.logoPosPercent
            }
          });

          await updateDoc(doc(db, "users", activeWorkspace), {
            lifetimeUploads: increment(1),
            lifetimeEdits: increment(1)
          });
        }
        
        setProcessedCount(i + 1);
      } catch (err) {
        console.error("Error uploading file", err);
        toast.error(`Failed to upload ${newName}`);
      }
    }

    localStorage.setItem("imageCounter", counter.toString());
    setIsProcessing(false);
    toast.success("All edits saved to Cloud successfully!");
  };

  const progressPercent = totalItems > 0 ? Math.round((processedCount / totalItems) * 100) : 0;
  const estimatedSecondsLeft = totalItems > 0 ? (totalItems - processedCount) * 2 : 0;

  return (
    <ProcessingContext.Provider value={{ isProcessing, processedCount, totalItems, startProcessing }}>
      {children}
      
      {/* Global Processing Popup */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 w-80 bg-background/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-primary/20 p-5 z-[9999]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-bold tracking-tight text-foreground">Processing...</h3>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                {progressPercent}%
              </span>
            </div>
            
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-3">
              <motion.div 
                className="h-full bg-primary rounded-full relative"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
              </motion.div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <div>
                <p>Completed</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{processedCount} / {totalItems}</p>
              </div>
              <div className="text-right">
                <p>Estimated Time</p>
                <p className="text-sm font-bold text-foreground mt-0.5 flex items-center justify-end gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {estimatedSecondsLeft}s
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ProcessingContext.Provider>
  );
}

export const useProcessing = () => useContext(ProcessingContext);
