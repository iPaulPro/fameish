import { FC, useMemo, useState, useEffect } from "react";

interface SemiCircleProgressBarProps {
  /** Current progress value (0 to max). */
  value: number;
  /** Maximum progress value. */
  max: number;
  /** Thickness of the progress‐bar stroke (viewBox units). */
  thickness: number;
  /** CSS classes to set width/height (e.g. Tailwind `w-48 h-auto`). */
  className?: string;
  /** If true, animate changes to `value` (including on mount). */
  animate?: boolean;
  /** Animation duration in milliseconds. */
  animationDuration?: number;
  /** Color of the unfilled background track. */
  trackColor?: string;
}

/**
 * Semi‐circular (half‐circle) progress bar with mount animation.
 * - viewBox="0 0 200 100" ⇒ 2:1 aspect ratio (half‐circle).
 * - size controlled via CSS classes (e.g. `w-48 h-auto`).
 * - If `animate=true`, it animates from 0→value on mount and on updates.
 */
const SemiCircleProgressBar: FC<SemiCircleProgressBarProps> = ({
  value,
  max,
  thickness,
  className = "",
  animate = true,
  animationDuration = 3500,
  trackColor = "#efefef",
}) => {
  // Clamp value
  const normalizedValue = Math.max(0, Math.min(value, max));

  // viewBox dimensions
  const vbWidth = 200;
  const vbHeight = 100;
  // radius and endpoints
  const radius = vbHeight - thickness / 2;
  const startX = thickness / 2;
  const startY = vbHeight;
  const endX = vbWidth - thickness / 2;
  const endY = vbHeight;

  // semi‐circumference = π × radius
  const semiCircumference = Math.PI * radius;
  // target offset for current value
  const dashOffset = semiCircumference * (1 - normalizedValue / Math.max(max, 1));

  // State to drive animated offset. Initialize at full-empty (semiCircumference).
  const [animatedOffset, setAnimatedOffset] = useState(semiCircumference);

  // On mount and whenever dashOffset changes, push the state to dashOffset.
  useEffect(() => {
    if (animate) {
      // Defer to next tick so there's always a transition from initial to dashOffset
      const id = requestAnimationFrame(() => {
        setAnimatedOffset(dashOffset);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [dashOffset, animate]);

  // Gradient ID
  const gradientId = useMemo(() => `semi-circle-gradient-${Math.random().toString(36).slice(2)}`, []);

  // Which offset to use: animated or static
  const currentOffset = animate ? animatedOffset : dashOffset;

  return (
    <svg className={className} width="100%" viewBox={`0 0 ${vbWidth} ${vbHeight}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          {/* Animate x1 from 0% → 10% → 0% over 6s (loop), and x2 from 100% → 90% → 100%. */}
          <animate attributeName="x1" values="0%;50%;0%" dur="6s" repeatCount="indefinite" />
          <animate attributeName="x2" values="100%;50%;100%" dur="6s" repeatCount="indefinite" />

          <stop offset="0%" stopColor="rgba(198, 255, 100, 0.75)" />
          <stop offset="50%" stopColor="rgba(255, 160, 80, 0.75)" />
          <stop offset="80%" stopColor="rgba(180, 100, 255, 0.75)" />
          <stop offset="100%" stopColor="rgba(180, 100, 255, 0.75)" />
        </linearGradient>
      </defs>

      {/* Background track */}
      <path
        d={`
          M ${startX} ${startY}
          A ${radius} ${radius} 0 0 1 ${endX} ${endY}
        `}
        fill="none"
        stroke={trackColor}
        strokeWidth={thickness}
        strokeLinecap="round"
      />

      {/* Foreground progress arc */}
      <path
        d={`
          M ${startX} ${startY}
          A ${radius} ${radius} 0 0 1 ${endX} ${endY}
        `}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={semiCircumference}
        strokeDashoffset={currentOffset}
        style={animate ? { transition: `stroke-dashoffset ${animationDuration}ms ease-out` } : undefined}
      />
    </svg>
  );
};

export default SemiCircleProgressBar;
