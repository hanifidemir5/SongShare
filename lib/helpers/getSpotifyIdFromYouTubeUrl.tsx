// helpers/getSpotifyIdFromYouTube.ts
export async function getSpotifyIdFromYouTubeUrl(
  youtubeUrl: string,
  youtubeApiKey: string | undefined,
  spotifyToken: string | null
): Promise<string | null> {
  try {
    // 1️⃣ Extract YouTube video ID
    const match = youtubeUrl.match(
      /(?:v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
    );
    const videoId = match ? match[1] : null;
    if (!videoId) throw new Error("Invalid YouTube URL");

    // 2️⃣ Fetch video info from YouTube API
    const youtubeRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`
    );

    if (!youtubeRes.ok) throw new Error("Failed to fetch video info from YouTube");
    const youtubeData = await youtubeRes.json();

    const videoTitle = youtubeData.items?.[0]?.snippet?.title ?? "";
    if (!videoTitle) throw new Error("Video title not found");

    // 3️⃣ Clean title (remove extra text like “(Official Video)”)
    const cleanTitle = videoTitle
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/official|video|lyrics|audio|HD|4K/gi, "")
      .trim();

    // 4️⃣ Search on Spotify
    const spotifyRes = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        cleanTitle
      )}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${spotifyToken}`,
        },
      }
    );

    if (!spotifyRes.ok) throw new Error("Failed to fetch from Spotify");
    const spotifyData = await spotifyRes.json();

    const trackId = spotifyData.tracks?.items?.[0]?.id ?? null;

    return trackId;
  } catch (error) {
    console.error("Error getting Spotify ID from YouTube URL:", error);
    return null;
  }
}
