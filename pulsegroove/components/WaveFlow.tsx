import React, { useEffect } from "react";

interface WaveFlowProps {
  palette: string[];
  tempo?: number;
}

const toHSL = (color: string) => {
  // Si déjà en hsl, retourne tel quel, sinon convertit (simple fallback)
  if (color.startsWith('hsl')) return color;
  // Hex to HSL conversion (simplifié)
  let r = 0, g = 0, b = 0;
  if (color.length === 7) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h*360)},${Math.round(s*100)}%,${Math.round(l*100)}%)`;
};

export default function WaveFlow({ palette, tempo }: WaveFlowProps) {
  const hsl = palette.map(toHSL);
  const pulseDuration = tempo && tempo > 0 ? 60 / tempo : 3;

  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("waveflow-keyframes")) {
      const style = document.createElement('style');
      style.id = "waveflow-keyframes";
      style.innerHTML = `
        @keyframes waveflow-bg1 {
          0% { background-position: 0% 50%; background-size: 200% 200%; }
          50% { background-position: 100% 50%; background-size: 220% 220%; }
          100% { background-position: 0% 50%; background-size: 200% 200%; }
        }
        @keyframes waveflow-bg2 {
          0% { background-position: 100% 50%; background-size: 180% 180%; }
          50% { background-position: 0% 50%; background-size: 210% 210%; }
          100% { background-position: 100% 50%; background-size: 180% 180%; }
        }
        @keyframes waveflow-bg3 {
          0% { background-position: 50% 100%; background-size: 220% 220%; }
          50% { background-position: 0% 0%; background-size: 250% 250%; }
          100% { background-position: 50% 100%; background-size: 220% 220%; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <>
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(120deg, ${hsl[0]}, ${hsl[1]}, ${hsl[2]||hsl[0]}, ${hsl[0]}) 0% 50% / 200% 200% no-repeat`,
          animation: `waveflow-bg1 ${Math.max(8, pulseDuration*2)}s ease-in-out infinite`,
          opacity: 0.85,
          filter: "blur(32px)",
          transition: 'all 0.7s',
        }}
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `radial-gradient(circle at 70% 30%, ${hsl[1]} 0%, transparent 80%) 100% 50% / 180% 180% no-repeat, linear-gradient(120deg, ${hsl[2]||hsl[0]}, ${hsl[0]}, ${hsl[1]}) 100% 50% / 180% 180% no-repeat`,
          animation: `waveflow-bg2 ${Math.max(12, pulseDuration*3)}s ease-in-out infinite`,
          opacity: 0.55,
          filter: "blur(48px)",
          mixBlendMode: "lighten",
          transition: 'all 0.7s',
        }}
      />
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `radial-gradient(circle at 30% 80%, ${hsl[2]||hsl[0]} 0%, transparent 80%) 50% 100% / 220% 220% no-repeat, linear-gradient(120deg, ${hsl[1]}, ${hsl[2]||hsl[0]}, ${hsl[0]}) 50% 100% / 220% 220% no-repeat`,
          animation: `waveflow-bg3 ${Math.max(18, pulseDuration*4)}s ease-in-out infinite`,
          opacity: 0.35,
          filter: "blur(64px)",
          mixBlendMode: "soft-light",
          transition: 'all 0.7s',
        }}
      />
    </>
  );
} 