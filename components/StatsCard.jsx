import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function StatsCard({ title, value, icon: Icon, color, delay = 0, isLoading = false }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Count up animation
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end)) {
      setCount(value);
      return;
    }
    const duration = 1000;
    const increment = end / (duration / 16); // 60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold tracking-wider text-muted-foreground/80 uppercase">{title}</p>
          {isLoading ? (
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium animate-pulse">Loading...</span>
            </div>
          ) : (
            <h3 className="text-2xl font-bold text-foreground leading-none">{count}</h3>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}
