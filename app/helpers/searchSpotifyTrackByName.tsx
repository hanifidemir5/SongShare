export async function searchSpotifyTrackByName(token: string, query: string) {
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Failed to search Spotify");

  const data = await response.json();

  const track = data.tracks?.items?.[0];
  if (!track) throw new Error("No matching track found");

  return {
    id: track.id,
    name: track.name,
    artist: track.artists.map((a: any) => a.name).join(", "),
    spotifyUrl: track.external_urls.spotify,
  };
}
