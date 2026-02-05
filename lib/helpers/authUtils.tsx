// /app/helpers/authUtils.ts
export type TokenData = {
  accessToken: string;
  expiresAt?: number; // epoch ms
  scope?: string;
  tokenType?: string;
};

const PREFIX = "multi_auth_"; // prefix to avoid accidental collisions

function storageKey(provider: "spotify" | "youtube") {
  return `${PREFIX}${provider}_token`;
}

/**
 * Parse token data from URL hash (e.g. #access_token=...&expires_in=3600)
 * Works for implicit flow responses (response_type=token).
 */
export function parseTokenFromHash(): TokenData | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  if (!hash) return null;

  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  if (!accessToken) return null;

  const expiresIn = params.get("expires_in");
  const tokenType = params.get("token_type") ?? undefined;
  const scope = params.get("scope") ?? undefined;

  const now = Date.now();
  const expiresAt = expiresIn ? now + parseInt(expiresIn, 10) * 1000 : undefined;

  // clean address bar so refresh won't re-parse it
  window.history.replaceState(null, "", window.location.pathname + window.location.search);

  return {
    accessToken,
    expiresAt,
    scope,
    tokenType,
  };
}

export function saveToken(provider: "spotify" | "youtube", tokenData: TokenData) {
  const key = storageKey(provider);
  localStorage.setItem(key, JSON.stringify(tokenData));
}

export function getToken(provider: "spotify" | "youtube"): TokenData | null {
  const key = storageKey(provider);
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed: TokenData = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function removeToken(provider: "spotify" | "youtube") {
  localStorage.removeItem(storageKey(provider));
}

/** true if token exists and (if expiresAt present) hasn't expired */
export function isTokenValid(provider: "spotify" | "youtube") {
  const t = getToken(provider);
  if (!t) return false;
  if (!t.expiresAt) return true;
  return Date.now() < t.expiresAt;
}
