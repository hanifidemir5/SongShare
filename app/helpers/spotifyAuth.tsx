import { useSongs } from "../contexts/SongsContext";

const SPOTIFY_CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
// const SPOTIFY_REDIRECT_URI =
//   process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI ||
//   "https://songshareforlove.netlify.app";
const SPOTIFY_REDIRECT_URI =
  process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || "http://localhost:3000";
const SPOTIFY_AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
const RESPONSE_TYPE = "token";

const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
  "user-read-email",
];

export function loginWithSpotify() {
  const state = "spotify"; // unique identifier
  const url = `${SPOTIFY_AUTH_ENDPOINT}?client_id=${encodeURIComponent(
    SPOTIFY_CLIENT_ID
  )}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URI)}&response_type=${RESPONSE_TYPE}&scope=${encodeURIComponent(
    SPOTIFY_SCOPES.join(" ")
  )}&show_dialog=true&state=${state}`;

  window.location.href = url;
}

export async function getSpotifyUserProfile(token: string) {
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error("Failed to fetch Spotify profile");
  return res.json();
}

function logoutSpotify() {
  localStorage.removeItem("spotify_token");
}
