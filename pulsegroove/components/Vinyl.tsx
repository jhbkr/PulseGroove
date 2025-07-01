import React, { useRef, useEffect } from "react";
import { useReducedMotion } from "./effects/utils";

interface VinylProps {
  coverUrl: string;
  bpm: number;
  palette: string[];
}

const Vinyl: React.FC<VinylProps> = ({ coverUrl, bpm, palette }) => {
  const vinylRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Durée d'un tour complet (rotation)
  const rotationDuration = bpm && bpm > 0 ? 60 / bpm : 3;
  // Durée de la pulsation (scale)
  const pulseDuration = bpm && bpm > 0 ? 60 / bpm : 3;

  // Animation pulse (scale) synchronisée BPM
  useEffect(() => {
    if (!pulseRef.current) return;
    const el = pulseRef.current;
    let timeout: NodeJS.Timeout;
    let running = true;
    function pulse() {
      if (!running) return;
      el.animate([
        { transform: "scale(1)" },
        { transform: "scale(1.10)" },
        { transform: "scale(1)" },
      ], {
        duration: Math.max(180, pulseDuration * 1000),
        easing: "cubic-bezier(.4,0,.2,1)",
      });
      timeout = setTimeout(pulse, pulseDuration * 1000);
    }
    pulse();
    return () => { running = false; clearTimeout(timeout); };
  }, [pulseDuration]);

  useEffect(() => {
    if (vinylRef.current) {
      vinylRef.current.style.animation = `vinyl-spin ${rotationDuration}s linear infinite`;
    }
  }, [rotationDuration]);

  const grooves = Array.from({ length: 6 }).map((_, i) => (
    <circle
      key={i}
      cx="180"
      cy="180"
      r={`${90 + i * 22}`}
      fill="none"
      stroke="#fff"
      strokeWidth={i % 2 === 0 ? 0.7 : 0.4}
      opacity={0.08 + 0.04 * (i % 2)}
    />
  ));

  if (typeof window !== "undefined") {
    const style = document.createElement('style');
    style.innerHTML = `@keyframes vinyl-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;
    document.head.appendChild(style);
  }

  if (useReducedMotion()) return null;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        ref={pulseRef}
        className="flex items-center justify-center"
        style={{ width: 360, height: 360 }}
      >
        <div
          ref={vinylRef}
          className="relative rounded-full shadow-2xl"
          style={{
            width: 360,
            height: 360,
            boxShadow: `0 8px 32px 0 #000a, 0 0 0 8px ${palette[1] || "#4a4e69"}55`,
            overflow: "hidden",
          }}
        >
          {/* Cover = disque entier */}
          <img
            src={coverUrl}
            alt="cover"
            className="w-full h-full rounded-full object-cover"
            style={{ zIndex: 2 }}
          />
          <svg
            width={360}
            height={360}
            viewBox="0 0 360 360"
            className="absolute left-0 top-0 pointer-events-none"
            style={{ zIndex: 3 }}
          >
            {grooves}
          </svg>
          {/* Petit cercle central blanc */}
          <div
            className="absolute left-1/2 top-1/2 bg-white rounded-full"
            style={{
              width: 28,
              height: 28,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 8px 2px #fff8`,
              border: "2px solid #eee",
              zIndex: 4,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Vinyl; 