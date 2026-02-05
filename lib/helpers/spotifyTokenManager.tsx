// spotifyTokenManager.ts
let cachedAccessToken: string | null = null;
let tokenExpiry: number | null = null;

export async function getSpotifyAccessToken() {
  const now = Date.now();

  // ✅ Reuse if still valid
  if (cachedAccessToken && tokenExpiry && now < tokenExpiry) {
    return cachedAccessToken;
  }

  // 🔄 Otherwise request a new one
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        btoa(
          process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID +
            ":" +
            process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`Failed to get token: ${data.error_description}`);

  cachedAccessToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000 - 60_000; // 1 min safety margin

  return cachedAccessToken;
}
