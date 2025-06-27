// Spotify API endpoints et helpers pour OAuth PKCE

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export const SPOTIFY_SCOPES = [
  'user-read-playback-state',
  'user-read-currently-playing',
];

export function getSpotifyAuthUrl({
  clientId,
  redirectUri,
  codeChallenge,
}: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
}): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    scope: SPOTIFY_SCOPES.join(' '),
  });
  return `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

// Échange le code contre un access_token (PKCE)
export async function fetchSpotifyToken({
  clientId,
  code,
  redirectUri,
  codeVerifier,
}: {
  clientId: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<any> {
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error('Token exchange failed');
  return res.json();
}

// Fetch la piste en cours
export async function fetchCurrentlyPlaying(accessToken: string): Promise<any> {
  const res = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Fetch les audio-features d'une track
export async function fetchAudioFeatures(accessToken: string, trackId: string): Promise<any> {
  const res = await fetch(`${SPOTIFY_API_URL}/audio-features/${trackId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return res.json();
} 