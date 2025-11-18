// src/lib/spotify.ts
const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const SPOTIFY_REDIRECT_URI =
  "http://localhost:3000/services/auth/spotify/callback";
// process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||

const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

// scopes you asked for previously — adjust if needed
const SCOPES = [
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email",
];

const STORAGE_KEY = "spotify_access_token";
const STORAGE_EXP_KEY = "spotify_access_token_expires_at";
const STATE_KEY = "spotify_oauth_state";

/**
 * Build Spotify authorize URL
 */
export function getSpotifyAuthUrl(): string {
  const state = cryptoRandomUUID();
  // save state to sessionStorage so we can verify on callback
  try {
    sessionStorage.setItem(STATE_KEY, state);
  } catch {
    /* ignore (sessionStorage may be unavailable in some contexts) */
  }
  const url = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${encodeURIComponent(
    SPOTIFY_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    SPOTIFY_REDIRECT_URI
  )}&response_type=${encodeURIComponent(RESPONSE_TYPE)}&scope=${encodeURIComponent(
    SCOPES.join(" ")
  )}&state=${encodeURIComponent(state)}&show_dialog=true`;

  return url;
}

/**
 * Redirect the browser to Spotify auth page
 */
export function redirectToSpotifyAuth(): void {
  window.location.href = getSpotifyAuthUrl();
}

/**
 * Extracts access token, expires_in and state from a hash fragment (window.location.hash).
 * Example hash: "#access_token=ABC&token_type=Bearer&expires_in=3600&state=..."
 */
export function parseHash(hash: string) {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  return {
    accessToken: params.get("access_token") ?? undefined,
    tokenType: params.get("token_type") ?? undefined,
    expiresIn: params.get("expires_in")
      ? Number(params.get("expires_in"))
      : undefined,
    state: params.get("state") ?? undefined,
    error: params.get("error") ?? undefined,
  };
}

/**
 * Store token and computed expiry timestamp in localStorage
 */
export function storeAccessToken(token: string, expiresInSeconds?: number) {
  try {
    localStorage.setItem(STORAGE_KEY, token);
    if (expiresInSeconds && !Number.isNaN(expiresInSeconds)) {
      const expiryTs = Date.now() + expiresInSeconds * 1000 - 60_000; // 1 minute safety margin
      localStorage.setItem(STORAGE_EXP_KEY, String(expiryTs));
    } else {
      localStorage.removeItem(STORAGE_EXP_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/**
 * Return access token if present and not expired. Otherwise returns null.
 */
export function getStoredAccessToken(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEY);
    const exp = localStorage.getItem(STORAGE_EXP_KEY);
    if (!token) return null;
    if (exp) {
      const expTs = Number(exp);
      if (Number.isNaN(expTs)) return token;
      if (Date.now() >= expTs) {
        // expired
        clearStoredAccessToken();
        return null;
      }
    }
    return token;
  } catch {
    return null;
  }
}

/**
 * Remove token from storage
 */
export function clearStoredAccessToken() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXP_KEY);
    sessionStorage.removeItem(STATE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Validate token by calling Spotify /me endpoint.
 * Returns the profile JSON on success or throws on failure.
 */
export async function fetchSpotifyProfile(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`Spotify /me failed: ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Validate stored token — returns boolean (and clears token if invalid)
 */
export async function validateStoredToken(): Promise<boolean> {
  const token = getStoredAccessToken();
  if (!token) return false;
  try {
    await fetchSpotifyProfile(token);
    return true;
  } catch {
    clearStoredAccessToken();
    return false;
  }
}

/**
 * Convenience: call this from your callback page (or homepage useEffect).
 * It will:
 *  - parse the hash
 *  - verify the state matches what's in sessionStorage
 *  - store the access token (with expiry)
 *  - return the Spotify profile
 *
 * Returns: { profile, token } on success or throws Error
 */
export async function handleCallbackFromHash(hash: string) {
  const { accessToken, expiresIn, state, error } = parseHash(hash);

  if (error) throw new Error(`Spotify error: ${error}`);

  const savedState = (() => {
    try {
      return sessionStorage.getItem(STATE_KEY);
    } catch {
      return null;
    }
  })();

  if (!accessToken) throw new Error("No access token in callback hash");

  // If state was set, verify it
  if (savedState && state && savedState !== state) {
    throw new Error("Invalid OAuth state (possible CSRF)");
  }

  // Save token and expiry
  storeAccessToken(accessToken, expiresIn);

  // fetch and return profile to caller
  const profile = await fetchSpotifyProfile(accessToken);
  return { token: accessToken, profile };
}

/**
 * Simple logout
 */
export function logoutSpotify() {
  clearStoredAccessToken();
}

/* -------------------------
   small helpers
   ------------------------*/
function cryptoRandomUUID() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // fallback
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}
