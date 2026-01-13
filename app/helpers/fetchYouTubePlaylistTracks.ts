/**
 * Fetch videos from a YouTube playlist
 * @param playlistId - YouTube playlist ID
 * @param accessToken - YouTube/Google access token
 * @param limit - Maximum number of videos to fetch (default: 50)
 * @returns Array of normalized track objects
 */
export async function fetchYouTubePlaylistTracks(
    playlistId: string,
    accessToken: string,
    limit: number = 50
): Promise<{
    id: string;
    title: string;
    artist: string;
    youtubeUrl: string;
    spotifyUrl?: string;
}[]> {
    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${playlistId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch YouTube playlist:", response.statusText);
            return [];
        }

        const data = await response.json();

        const videos = data.items
            .filter((item: any) => item.snippet?.resourceId?.videoId)
            .map((item: any) => {
                const title = item.snippet.title;
                // Try to extract artist from title (common format: "Artist - Song Title")
                const parts = title.split(" - ");
                const artist = parts.length > 1 ? parts[0] : item.snippet.channelTitle || "Unknown";
                const songTitle = parts.length > 1 ? parts.slice(1).join(" - ") : title;

                return {
                    id: item.snippet.resourceId.videoId,
                    title: songTitle,
                    artist: artist,
                    youtubeUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                    spotifyUrl: undefined,
                };
            });

        return videos;
    } catch (error) {
        console.error("Error fetching YouTube playlist videos:", error);
        return [];
    }
}

/**
 * Fetch user's YouTube playlists
 */
export async function getUserYouTubePlaylists(
    accessToken: string
): Promise<{ id: string; title: string; itemCount: number }[]> {
    try {
        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=25",
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch YouTube playlists:", response.statusText);
            return [];
        }

        const data = await response.json();

        return data.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            itemCount: item.contentDetails?.itemCount || 0,
        }));
    } catch (error) {
        console.error("Error fetching YouTube playlists:", error);
        return [];
    }
}
