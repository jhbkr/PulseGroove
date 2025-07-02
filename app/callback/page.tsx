"use client";
import { useEffect, useState } from "react";
import { getCodeVerifier } from "@/lib/auth/pkce";
import { fetchSpotifyToken } from "@/lib/spotify";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

export default function CallbackPage() {
  const [status, setStatus] = useState<string>("Connexion en cours...");
  const [error, setError] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function handleAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (!code) {
        setStatus("Erreur : code d'autorisation manquant.");
        setError(true);
        return;
      }
      const codeVerifier = getCodeVerifier();
      if (!codeVerifier) {
        setStatus("Erreur : code_verifier manquant (session expirée ?)");
        setError(true);
        return;
      }
      try {
        const tokenData = await fetchSpotifyToken({
          clientId: CLIENT_ID,
          code,
          redirectUri: REDIRECT_URI,
          codeVerifier,
        });
        // Stocker le token dans le localStorage ou state global (à adapter plus tard)
        window.localStorage.setItem("spotify_access_token", tokenData.access_token);
        setStatus("Connexion réussie ! Vous pouvez revenir à l'accueil.");
      } catch (e) {
        setStatus("Erreur lors de l'échange du token Spotify.");
        setError(true);
      }
    }
    handleAuth();
  }, []);

  useEffect(() => {
    if (status.startsWith("Connexion réussie")) {
      const timeout = setTimeout(() => {
        router.push("/");
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8">
      <h1 className="text-2xl font-bold">Authentification Spotify</h1>
      <p>{status}</p>
      {status.startsWith("Connexion réussie") && !error && (
        <div className="mt-4 flex flex-col items-center">
          <svg className="animate-spin h-8 w-8 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-sm text-gray-400 mt-2">Redirection...</span>
        </div>
      )}
      {error && (
        <Button variant="outline" onClick={() => router.push("/")}>Retour à l'accueil</Button>
      )}
    </main>
  );
} 