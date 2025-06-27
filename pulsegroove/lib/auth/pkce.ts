// Génère un code_verifier aléatoire
export function generateCodeVerifier(length = 128): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';
  for (let i = 0; i < length; i++) {
    verifier += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return verifier;
}

// Encode en base64url (sans padding)
function base64urlencode(str: ArrayBuffer): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Génère le code_challenge à partir du code_verifier (méthode S256)
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlencode(digest);
}

// Helpers pour stocker/récupérer le code_verifier (localStorage ou sessionStorage)
export function saveCodeVerifier(verifier: string) {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('pkce_code_verifier', verifier);
  }
}

export function getCodeVerifier(): string | null {
  if (typeof window !== 'undefined') {
    return window.sessionStorage.getItem('pkce_code_verifier');
  }
  return null;
} 