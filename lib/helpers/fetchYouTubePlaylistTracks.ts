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
    limit: number = 50,
    pageToken?: string
): Promise<{
    tracks: {
        id: string;
        title: string;
        artist: string;
        youtubeUrl: string;
        spotifyUrl?: string;
        duration?: string;
    }[];
    nextPageToken?: string;
}> {
    try {
        const pageTokenParam = pageToken ? `&pageToken=${pageToken}` : "";
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${playlistId}${pageTokenParam}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error("Failed to fetch YouTube playlist:", response.statusText);
            return { tracks: [], nextPageToken: undefined };
        }

        const data = await response.json();

        const videos = data.items
            .filter((item: any) => item.snippet?.resourceId?.videoId)
            .map((item: any) => ({
                id: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                channelTitle: item.snippet.channelTitle, // temp store
                youtubeUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
            }));

        // Batch fetch video durations (max 50 per request)
        const videoIds = videos.map((v: any) => v.id).join(",");
        let durationsMap: { [key: string]: string } = {};

        if (videoIds) {
            try {
                const videoRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );

                if (videoRes.ok) {
                    const videoData = await videoRes.json();
                    videoData.items.forEach((item: any) => {
                        const isoDuration = item.contentDetails?.duration;
                        if (isoDuration) {
                            durationsMap[item.id] = parseISODuration(isoDuration);
                        }
                    });
                }
            } catch (err) {
                console.warn("Could not fetch video durations:", err);
            }
        }

        const tracks = videos.map((item: any) => {
            // Artist parsing logic
            const parts = item.title.split(" - ");
            const artist = parts.length > 1 ? parts[0] : item.channelTitle || "Unknown";
            const songTitle = parts.length > 1 ? parts.slice(1).join(" - ") : item.title;

            return {
                id: item.id,
                title: songTitle,
                artist: artist,
                youtubeUrl: item.youtubeUrl,
                spotifyUrl: undefined,
                duration: durationsMap[item.id] || "-",
            };
        });

        return { tracks: tracks, nextPageToken: data.nextPageToken };
    } catch (error) {
        console.error("Error fetching YouTube playlist videos:", error);
        return { tracks: [], nextPageToken: undefined };
    }
}

// Helper to parse PT1H2M10S -> 01:02:10
function parseISODuration(iso: string): string {
    const match = iso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return "-";

    const hours = (match[1] || "").replace("H", "");
    const minutes = (match[2] || "").replace("M", "");
    const seconds = (match[3] || "").replace("S", "");

    const parts = [];
    if (hours) parts.push(hours);
    parts.push(minutes ? (hours && minutes.length === 1 ? "0" + minutes : minutes) : "0");
    parts.push(seconds ? (seconds.length === 1 ? "0" + seconds : seconds) : "00");

    return parts.join(":");
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
            const errorBody = await response.json();

            if (response.status === 404) {
                console.warn("User has no YouTube channel.");
                throw new Error("YouTube kanalınız bulunamadı. Lütfen YouTube'da bir kanal oluşturun.");
            }

            console.error("Failed to fetch YouTube playlists:", errorBody);
            throw errorBody;
        }

        const data = await response.json();
        console.log("DEBUG: YouTube API Response:", data);

        if (!data.items) {
            console.log("DEBUG: No items in response");
            return [];
        }

        return data.items.map((item: any) => ({
            id: item.id,
            title: item.snippet.title,
            itemCount: item.contentDetails?.itemCount || 0,
        }));
    } catch (error) {
        console.error("Error fetching YouTube playlists:", error);
        throw error;
    }
}
