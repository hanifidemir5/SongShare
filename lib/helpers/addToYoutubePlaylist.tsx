import { Song } from "@/types";
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
  spotifyToken?: string | null,
  silent: boolean = false
): Promise<{ success: boolean; message?: string }> {
  if (!playlistId) {
    if (!silent) toast.warning("Oynatma Listesi Seç", { position: "top-right" });
    return { success: false, message: "Playlist seçilmedi" };
  }
  if (!token) {
    if (!silent) toast.error("Giriş Yapmış Olmalısın", { position: "top-right" });
    return { success: false, message: "Token eksik" };
  }

  let videoId: string | null = null;

  // Try to extract YouTube video ID from existing URL
  if (song.youtubeUrl) {
    const match = song.youtubeUrl.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
    videoId = match ? match[1] : null;
  }

  // If no YouTube URL but has Spotify URL, convert it
  if (!videoId && song.spotifyUrl && spotifyToken) {
    const loadingToast = !silent ? toast.loading("YouTube'da aranıyor...", { position: "top-right" }) : null;

    try {
      const youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
      videoId = await getYouTubeIdFromSpotifyUrl(song.spotifyUrl, spotifyToken, youtubeApiKey);
      if (loadingToast) toast.dismiss(loadingToast);

      if (!videoId) {
        if (!silent) toast.error("YouTube'da bulunamadı", { position: "top-right" });
        return { success: false, message: "YouTube'da bulunamadı" };
      }
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      if (!silent) toast.error("YouTube arama başarısız", { position: "top-right" });
      console.error("Spotify to YouTube conversion error:", error);
      return { success: false, message: "Dönüştürme hatası" };
    }
  }

  if (!videoId) {
    if (!silent) toast.error("Geçersiz URL - YouTube veya Spotify linki gerekli", { position: "top-right" });
    return { success: false, message: "Video ID bulunamadı" };
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
      if (!silent) {
        toast.success(`"${song.title}" YouTube oynatma listesine eklendi!`, {
          position: "top-right",
          autoClose: 3000,
        });
      }
      return { success: true };
    } else {
      const error = await response.json();
      console.error("YouTube API error:", error);

      // Handle duplicates (400 or 409 depending on API version, message hints)
      // YouTube Data API v3 usually returns 400 Bad Request with "video already in playlist" type message
      // or "playlistContainsVideo".
      const isDuplicate = error.error?.errors?.some((e: any) => e.reason === "playlistContainsVideo" || e.reason === "videoAlreadyInPlaylist") || error.error?.message?.includes("already in playlist");

      if (isDuplicate) {
        console.log(`Skipping duplicate video "${song.title}" for YouTube playlist.`);
        return { success: true, message: "Duplicate (Skipped)" }; // Treat as success
      }

      if (!silent) {
        toast.error(`YouTube'a eklenemedi: ${error.error?.message || "Bilinmeyen hata"}`, {
          position: "top-right",
          autoClose: 5000,
        });
      }
      return { success: false, message: error.error?.message || "API Hatası" };
    }
  } catch (error) {
    console.error("Network error:", error);
    if (!silent) {
      toast.error("Bağlantı hatası. Tekrar deneyin.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
    return { success: false, message: "Ağ hatası" };
  }
}
