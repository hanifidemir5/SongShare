export async function getSongInfo(url: string) {
  try {
    // 1️⃣ URL'nin YouTube mu Spotify mı olduğuna bakalım
    const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
    const isSpotify = url.includes("spotify.com/track");

    if (isYouTube) {
      // 🔸 YouTube işlemi
      const videoId = extractYouTubeId(url);
      if (!videoId) throw new Error("Geçersiz YouTube URL");

      const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // kendi API key'in
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      const data = await response.json();

      if (!data.items?.length) throw new Error("Video bulunamadı");

      const title = data.items[0].snippet.title;
      const channel = data.items[0].snippet.channelTitle;

      return { platform: "YouTube", title, artist: channel };
    }

    if (isSpotify) {
      // 🔸 Spotify işlemi
      const trackId = extractSpotifyId(url);
      if (!trackId) throw new Error("Geçersiz Spotify URL");

      // Access token'ı al
      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
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

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Şarkı bilgilerini al
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();

      return {
        platform: "Spotify",
        title: data.name,
        artist: data.artists.map((a: any) => a.name).join(", "),
      };
    }

    throw new Error("Desteklenmeyen URL");

  } catch (err) {
    console.error(err);
    return { error: (err as Error).message };
  }
}

// 🔹 Yardımcı fonksiyonlar
function extractYouTubeId(url: string) {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function extractSpotifyId(url: string) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}
