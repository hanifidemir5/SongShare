// helpers/getYouTubeIdFromSpotify.ts
export async function getYouTubeIdFromSpotifyUrl(
  spotifyUrl: string,
  spotifyToken: string | null,
  youtubeApiKey: string | undefined
): Promise<string | null> {
  try {
    // 1️⃣ Extract Spotify track ID
    const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
    const trackId = match ? match[1] : null;
    if (!trackId) throw new Error("Invalid Spotify URL");

    // 2️⃣ Fetch track info from Spotify API
    const spotifyRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${spotifyToken}` },
    });

    if (!spotifyRes.ok) throw new Error("Failed to fetch track info from Spotify");
    const spotifyData = await spotifyRes.json();

    const trackName = spotifyData.name;
    const artistName = spotifyData.artists?.[0]?.name;

    if (!trackName || !artistName) throw new Error("Missing track info");

    const searchQuery = `${artistName} ${trackName}`;

    // 3️⃣ Search on YouTube
    const youtubeRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=id&type=video&maxResults=1&q=${encodeURIComponent(
        searchQuery
      )}&key=${youtubeApiKey}`
    );

    if (!youtubeRes.ok) throw new Error("Failed to fetch from YouTube");
    const youtubeData = await youtubeRes.json();

    const videoId = youtubeData.items?.[0]?.id?.videoId ?? null;
    return videoId;
  } catch (error) {
    console.error("Error getting YouTube ID from Spotify URL:", error);
    return null;
  }
}
