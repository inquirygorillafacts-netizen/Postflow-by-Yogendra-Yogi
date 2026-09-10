"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function RetentionPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const lastShown = localStorage.getItem("retentionPopupLastShown");
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;

    if (!lastShown || now - parseInt(lastShown, 10) > twelveHours) {
      const timer = setTimeout(() => setOpen(true), 1000);
      localStorage.setItem("retentionPopupLastShown", now.toString());
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="w-5 h-5" />
            Important Notice
          </DialogTitle>
          <DialogDescription className="pt-3 text-slate-600">
            Kripya dhyaan dein: Aapki photos cloud storage mein <strong>sirf 3 din</strong> ke liye save rahengi. Uske baad wo <strong>automatically delete</strong> ho jayengi.
            <br/><br/>
            Kripya edit kiye hue photos ko time par download kar lein!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)} className="w-full sm:w-auto">I Understand</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
