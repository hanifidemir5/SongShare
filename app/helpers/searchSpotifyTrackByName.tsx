
import { getSpotifyAccessToken } from "./spotifyTokenManager";
import { formatDuration } from "./formatDuration";

export async function searchSpotifyTrackByName(query: string) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10`;
  const spotifyAccessToken = await getSpotifyAccessToken();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${spotifyAccessToken}` },
  });

  if (!response.ok) throw new Error("Failed to search Spotify");

  const data = await response.json();

  if (!data.tracks?.items?.length) throw new Error("No matching track found");

  // Return a list of tracks without fetching YouTube ID for each (too slow)
  return data.tracks.items.map((track: any) => ({
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    spotifyUrl: track.external_urls.spotify,
    duration: formatDuration(track.duration_ms),
    // youtubeUrl is intentionally omitted here for performance
  }));
}
