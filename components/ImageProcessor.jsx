import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

export function ImageProcessor({ file, onComplete }) {
  const canvasRef = useRef(null);
  const [processedUrl, setProcessedUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    if (!file) return;

    const processImage = async () => {
      setIsProcessing(true);
      try {
        const image = await loadImage(URL.createObjectURL(file));
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // Target Instagram square size
        const targetSize = 1080;
        canvas.width = targetSize;
        canvas.height = targetSize;

        // Calculate crop to 1:1 ratio
        const size = Math.min(image.width, image.height);
        const xOffset = (image.width - size) / 2;
        const yOffset = (image.height - size) / 2;

        // Draw cropped image
        ctx.drawImage(
          image,
          xOffset,
          yOffset,
          size,
          size,
          0,
          0,
          targetSize,
          targetSize
        );

        // Apply watermark / logo
        // For now, we simulate the logo with a text or placeholder if no actual logo image is provided.
        // In a real scenario, we'd load the watermark image similarly.
        ctx.save();
        ctx.globalAlpha = 0.7; // 70% opacity
        
        // Mock watermark - text based for now
        ctx.fillStyle = "white";
        ctx.font = "bold 60px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Add shadow for better visibility on light backgrounds
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText("RD MODELS", targetSize / 2, targetSize / 2);
        ctx.restore();

        // Convert to data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setProcessedUrl(dataUrl);
        
        if (onComplete) {
          onComplete(dataUrl);
        }
      } catch (err) {
        console.error("Failed to process image:", err);
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [file]);

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement("a");
    a.href = processedUrl;
    a.download = `RDModels_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col gap-4 bg-card rounded-xl border border-border p-4 shadow-sm">
      <div className="relative aspect-square w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm font-medium">Processing Image...</span>
          </div>
        ) : (
          processedUrl && (
            <img 
              src={processedUrl} 
              alt="Processed" 
              className="w-full h-full object-cover"
            />
          )
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {!isProcessing && processedUrl && (
        <div className="flex justify-between items-center px-2">
          <p className="text-sm font-medium text-muted-foreground truncate max-w-[200px]">
            {file.name}
          </p>
          <Button size="sm" onClick={handleDownload} className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-transform active:scale-95">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
