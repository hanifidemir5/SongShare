import { Song } from "@/types";

export async function addToSpotifyPlaylist(
  token: string | null,
  song: Song,
  playlistId: string | null,
  silent: boolean = false
): Promise<{ success: boolean; message?: string }> {
  if (!playlistId) {
    if (!silent) alert("Oynatma Listesi Seç");
    return { success: false, message: "Oynatma listesi seçilmedi" };
  }
  if (!token) {
    if (!silent) alert("Giriş Yapmış Olmalısın");
    return { success: false, message: "Token eksik" };
  }

  // Extract Spotify track ID from URL
  const match = song.spotifyUrl?.match(/track\/([a-zA-Z0-9]+)/);
  const trackId = match ? match[1] : null;
  if (!trackId) {
    if (!silent) alert("Invalid Spotify URL");
    return { success: false, message: "Geçersiz Spotify URL" };
  }

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks?uris=spotify:track:${trackId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (response.ok) {
      if (!silent) alert(`Added "${song.title}" to playlist!`);
      return { success: true };
    } else {
      const errorText = await response.text();
      console.error("Spotify API error:", errorText);
      if (!silent) alert("Failed to add song to playlist");
      return { success: false, message: "API hatası" };
    }
  } catch (error) {
    console.error("Spotify Add Error:", error);
    return { success: false, message: "Ağ hatası" };
  }
}
