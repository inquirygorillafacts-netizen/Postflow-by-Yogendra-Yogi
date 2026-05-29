"use client";

import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Mock Data
const MOCK_SCHEDULED_POSTS = [
  { id: 1, filename: "RD_Model_A.jpg", scheduledAt: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() },
  { id: 2, filename: "RD_Model_B.jpg", scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString() },
  { id: 3, filename: "RD_Model_C.jpg", scheduledAt: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString() },
];

export default function CalendarPage() {
  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Calendar</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">Schedule and manage your upcoming Instagram posts.</p>
        </div>
        
        <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-transform active:scale-95 h-9 px-4 text-xs">
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Post
        </Button>
      </div>

      <CalendarView scheduledPosts={MOCK_SCHEDULED_POSTS} />
    </div>
  );
}
