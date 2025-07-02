import React, { useRef, useEffect, useState, useMemo } from "react";
import WaveFlow from "./WaveFlow";

interface GradientBackgroundProps {
  palette: string[];
  bpm?: number;
  trackId?: string | number | null;
  transitionKey?: string;
}

const EFFECTS = [WaveFlow];
type EffectType = 0; // index du tableau EFFECTS

const GradientBackground: React.FC<GradientBackgroundProps> = ({ palette, bpm, trackId, transitionKey }) => {
  const [effectIdx, setEffectIdx] = useState<EffectType>(0);
  const lastTrackId = useRef<string | number | null>(null);
  // Pour l'effet bulle
  const [prevPalette, setPrevPalette] = useState<string[]>(palette);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [clip, setClip] = useState('circle(0% at 50% 50%)');
  // Angle animé lentement
  const [angle, setAngle] = useState(120);
  useEffect(() => {
    let raf: number;
    let running = true;
    function animate() {
      setAngle(a => {
        let next = a + 0.5; // très lent (30s pour 360°)
        if (next > 360) next = 120;
        return next;
      });
      if (running) raf = requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    if (trackId !== lastTrackId.current) {
      setEffectIdx(Math.floor(Math.random() * EFFECTS.length) as EffectType);
      lastTrackId.current = trackId ?? null;
    }
  }, [trackId]);
  // Effet bulle sur changement de palette ou de transitionKey
  useEffect(() => {
    if (palette.join() !== prevPalette.join() || transitionKey) {
      setIsTransitioning(true);
      setClip('circle(0% at 50% 50%)');
      setTimeout(() => setClip('circle(150% at 50% 50%)'), 20); // déclenche l'anim
      setTimeout(() => {
        setPrevPalette(palette);
        setIsTransitioning(false);
      }, 700); // durée de l'anim
    }
  }, [palette, transitionKey]);
  const Effect = EFFECTS[effectIdx];
  const gradientPrev = `linear-gradient(${angle}deg, ${prevPalette.join(', ')})`;
  const gradientNext = `linear-gradient(${angle}deg, ${palette.join(', ')})`;
  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
      {/* Ancien fond */}
      <div style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        background: gradientPrev,
        transition: 'background 0.7s',
        zIndex: 1,
        boxShadow: `0 8px 32px 0 #000a, 0 0 0 8px ${palette[1] || "#4a4e69"}55`
      }} />
      {/* Nouveau fond avec masque bulle */}
      {isTransitioning && (
        <div style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: gradientNext,
          WebkitClipPath: clip,
          clipPath: clip,
          transition: 'clip-path 0.7s cubic-bezier(.7,0,.3,1)',
          zIndex: 2,
          pointerEvents: 'none',
        }} />
      )}
      {/* Fond normal si pas de transition */}
      {!isTransitioning && (
        <div style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          background: gradientNext,
          transition: 'background 0.7s',
          zIndex: 2,
        }} />
      )}
      <Effect palette={palette} tempo={bpm} />
    </div>
  );
};

export default GradientBackground; 