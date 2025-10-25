import { Song } from "../types";

export async function addToSpotifyPlaylist(token:string|null, song: Song, playlistId: string | null) {
    
    if (!playlistId) return alert("Please select a playlist");
    if (!token) return alert("You must be logged in");

    // Extract Spotify track ID from URL
    const match = song.spotifyUrl?.match(/track\/([a-zA-Z0-9]+)/);
    const trackId = match ? match[1] : null;
    if (!trackId) return alert("Invalid Spotify URL");

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
        alert(`Added "${song.title}" to playlist!`);
    } else {
        const errorText = await response.text();
        console.error("Spotify API error:", errorText);
        alert("Failed to add song to playlist");
    }

}
