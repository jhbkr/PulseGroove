"use client";

import { useEffect, useState } from "react";
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

const CLIENT_ID   = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

export default function Home() {
  const [track,  setTrack]  = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

 
  const palette      = usePalette(track?.album.images[0]?.url);
  const vibrant      = palette?.Vibrant?.hex      || "#18181b";
  const muted        = palette?.Muted?.hex        || "#23232b";
  const darkVibrant  = palette?.DarkVibrant?.hex  || "#18181b";
  const lightVibrant = palette?.LightVibrant?.hex || "#fff";
  const lightMuted   = palette?.LightMuted?.hex   || "#e0e0e0";
  const darkMuted    = palette?.DarkMuted?.hex    || "#18181b";

 
  const { bpm, source } = useTrackBPM(
    track?.name ?? null,
    track?.artists?.[0]?.name ?? null,
  );

 
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

 
  useEffect(() => {
    const t = typeof window !== "undefined"
      ? window.localStorage.getItem("spotify_access_token")
      : null;
    setToken(t);
    if (!t) return;

    const poll = () =>
      fetchCurrentlyPlaying(t!)
        .then((d: any) => {                         
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

 
  return (
    <>
      <GradientBackground palette={[vibrant, muted, darkVibrant]} bpm={typeof bpm === 'number' && !isNaN(bpm) ? bpm : 0} trackId={track && (track.id || track.uri) ? (track.id || track.uri) : null} />
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-colors duration-700"
        style={{
          background: "transparent",
        }}
      >
        <div
          className="text-lg font-bold mb-8 opacity-60 tracking-widest"
          style={{ color: lightMuted }}
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
                palette={[vibrant, muted, darkVibrant]}
              />
            </div>
            <div
              className="glass-card flex flex-col items-center w-full px-8 py-7 mb-6 border"
              style={{
                background: 'rgba(255,255,255,0.22)',
                boxShadow: `0 8px 32px 0 ${darkMuted}cc, 0 1.5px 8px 0 #fff3`,
                border: '1.5px solid rgba(255,255,255,0.35)',
                borderRadius: 32,
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                color: darkVibrant,
                minHeight: 150,
              }}
            >
              <div
                className="text-5xl font-extrabold text-center mb-2 drop-shadow-xl tracking-wide"
                style={{
                  fontFamily: 'Playfair Display, serif',
                  color: '#18181b',
                  textShadow: '0 2px 24px #fff, 0 1px 0 #0008',
                  letterSpacing: 2,
                }}
              >
                {track.name}
              </div>
              <div
                className="text-lg text-center mb-4 font-medium italic tracking-wider"
                style={{ fontFamily: 'Inter, sans-serif', color: '#23232b', opacity: 0.92, letterSpacing: 1.2 }}
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
              className="mt-2"
              style={{
                background: darkVibrant,
                color: lightVibrant,
                border: `1px solid ${lightVibrant}`,
              }}
            >
              Se déconnecter
            </Button>
          </div>
        ) : (
          <>
            <p className="text-gray-400 mb-4">Aucune piste en cours de lecture.</p>
            <Button variant="destructive" onClick={handleLogout} className="mt-2">
              Se déconnecter
            </Button>
          </>
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}
    </div>
    </>
  );
}
