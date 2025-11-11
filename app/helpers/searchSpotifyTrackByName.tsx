import { getYouTubeIdFromSpotifyUrl } from "./getYouTubeUrlFromSpotify";
import { getSpotifyAccessToken } from "./spotifyTokenManager";

export async function searchSpotifyTrackByName(query: string) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;
  const spotifyAccessToken = await getSpotifyAccessToken();

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${spotifyAccessToken}` },
  });

  if (!response.ok) throw new Error("Failed to search Spotify");

  const data = await response.json();

  const track = data.tracks?.items?.[0];
  if (!track) throw new Error("No matching track found");

  const youtubeVideoId = await getYouTubeIdFromSpotifyUrl(
    track.external_urls.spotify,
    spotifyAccessToken,
    process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
  );
  const youtubeUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;

  return {
    id: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    spotifyUrl: track.external_urls.spotify,
    youtubeUrl: youtubeUrl,
  };
}
