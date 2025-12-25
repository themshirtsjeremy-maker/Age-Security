"use client";

import { useRef, useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { ChevronUp, ChevronDown } from "lucide-react";

const CURRENT_YEAR = 2025;
const MIN_YEAR = 1920;
const MAX_YEAR = CURRENT_YEAR;
const ITEM_HEIGHT = 72;
const VISIBLE_ITEMS = 5;

export function YearPicker() {
  const { selectedYear, setSelectedYear } = useStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const years = Array.from(
    { length: MAX_YEAR - MIN_YEAR + 1 },
    (_, i) => MAX_YEAR - i
  );

  // Scroll to selected year on mount
  useEffect(() => {
    const index = years.indexOf(selectedYear);
    if (scrollRef.current && index !== -1) {
      const targetScroll = index * ITEM_HEIGHT;
      scrollRef.current.scrollTop = targetScroll;
    }
  }, []);

  // Handle scroll with snap
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    setIsScrolling(true);
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Snap after scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      if (!scrollRef.current) return;
      
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, years.length - 1));
      const targetScroll = clampedIndex * ITEM_HEIGHT;
      
      scrollRef.current.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
      
      setSelectedYear(years[clampedIndex]);
      setIsScrolling(false);
    }, 100);
  };

  // Navigate up/down
  const scrollUp = () => {
    const currentIndex = years.indexOf(selectedYear);
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setSelectedYear(years[newIndex]);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: newIndex * ITEM_HEIGHT,
          behavior: "smooth",
        });
      }
    }
  };

  const scrollDown = () => {
    const currentIndex = years.indexOf(selectedYear);
    if (currentIndex < years.length - 1) {
      const newIndex = currentIndex + 1;
      setSelectedYear(years[newIndex]);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: newIndex * ITEM_HEIGHT,
          behavior: "smooth",
        });
      }
    }
  };

  // Click to select
  const selectYear = (year: number) => {
    const index = years.indexOf(year);
    setSelectedYear(year);
    if (scrollRef.current && index !== -1) {
      scrollRef.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }
  };

  // Calculate which year is currently centered
  const getCenterIndex = () => {
    if (!scrollRef.current) return years.indexOf(selectedYear);
    return Math.round(scrollRef.current.scrollTop / ITEM_HEIGHT);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Up arrow */}
      <button
        onClick={scrollUp}
        className="p-2 text-muted-foreground hover:text-accent transition-colors mb-2"
        aria-label="Previous year"
      >
        <ChevronUp className="w-8 h-8" strokeWidth={1.5} />
      </button>

      {/* Drum container */}
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 pointer-events-none" />
        
        {/* Center highlight */}
        <div 
          className="absolute left-0 right-0 border-t-2 border-b-2 border-accent z-10 pointer-events-none"
          style={{ 
            top: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2),
            height: ITEM_HEIGHT 
          }}
        />

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="w-52 overflow-y-scroll scroll-smooth year-drum"
          style={{ 
            height: ITEM_HEIGHT * VISIBLE_ITEMS,
            scrollSnapType: "y mandatory",
          }}
          onScroll={handleScroll}
        >
          {/* Top padding */}
          <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
          
          {/* Years */}
          {years.map((year) => {
            const isSelected = year === selectedYear;
            
            return (
              <div
                key={year}
                className="flex items-center justify-center font-mono font-bold tracking-tighter cursor-pointer transition-all duration-150"
                style={{
                  height: ITEM_HEIGHT,
                  scrollSnapAlign: "center",
                  fontSize: isSelected ? "3.5rem" : "2rem",
                  opacity: isSelected ? 1 : 0.3,
                  color: isSelected ? "var(--foreground)" : "var(--muted-foreground)",
                }}
                onClick={() => selectYear(year)}
              >
                {year}
              </div>
            );
          })}
          
          {/* Bottom padding */}
          <div style={{ height: ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2) }} />
        </div>
      </div>

      {/* Down arrow */}
      <button
        onClick={scrollDown}
        className="p-2 text-muted-foreground hover:text-accent transition-colors mt-2"
        aria-label="Next year"
      >
        <ChevronDown className="w-8 h-8" strokeWidth={1.5} />
      </button>

      {/* Selected year display */}
      <div className="mt-6 text-center">
        <div className="text-muted-foreground text-xs tracking-widest uppercase mb-2">
          BIRTH YEAR
        </div>
        <div className="text-5xl md:text-7xl font-bold tracking-tighter text-accent">
          {selectedYear}
        </div>
      </div>
    </div>
  );
}
