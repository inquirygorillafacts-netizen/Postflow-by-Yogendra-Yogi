import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { 
  Clock, CheckCircle2, Calendar as CalendarIcon, Send, 
  Download, Share2, Edit3, Trash2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-accent/10 text-accent border-accent/20",
    label: "Pending"
  },
  completed: {
    icon: CheckCircle2,
    color: "bg-success/10 text-success border-success/20",
    label: "Completed"
  },
  scheduled: {
    icon: CalendarIcon,
    color: "bg-info/10 text-info border-info/20",
    label: "Scheduled"
  },
  posted: {
    icon: Send,
    color: "bg-purple-100 text-purple-600 border-purple-200",
    label: "Posted"
  }
};

export function PostCard({ post, onAction, isSelected, onToggleSelect }) {
  const { status = "completed" } = post;
  const config = statusConfig[status] || statusConfig.completed;
  const StatusIcon = config.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`group relative bg-card rounded-xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md
        ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
      `}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full bg-muted overflow-hidden">
        <img 
          src={post.processedUrl || post.originalUrl || "/api/placeholder/400/400"} 
          alt={post.filename} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${config.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {config.label}
          </div>
        </div>

        {/* Selection Checkbox */}
        <div className={`absolute top-3 right-3 z-10 transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <Checkbox 
            checked={isSelected} 
            onCheckedChange={onToggleSelect} 
            className="w-5 h-5 bg-card/80 border-2" 
          />
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-4 pointer-events-none bg-white/30 backdrop-blur-[2px]">
          <div className="grid grid-cols-2 gap-2 w-full max-w-[220px] pointer-events-auto translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            <Button size="sm" className="w-full h-9 text-xs bg-white text-black hover:bg-gray-100 shadow-lg border border-gray-200 font-semibold" onClick={() => onAction('download', post)}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
            <Button size="sm" className="w-full h-9 text-xs bg-white text-black hover:bg-gray-100 shadow-lg border border-gray-200 font-semibold" onClick={() => onAction('preview', post)}>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Preview
            </Button>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-4 cursor-pointer" onClick={onToggleSelect}>
        <h4 className="font-medium text-sm truncate text-foreground mb-1">{post.filename}</h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "Just now"}</span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onAction('edit', post); }} className="p-1.5 hover:bg-muted rounded-md hover:text-foreground transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onAction('delete', post); }} className="p-1.5 hover:bg-destructive/10 rounded-md hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function InstagramIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
