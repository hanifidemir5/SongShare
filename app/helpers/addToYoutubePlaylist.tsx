import { Song } from "../types";
import { toast } from "react-toastify";
import { getYouTubeIdFromSpotifyUrl } from "./getYouTubeUrlFromSpotify";

/**
 * Adds a video to a YouTube playlist
 * @param token YouTube OAuth access token
 * @param song Song object containing the URL
 * @param playlistId ID of the YouTube playlist
 * @param spotifyToken Optional Spotify token for URL conversion
 */
export async function addToYouTubePlaylist(
  token: string | null,
  song: Song,
  playlistId: string | null,
  spotifyToken?: string | null
) {
  if (!playlistId) {
    toast.warning("Oynatma Listesi Seç", { position: "top-right" });
    return;
  }
  if (!token) {
    toast.error("Giriş Yapmış Olmalısın", { position: "top-right" });
    return;
  }

  let videoId: string | null = null;

  // Try to extract YouTube video ID from existing URL
  if (song.youtubeUrl) {
    const match = song.youtubeUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    videoId = match ? match[1] : null;
  }

  // If no YouTube URL but has Spotify URL, convert it
  if (!videoId && song.spotifyUrl && spotifyToken) {
    const loadingToast = toast.loading("YouTube'da aranıyor...", { position: "top-right" });

    try {
      const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      videoId = await getYouTubeIdFromSpotifyUrl(song.spotifyUrl, spotifyToken, youtubeApiKey);
      toast.dismiss(loadingToast);

      if (!videoId) {
        toast.error("YouTube'da bulunamadı", { position: "top-right" });
        return;
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("YouTube arama başarısız", { position: "top-right" });
      console.error("Spotify to YouTube conversion error:", error);
      return;
    }
  }

  if (!videoId) {
    toast.error("Geçersiz URL - YouTube veya Spotify linki gerekli", { position: "top-right" });
    return;
  }

  const body = {
    snippet: {
      playlistId: playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId: videoId,
      },
    },
  };

  try {
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (response.ok) {
      toast.success(`"${song.title}" YouTube oynatma listesine eklendi!`, {
        position: "top-right",
        autoClose: 3000,
      });
      console.log(`Successfully added "${song.title}" to YouTube playlist`);
    } else {
      const error = await response.json();
      console.error("YouTube API error:", error);
      toast.error(`YouTube'a eklenemedi: ${error.error?.message || "Bilinmeyen hata"}`, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  } catch (error) {
    console.error("Network error:", error);
    toast.error("Bağlantı hatası. Tekrar deneyin.", {
      position: "top-right",
      autoClose: 5000,
    });
  }
}
