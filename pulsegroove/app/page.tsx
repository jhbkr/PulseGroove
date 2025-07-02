"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  saveCodeVerifier,
} from "@/lib/auth/pkce";
import {
  getSpotifyAuthUrl,
  fetchCurrentlyPlaying,
  useTrackBPM,
} from "@/lib/spotify";
import { usePalette } from "@/lib/theme/usePalette";
import GradientBackground from "@/components/GradientBackground";
import Vinyl from "@/components/Vinyl";
import { createHash } from "crypto";
import { Palette } from "lucide-react";

const CLIENT_ID   = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

export default function Home() {
  const [track,  setTrack]  = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [advancedPalette, setAdvancedPalette] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState<string | null>(null);
  const [colorCount, setColorCount] = useState(3);

  /* ---------- Palette dynamique ------------------------------------ */
  const palette      = usePalette(track?.album.images[0]?.url);
  const swatchOrder = [
    "Vibrant",
    "LightVibrant",
    "DarkVibrant",
    "Muted",
    "LightMuted",
    "DarkMuted"
  ];
  const sortedSwatches = useMemo(() => {
    if (!palette) return [];
    return swatchOrder
      .map(name => palette[name])
      .filter(Boolean)
      .sort((a, b) => (b.getHsl?.()[1] || 0) - (a.getHsl?.()[1] || 0));
  }, [palette]);
  const mixColors = sortedSwatches.slice(0, colorCount).map(s => s.hex);
  const paletteForUI = advancedPalette && mixColors.length > 1
    ? mixColors
    : [selectedSwatch || (palette?.Vibrant?.hex || "#18181b"), palette?.Muted?.hex || "#23232b", palette?.DarkVibrant?.hex || "#18181b"];

  /* ---------- BPM (hook universel) --------------------------------- */
  const { bpm, source } = useTrackBPM(
    track?.name ?? null,
    track?.artists?.[0]?.name ?? null,
  );

  /* ---------- Login / Logout Spotify ------------------------------- */
  async function handleLogin() {
    const verifier  = generateCodeVerifier();
    saveCodeVerifier(verifier);
    const challenge = await generateCodeChallenge(verifier);
    window.location.href = getSpotifyAuthUrl({
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
    });
  }
  function handleLogout() {
    window.localStorage.removeItem("spotify_access_token");
    setToken(null);
    setTrack(null);
  }

  /* ---------- Poll « currently-playing » --------------------------- */
  useEffect(() => {
    const t = typeof window !== "undefined"
      ? window.localStorage.getItem("spotify_access_token")
      : null;
    setToken(t);
    if (!t) return;

    const poll = () =>
      fetchCurrentlyPlaying(t!)
        .then((d: any) => {                         // ← typé « any » pour TS
          if (d?.item && d.currently_playing_type === "track") {
            setTrack(d.item);
          } else {
            setTrack(null);
          }
        })
        .catch(() => setError("Erreur Spotify"))
        .finally(() => setLoading(false));

    setLoading(true);
    poll();
    const id = setInterval(poll, 3_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => setMounted(true), []);

  /* ---------- UI ---------------------------------------------------- */
  const mainColor = selectedSwatch || paletteForUI[0];

  // Génère une clé unique pour la transition à partir du mix, du nombre de couleurs et de la couleur sélectionnée
  const paletteTransitionKey = useMemo(
    () => [mixColors.join('-'), colorCount, selectedSwatch].join('|'),
    [mixColors, colorCount, selectedSwatch]
  );

  // Menu coulissant palette
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);

  // Pour drag & drop du mix
  const [mixOrder, setMixOrder] = useState<number[]>(() => mixColors.map((_, i) => i));
  const dragIndex = useRef<number | null>(null);
  // Met à jour l'ordre si le mix change (ex: slider)
  useEffect(() => {
    setMixOrder(mixColors.map((_, i) => i));
  }, [mixColors.length, colorCount]);
  // Fonction de drag & drop
  function handleDragStart(i: number) { dragIndex.current = i; }
  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === i) return;
    setMixOrder(order => {
      const newOrder = [...order];
      const [removed] = newOrder.splice(dragIndex.current!, 1);
      newOrder.splice(i, 0, removed);
      dragIndex.current = i;
      return newOrder;
    });
  }
  function handleDragEnd() { dragIndex.current = null; }
  // mixColors réordonné issu du drag & drop
  const mixColorsOrdered = mixOrder.map(i => mixColors[i]);

  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("palette-anim-keyframes")) {
      const style = document.createElement('style');
      style.id = "palette-anim-keyframes";
      style.innerHTML = `
        @keyframes swatchPulse {
          0% { box-shadow: 0 0 0 2px #fff, 0 0 16px 2px var(--swatch-color, #fff8); transform: scale(1.12); }
          100% { box-shadow: 0 0 0 4px #fff, 0 0 32px 8px var(--swatch-color, #fff4); transform: scale(1.18); }
        }
        @keyframes mixPulse {
          0% { box-shadow: 0 0 8px 2px var(--mix-color, #fff3); transform: scale(1.08); }
          100% { box-shadow: 0 0 18px 8px var(--mix-color, #fff6); transform: scale(1.16); }
        }
        .animate-glow { animation: glowFade 2.2s infinite alternate; }
        @keyframes glowFade {
          0% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !document.getElementById("neon-keyframes")) {
      const style = document.createElement('style');
      style.id = "neon-keyframes";
      style.innerHTML = `
        @keyframes neon-flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 8px #fff, 0 0 24px #a855f7, 0 0 48px #a855f7, 0 0 64px #f472b6; }
          48% { opacity: 0.92; text-shadow: 0 0 12px #fff, 0 0 32px #a855f7, 0 0 64px #a855f7, 0 0 80px #f472b6; }
          50% { opacity: 0.7; text-shadow: 0 0 4px #fff, 0 0 12px #a855f7, 0 0 24px #a855f7, 0 0 32px #f472b6; }
          52% { opacity: 0.95; text-shadow: 0 0 16px #fff, 0 0 40px #a855f7, 0 0 80px #a855f7, 0 0 100px #f472b6; }
        }
        @keyframes neon-btn-flicker {
          0%, 100% { box-shadow: 0 0 16px 2px #f472b6cc, 0 2px 24px 0 #a855f7cc; }
          50% { box-shadow: 0 0 32px 8px #f472b6cc, 0 2px 32px 0 #a855f7cc; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <>
      <GradientBackground palette={paletteForUI} bpm={typeof bpm === 'number' && !isNaN(bpm) ? bpm : 0} trackId={track && (track.id || track.uri) ? (track.id || track.uri) : null} transitionKey={paletteTransitionKey} />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-colors duration-700"
        style={{
          background: "transparent",
        }}
      >
        <div
          className="font-orbitron text-4xl font-extrabold mb-8 tracking-widest"
          style={{
            color: "#fff",
            textShadow: "0 0 8px #fff, 0 0 24px #a855f7, 0 0 48px #a855f7, 0 0 64px #f472b6",
            letterSpacing: 4,
            animation: "neon-flicker 2.5s infinite alternate",
            opacity: 0.92,
            filter: 'brightness(1.2)',
          }}
        >
          PulseGroove
        </div>

        {!token ? (
          <Button className="w-60 py-4 text-lg font-semibold shadow-xl" onClick={handleLogin}>
            Se connecter à Spotify
          </Button>
        ) : loading ? (
          <p className="text-gray-200">Chargement de la piste en cours…</p>
        ) : track ? (
          <div className="flex flex-col items-center w-full max-w-md mx-auto">
            <div className="flex justify-center mb-10">
              <Vinyl
                coverUrl={track.album.images[0]?.url}
                bpm={typeof bpm === 'number' && !isNaN(bpm) ? bpm : 0}
                palette={paletteForUI}
              />
            </div>
            <div
              className="glass-card flex flex-col items-center w-full px-8 py-7 mb-6 border"
              style={{
                background: 'rgba(255,255,255,0.22)',
                boxShadow: `0 8px 32px 0 ${paletteForUI[2]}cc, 0 1.5px 8px 0 #fff3`,
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 32,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                color: paletteForUI[2],
                minHeight: 150,
                transition: 'background 0.7s, color 0.7s, box-shadow 0.7s, border 0.7s',
              }}
            >
              <div
                className="text-5xl font-extrabold text-center mb-2 drop-shadow-xl tracking-wide"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  color: '#18181b',
                  textShadow: '0 2px 24px #fff, 0 1px 0 #0008',
                  letterSpacing: 2,
                  transition: 'color 0.7s',
                }}
              >
                {track.name}
              </div>
              <div
                className="text-lg text-center mb-4 font-medium italic tracking-wider"
                style={{ fontFamily: 'Inter, sans-serif', color: paletteForUI[1], opacity: 0.92, letterSpacing: 1.2, transition: 'color 0.7s' }}
              >
                {track.artists.map((a: any) => a.name).join(", ")}
              </div>
              <div className="flex flex-col items-center gap-1 mb-2">
                {bpm ? (
                  <div className="px-4 py-1 rounded-full bg-white/70 text-pink-700 font-mono font-bold text-lg shadow-md border border-pink-200" style={{ letterSpacing: 1 }}>
                    BPM&nbsp;: {Math.round(bpm)}
                    {source && (
                      <span style={{ fontSize: 12, opacity: 0.7, fontFamily: 'Inter, sans-serif' }}> ({source})</span>
                    )}
                  </div>
                ) : (
                  <div className="text-md text-gray-300">Recherche BPM…</div>
                )}
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="mt-6 px-8 py-4 rounded-full text-lg font-bold shadow-xl border-2 border-pink-400 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 hover:from-pink-400 hover:to-purple-400 transition-all cursor-pointer hover:brightness-125 hover:shadow-2xl"
              style={{
                color: "#fff",
                textShadow: "0 1px 8px #fff8",
                boxShadow: "0 0 16px 2px #f472b6cc, 0 2px 24px 0 #a855f7cc",
                border: "2px solid #fff4",
                backdropFilter: "blur(8px)",
                animation: "neon-btn-flicker 2.5s infinite alternate",
                transition: 'background 0.7s, color 0.7s, border 0.7s, box-shadow 0.7s',
                fontFamily: 'Orbitron, Audiowide, Monoton, Playfair Display, serif',
                letterSpacing: 2,
                cursor: "pointer",
              }}
            >
              Se déconnecter
            </Button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-4">Aucune piste en cours de lecture.</p>
            <Button variant="destructive" onClick={handleLogout} className="mt-2 cursor-pointer hover:brightness-125 hover:shadow-2xl">
              Se déconnecter
            </Button>
          </>
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {/* Bouton flottant Vision Pro pour ouvrir le menu palette */}
        <button
          onClick={() => setPaletteMenuOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-white/30 backdrop-blur-xl border border-white/30 shadow-xl rounded-full p-4 flex items-center justify-center hover:bg-white/50 transition-all"
          style={{ boxShadow: '0 8px 32px 0 #0003', border: '1.5px solid rgba(255,255,255,0.25)' }}
          aria-label="Ouvrir la gestion des couleurs"
        >
          <Palette size={28} className="text-gray-800 drop-shadow" />
        </button>

        {/* Menu coulissant Vision Pro glassmorphism */}
        <div
          className={`fixed top-0 right-0 h-full w-[340px] z-50 transition-transform duration-500 ${paletteMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{
            background: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(24px)',
            borderRadius: '32px 0 0 32px',
            boxShadow: '0 8px 32px 0 #0003',
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-bold text-lg tracking-wide text-gray-800 drop-shadow">Palette dynamique</span>
              <button onClick={() => setPaletteMenuOpen(false)} className="rounded-full p-2 hover:bg-white/40 transition">
                <span className="text-xl font-bold">×</span>
              </button>
            </div>
            {/* Slider Vision Pro */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-gray-700">Mix :</span>
              <input
                type="range"
                min={2}
                max={sortedSwatches.length}
                value={colorCount}
                onChange={e => setColorCount(Number(e.target.value))}
                className="w-28 accent-pink-600"
              />
              <span className="font-bold text-pink-700">{colorCount}</span>
              <span className="text-gray-700">couleurs</span>
            </div>
            {/* Swatches Vision Pro */}
            <div className="flex flex-wrap gap-3 mb-4">
              {Object.entries(palette || {}).map(([name, swatch]: any) =>
                swatch && swatch.hex ? (
                  <div key={name} className="flex flex-col items-center cursor-pointer group relative">
                    {/* Halo lumineux animé autour de la swatch sélectionnée */}
                    {selectedSwatch === swatch.hex && (
                      <span
                        className="absolute -inset-1 rounded-[14px] z-0 animate-glow"
                        style={{
                          background: `radial-gradient(circle, ${swatch.hex}55 60%, transparent 100%)`,
                          filter: 'blur(6px)',
                          pointerEvents: 'none',
                          transition: 'background 0.7s',
                        }}
                      />
                    )}
                    <div
                      onClick={paletteMenuOpen ? () => setSelectedSwatch(swatch.hex) : undefined}
                      style={{
                        width: 32, height: 32, borderRadius: 10, background: swatch.hex,
                        border: selectedSwatch === swatch.hex ? '2.5px solid #d72660' : '1.5px solid #888',
                        boxShadow: selectedSwatch === swatch.hex ? '0 0 0 2px #fff, 0 0 16px 2px ' + swatch.hex + '88' : 'none',
                        outline: selectedSwatch === swatch.hex ? '2px solid #fff' : 'none',
                        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
                        opacity: paletteMenuOpen ? 1 : 0.7,
                        cursor: paletteMenuOpen ? 'pointer' : 'default',
                        zIndex: 1,
                        transform: selectedSwatch === swatch.hex ? 'scale(1.12)' : 'scale(1)',
                        animation: selectedSwatch === swatch.hex ? 'swatchPulse 1.6s infinite alternate' : 'none',
                      }}
                      title={swatch.hex}
                    />
                    <span className="mt-1 text-[11px] text-gray-700 group-hover:underline" style={{ fontWeight: selectedSwatch === swatch.hex ? 700 : 400 }}>{name}</span>
                    <span className="text-[10px] text-gray-500">{swatch.hex}</span>
                  </div>
                ) : null
              )}
            </div>
            <div
              className="flex gap-1 mb-2"
              style={{ minHeight: 32 }}
            >
              {mixColorsOrdered.map((hex, i) => (
                <div
                  key={hex}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: hex,
                    width: 26, height: 26, borderRadius: 7, border: '1.5px solid #888',
                    boxShadow: '0 0 8px 2px ' + hex + '33',
                    transition: 'all 0.5s cubic-bezier(.4,0,.2,1)',
                    marginLeft: i === 0 ? 0 : -8,
                    zIndex: 10 + i,
                    cursor: 'grab',
                    transform: dragIndex.current === i ? 'scale(1.22) rotate(-4deg)' : 'scale(1.08)',
                    animation: 'mixPulse 2.2s infinite alternate',
                    filter: dragIndex.current === i ? 'brightness(1.15) blur(0.5px)' : 'none',
                  }}
                  title={hex}
                />
              ))}
            </div>
            <div className="text-[11px] text-gray-500 mb-1">(Tri intelligent par saturation/importance)</div>
            {selectedSwatch && !mixColors.includes(selectedSwatch) && (
              <div className="mt-2 text-pink-700 font-bold text-xs">Couleur principale sélectionnée : <span style={{ color: selectedSwatch }}>{selectedSwatch}</span></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
