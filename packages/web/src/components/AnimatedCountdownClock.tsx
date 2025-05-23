"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCountdownClockProps {
  /** Countdown end target */
  targetDate: Date | string;
  /** Base color for non-animated digits */
  baseColor?: string;
  /** Tailwind classes for overall text styling */
  textClassName?: string;
  animationEnabled?: boolean;
  /** Callback when countdown reaches zero */
  onComplete?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const AnimatedCountdownClock: React.FC<AnimatedCountdownClockProps> = ({
  targetDate,
  baseColor = "#000000",
  textClassName = "",
  animationEnabled = true,
  onComplete,
}) => {
  const end = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const prevTimeRef = useRef<TimeLeft>(timeLeft);
  const completedRef = useRef(false);

  useEffect(() => {
    // Calculate remaining time and update state
    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(end.getTime() - now, 0);

      // Fire onComplete only once when timer hits zero
      if (diff === 0 && !completedRef.current) {
        onComplete?.();
        completedRef.current = true;
      }

      setTimeLeft(prev => {
        prevTimeRef.current = prev;
        return {
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          minutes: Math.floor((diff % 3600000) / 60000),
          seconds: Math.floor((diff % 60000) / 1000),
        };
      });
    };

    // Align ticks to real-time second boundaries to prevent drift
    let timerId: ReturnType<typeof setTimeout>;
    const tick = () => {
      updateTime();
      const drift = Date.now() % 1000;
      timerId = setTimeout(tick, 1000 - drift);
    };

    tick();
    return () => clearTimeout(timerId);
  }, [end, onComplete]);

  // Framer Motion variants for animation
  const variants = {
    initial: { scale: 1, color: baseColor },
    animate: {
      scale: [1, 1.2, 0.9, 1],
      color: ["#ff4081", "#40c4ff", "#c6ff00", baseColor],
    },
  };

  const renderSegment = (value: number, key: keyof TimeLeft) => {
    const str = String(value).padStart(2, "0");
    const prevStr = String(prevTimeRef.current[key]).padStart(2, "0");
    return str.split("").map((char, idx) => {
      const changed = prevStr[idx] !== char;
      const spanKey = `${key}-${idx}-${char}`;
      const commonClasses = "inline-block";

      return animationEnabled && changed ? (
        <motion.span
          key={spanKey}
          className={commonClasses}
          variants={variants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.8 }}
        >
          {char}
        </motion.span>
      ) : (
        <span key={spanKey} className={commonClasses} style={{ color: baseColor }}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="inline-block text-center select-none">
      <div
        className={cn(
          "font-limelight tabular-nums text-5xl md:text-6xl flex items-center justify-center",
          textClassName,
        )}
      >
        {renderSegment(timeLeft.hours, "hours")}
        <span>:</span>
        {renderSegment(timeLeft.minutes, "minutes")}
        <span>:</span>
        {renderSegment(timeLeft.seconds, "seconds")}
      </div>
    </div>
  );
};

export default AnimatedCountdownClock;
