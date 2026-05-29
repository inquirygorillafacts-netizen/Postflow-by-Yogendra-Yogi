import React, { useState } from "react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
  parseISO
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function CalendarView({ scheduledPosts }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const onDateClick = (day) => {
    setSelectedDate(day);
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="text-center font-medium text-sm text-muted-foreground py-2">
          {format(addDays(startDate, i), "EEEEEE")}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b border-border mb-2">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Find posts for this day
        const dayPosts = scheduledPosts.filter(post => {
          if(!post.scheduledAt) return false;
          return isSameDay(parseISO(post.scheduledAt), cloneDay);
        });

        days.push(
          <div
            key={day.toISOString()}
            onClick={() => onDateClick(cloneDay)}
            className={`min-h-[100px] border border-border/50 p-2 transition-colors cursor-pointer relative overflow-hidden group
              ${!isSameMonth(day, monthStart) ? "bg-muted/30 text-muted-foreground/50" : "bg-card hover:bg-muted/20 text-foreground"}
              ${isSameDay(day, selectedDate) ? "ring-2 ring-primary z-10" : ""}
            `}
          >
            <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
              ${isSameDay(day, new Date()) ? "bg-primary text-white" : ""}
            `}>
              {formattedDate}
            </span>
            
            <div className="mt-1 space-y-1">
              {dayPosts.map(post => (
                <div key={post.id} className="text-xs bg-info/10 text-info px-1.5 py-0.5 rounded truncate border border-info/20">
                  {post.filename}
                </div>
              ))}
            </div>
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
              <Plus className="w-4 h-4" />
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toISOString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="border border-border/50 rounded-lg overflow-hidden">{rows}</div>;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      {renderHeader()}
      {renderDays()}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMonth.toISOString()}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
        >
          {renderCells()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
