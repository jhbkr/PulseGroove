import React, { useRef, useEffect, useState } from "react";
import WaveFlow from "./WaveFlow";

interface GradientBackgroundProps {
  palette: string[];
  bpm?: number;
  trackId?: string | number | null;
}

const EFFECTS = [WaveFlow];
type EffectType = 0;

const GradientBackground: React.FC<GradientBackgroundProps> = ({ palette, bpm, trackId }) => {
  const [effectIdx, setEffectIdx] = useState<EffectType>(0);
  const lastTrackId = useRef<string | number | null>(null);
  useEffect(() => {
    if (trackId !== lastTrackId.current) {
      setEffectIdx(Math.floor(Math.random() * EFFECTS.length) as EffectType);
      lastTrackId.current = trackId ?? null;
    }
  }, [trackId]);
  const Effect = EFFECTS[effectIdx];
  return (
    <div className="fixed inset-0 -z-10 w-full h-full overflow-hidden">
      <Effect palette={palette} tempo={bpm} />
    </div>
  );
};

export default GradientBackground; 