/**
 * Fetch tracks from a Spotify playlist
 * @param playlistId - Spotify playlist ID
 * @param accessToken - Spotify access token
 * @param limit - Maximum number of tracks to fetch (default: 50)
 * @returns Array of normalized track objects
 */
export async function fetchSpotifyPlaylistTracks(
    playlistId: string,
    accessToken: string,
    limit: number = 50,
    offset: number = 0
): Promise<{
    id: string;
    title: string;
    artist: string;
    spotifyUrl: string;
    youtubeUrl?: string;
    duration?: string;
}[]> {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch playlist tracks:", response.statusText);
            return [];
        }

        const data = await response.json();

        const tracks = data.items
            .filter((item: any) => item.track) // Filter out null tracks
            .map((item: any) => ({
                id: item.track.id,
                title: item.track.name,
                artist: item.track.artists.map((a: any) => a.name).join(", "),
                spotifyUrl: item.track.external_urls?.spotify || "",
                youtubeUrl: undefined, // Will be populated later if needed
                duration: new Date(item.track.duration_ms).toISOString().slice(14, 19), // format mm:ss
            }));

        return tracks;
    } catch (error) {
        console.error("Error fetching Spotify playlist tracks:", error);
        return [];
    }
}

/**
 * Get playlist info (name, track count)
 */
export async function getSpotifyPlaylistInfo(
    playlistId: string,
    accessToken: string
): Promise<{ name: string; trackCount: number } | null> {
    try {
        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}?fields=name,tracks.total`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) return null;

        const data = await response.json();
        return {
            name: data.name,
            trackCount: data.tracks?.total || 0,
        };
    } catch (error) {
        console.error("Error fetching playlist info:", error);
        return null;
    }
}
