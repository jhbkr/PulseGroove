"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { generateCodeVerifier, generateCodeChallenge, saveCodeVerifier } from "@/lib/auth/pkce";
import { getSpotifyAuthUrl, fetchCurrentlyPlaying, useDeezerBPM } from "@/lib/spotify";
import { usePalette } from "@/lib/theme/usePalette";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

export default function Home() {
  const [track, setTrack] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const palette = usePalette(track?.album.images[0]?.url);

  const vibrant = palette?.Vibrant?.hex || "#18181b";
  const muted = palette?.Muted?.hex || "#23232b";
  const darkVibrant = palette?.DarkVibrant?.hex || "#18181b";
  const lightVibrant = palette?.LightVibrant?.hex || "#fff";
  const darkMuted = palette?.DarkMuted?.hex || "#18181b";
  const lightMuted = palette?.LightMuted?.hex || "#e0e0e0";

  const deezerBpm = useDeezerBPM(track?.name, track?.artists?.[0]?.name);

  async function handleLogin() {
    const verifier = generateCodeVerifier();
    saveCodeVerifier(verifier);
    const challenge = await generateCodeChallenge(verifier);
    const url = getSpotifyAuthUrl({
      clientId: CLIENT_ID,
      redirectUri: REDIRECT_URI,
      codeChallenge: challenge,
    });
    window.location.href = url;
  }

  function handleLogout() {
    window.localStorage.removeItem("spotify_access_token");
    setToken(null);
    setTrack(null);
  }

  useEffect(() => {
    const t = typeof window !== 'undefined' ? window.localStorage.getItem("spotify_access_token") : null;
    setToken(t);
    if (!t) return;

    let interval: NodeJS.Timeout;

    const fetchTrack = () => {
      fetchCurrentlyPlaying(t)
        .then((data) => {
          if (data && data.item && data.currently_playing_type === "track") {
            setTrack(data.item);
          } else {
            setTrack(null);
          }
        })
        .catch(() => setError("Erreur lors de la récupération de la piste en cours."))
        .finally(() => setLoading(false));
    };

    setLoading(true);
    fetchTrack();
    interval = setInterval(fetchTrack, 3000); // toutes les 3 secondes

    return () => clearInterval(interval);
  }, []);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-8 transition-colors duration-700"
      style={{
        background: mounted && track
          ? `linear-gradient(135deg, ${vibrant} 0%, ${muted} 60%, ${darkVibrant} 100%)`
          : "#18181b",
      }}
    >
      <div className="text-lg font-bold mb-8 opacity-60 tracking-widest" style={{ color: lightMuted }}>
        PulseGroove
      </div>
      {!token ? (
        <Button className="w-60 py-4 text-lg font-semibold shadow-xl" onClick={handleLogin}>
          Se connecter à Spotify
        </Button>
      ) : loading ? (
        <p className="text-gray-200">Chargement de la piste en cours...</p>
      ) : track ? (
        <>
          <img
            src={track.album.images[0]?.url}
            alt={track.name}
            className="rounded-xl w-64 h-64 object-cover shadow-2xl mb-6"
            style={{ border: `4px solid ${lightVibrant}` }}
          />
          <div className="text-3xl font-extrabold text-center mb-2" style={{ color: lightVibrant, textShadow: `0 2px 16px ${darkMuted}` }}>{track.name}</div>
          <div className="text-lg text-center mb-4" style={{ color: lightMuted }}>{track.artists.map((a: any) => a.name).join(", ")}</div>
          <div className="flex flex-col items-center gap-1 mb-4">
            {deezerBpm ? (
              <div className="text-md" style={{ color: vibrant }}>
                <span className="font-semibold">BPM :</span> {Math.round(deezerBpm)} <span style={{fontSize:12,opacity:0.7}}>(Deezer)</span>
              </div>
            ) : (
              <div className="text-md text-gray-300">Chargement BPM Deezer...</div>
            )}
          </div>
          <Button variant="destructive" onClick={handleLogout} className="mt-2" style={{ background: darkVibrant, color: lightVibrant, border: `1px solid ${lightVibrant}` }}>
            Se déconnecter
          </Button>
        </>
      ) : (
        <>
          <p className="text-gray-400 mb-4">Aucune piste en cours de lecture.</p>
          <Button variant="destructive" onClick={handleLogout} className="mt-2">Se déconnecter</Button>
        </>
      )}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {/* Debug UI (affiché seulement en dev et si connecté) */}
      {process.env.NODE_ENV !== 'production' && token && track?.id && (
        <div style={{
          marginTop: 32,
          background: '#222',
          color: '#fff',
          padding: 16,
          borderRadius: 8,
          maxWidth: 600,
          wordBreak: 'break-all',
          fontSize: 12,
          opacity: 0.85,
        }}>
          <div><b>DEBUG</b></div>
          <div><b>Token:</b> {token?.slice(0, 32)}... (len: {token?.length})</div>
          <div><b>Track ID:</b> {track?.id || 'null'}</div>
          <div><b>Erreur API:</b> {error || 'aucune'}</div>
        </div>
      )}
    </div>
  );
}
