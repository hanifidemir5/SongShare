// src/services/auth/spotifyAuth.ts

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
const SPOTIFY_REDIRECT_URI =
  "http://localhost:3000/services/auth/spotify/callback";
// process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||

const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";
const SCOPES = [
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email",
];

export function redirectToSpotifyAuth() {
  const state = crypto.randomUUID(); // unique per attempt

  // optional → prevent account switching abuse
  sessionStorage.setItem("spotify_auth_state", state);

  const url = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${encodeURIComponent(
    SPOTIFY_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(
    SPOTIFY_REDIRECT_URI
  )}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(
    SCOPES.join(" ")
  )}&state=${state}`;

  window.location.href = url;
}

export async function fetchSpotifyProfile(accessToken: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error("Unable to fetch Spotify profile");

  return res.json();
}

export function logoutSpotify() {
  localStorage.removeItem("spotify_token");
}
