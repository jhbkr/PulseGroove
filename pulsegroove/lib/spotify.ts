import { useEffect, useState } from "react";
export const SPOTIFY_AUTH_URL  = "https://accounts.spotify.com/authorize";
export const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
export const SPOTIFY_API_URL   = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-read-currently-playing",
] as const;


export function getSpotifyAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
}) {
  const q = new URLSearchParams({
    client_id:         params.clientId,
    response_type:     "code",
    redirect_uri:      params.redirectUri,
    code_challenge:    params.codeChallenge,
    code_challenge_method: "S256",
    scope: SPOTIFY_SCOPES.join(" "),
  });
  return `${SPOTIFY_AUTH_URL}?${q.toString()}`;
}

export async function fetchSpotifyToken(params: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const body = new URLSearchParams({
    client_id: params.clientId,
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    code_verifier: params.codeVerifier,
  });
  const r = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!r.ok) throw new Error("Token exchange failed");
  return r.json() as Promise<{ access_token: string; expires_in: number }>;
}

/* ------------------------------------------------------------------ */
/*  SPOTIFY PLAYER                                                    */
/* ------------------------------------------------------------------ */
export interface CurrentlyPlaying {
  item?: any;
  currently_playing_type?: string;
}

export async function fetchCurrentlyPlaying(
  accessToken: string,
): Promise<CurrentlyPlaying | null> {
  const r = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export async function fetchAudioFeatures(
  accessToken: string,
  trackId: string,
) {
  const r = await fetch(`${SPOTIFY_API_URL}/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!r.ok) return null;
  return r.json();
}

export function useAudioFeatures(
  accessToken: string | null,
  trackId: string | null,
) {
  const [features, setFeatures] = useState<any>(null);
  useEffect(() => {
    if (!accessToken || !trackId) return;
    fetchAudioFeatures(accessToken, trackId).then(setFeatures);
  }, [accessToken, trackId]);
  return features;
}

export function useTrackBPM(
  trackName: string | null,
  artistName: string | null,
) {
  const [data, setData] = useState<{ bpm: number | null; source: string | null }>(
    { bpm: null, source: null },
  );

  useEffect(() => {
    if (!trackName || !artistName) return;

    const url = `/api/deezer-bpm?track=${encodeURIComponent(
      trackName,
    )}&artist=${encodeURIComponent(artistName)}`;

    fetch(url)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData({ bpm: null, source: null }));
  }, [trackName, artistName]);

  return data;
}

export const useDeezerBPM = useTrackBPM;
