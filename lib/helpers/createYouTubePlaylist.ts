/**
 * Creates a new YouTube playlist for the authenticated user
 */
export async function createYouTubePlaylist(
    accessToken: string,
    playlistName: string,
    description?: string
): Promise<{ id: string; title: string } | null> {
    try {
        console.log("[DEBUG] 📺 createYouTubePlaylist called", {
            playlistName,
            description,
            hasToken: !!accessToken,
            tokenPreview: accessToken ? `${accessToken.substring(0, 15)}...` : "none"
        });

        const requestBody = {
            snippet: {
                title: playlistName,
                description: description || "Created from SongShare",
            },
            status: {
                privacyStatus: "private", // Default to private
            },
        };

        console.log("[DEBUG] Creating YouTube playlist with body:", requestBody);

        // DEBUG: Check token info
        try {
            const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
            const tokenInfo = await tokenInfoRes.json();
            console.log("[DEBUG] Token Info:", tokenInfo);
        } catch (e) {
            console.error("[DEBUG] Could not verify token info:", e);
        }

        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestBody),
            }
        );

        console.log("[DEBUG] Create playlist response status:", response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("[DEBUG] ❌ Failed to create YouTube playlist (FULL):", JSON.stringify(errorData, null, 2));

            console.error("[DEBUG] ❌ Failed to create YouTube playlist:", {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });

            // Throw the error so PlayListModal can handle it
            throw errorData;
        }

        const playlistData = await response.json();
        console.log("[DEBUG] ✅ YouTube playlist created successfully:", {
            id: playlistData.id,
            title: playlistData.snippet.title
        });

        return {
            id: playlistData.id,
            title: playlistData.snippet.title,
        };
    } catch (error) {
        console.error("[DEBUG] ❌ Exception in createYouTubePlaylist:", error);
        throw error;
    }
}
