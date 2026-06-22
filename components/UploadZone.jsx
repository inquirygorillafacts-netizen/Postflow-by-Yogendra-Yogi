import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileType } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function UploadZone({ onFilesSelected }) {
  const [isHovered, setIsHovered] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (onFilesSelected && acceptedFiles.length > 0) {
      onFilesSelected(acceptedFiles);
    }
  }, [onFilesSelected]);

  const onDropRejected = useCallback((fileRejections) => {
    import("react-hot-toast").then((module) => {
      const toast = module.default;
      fileRejections.forEach((rejection) => {
        rejection.errors.forEach((err) => {
          if (err.code === "file-too-large") {
            toast.error(`${rejection.file.name} is too large (Max 50MB)`);
          } else {
            toast.error(`Failed to select ${rejection.file.name}: ${err.message}`);
          }
        });
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg', '.JPG', '.JPEG'],
      'image/png': ['.png', '.PNG'],
      'image/webp': ['.webp', '.WEBP']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  return (
    <div
      {...getRootProps()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden w-full p-12 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ease-in-out
        ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-card"}
        ${isDragReject ? "border-destructive bg-destructive/5" : ""}
        ${isHovered && !isDragActive ? "border-primary/50 shadow-sm" : ""}
      `}
    >
      <input {...getInputProps()} />
      
      {/* Animated gradient background on hover/drag */}
      <AnimatePresence>
        {(isDragActive || isHovered) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div 
        animate={{ 
          y: isDragActive ? -10 : 0,
          scale: isDragActive ? 1.1 : 1
        }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className={`p-4 rounded-full mb-4 ${isDragActive ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"} transition-colors`}>
          <UploadCloud className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-semibold mb-2">
          {isDragActive ? "Drop images here..." : "Click or drag images here"}
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
          Upload raw photos to automatically crop, apply watermarks, and prepare them for Instagram.
        </p>

        <div className="flex gap-4 items-center text-xs font-medium text-muted-foreground">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            <FileType className="w-3.5 h-3.5" />
            JPG, PNG, WEBP
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            <span className="font-bold">50</span> MB Max
          </div>
        </div>
      </motion.div>
    </div>
  );
}
