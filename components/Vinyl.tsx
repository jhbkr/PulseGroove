import React, { useRef, useEffect } from "react";

interface VinylProps {
  coverUrl: string;
  bpm: number;
  palette: string[];
}

const Vinyl: React.FC<VinylProps> = ({ coverUrl, bpm, palette }) => {
  const vinylRef = useRef<HTMLDivElement>(null);
  const pulseRef = useRef<HTMLDivElement>(null);

  // Durée d'un tour complet (rotation) - constante
  const rotationDuration = 4; // secondes par tour, valeur agréable
  // Durée de la pulsation (scale) synchronisée BPM
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

  // Fonction utilitaire pour calculer la luminance d'une couleur hex
  function luminance(hex: string) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    // sRGB
    r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Fonction pour obtenir la couleur complémentaire
  function complementary(hex: string) {
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Choix de la couleur néon contrastée
  const mainColor = palette[1] || palette[0] || "#4a4e69";
  const neonColor = luminance(mainColor) < 0.4 ? "#fff" : complementary(mainColor);

  // Sillons SVG (optionnel, overlay sur la cover)
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

  // Ajout des keyframes globalement (si pas déjà fait)
  if (typeof window !== "undefined") {
    const style = document.createElement('style');
    style.innerHTML = `@keyframes vinyl-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }`;
    document.head.appendChild(style);
  }

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
            // Double halo : blanc + couleur néon contrastée
            boxShadow: `0 0 32px 8px #fffcc, 0 0 64px 16px ${neonColor}cc, 0 8px 32px 0 #000a, 0 0 0 8px ${mainColor}55`,
            overflow: "hidden",
            transition: 'background 0.7s, box-shadow 0.7s, border 0.7s',
          }}
        >
          {/* Cover = disque entier */}
          <img
            src={coverUrl}
            alt="cover"
            className="w-full h-full rounded-full object-cover"
            style={{ zIndex: 2 }}
          />
          {/* Sillons SVG (overlay) */}
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
              transition: 'background 0.7s, box-shadow 0.7s, border 0.7s',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Vinyl; 