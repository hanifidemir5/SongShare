/**
 * Creates a new Spotify playlist for the authenticated user
 */
export async function createSpotifyPlaylist(
    accessToken: string,
    playlistName: string,
    description?: string
): Promise<{ id: string; name: string } | null> {
    try {
        console.log("[DEBUG] 🎵 createSpotifyPlaylist called", {
            playlistName,
            description,
            hasToken: !!accessToken,
            tokenPreview: accessToken ? `${accessToken.substring(0, 15)}...` : "none"
        });

        // 1️⃣ Get current user's Spotify ID
        console.log("[DEBUG] Fetching Spotify user info...");
        const userRes = await fetch("https://api.spotify.com/v1/me", {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        console.log("[DEBUG] User info response status:", userRes.status);

        if (!userRes.ok) {
            const errorText = await userRes.text();
            console.error("[DEBUG] ❌ Failed to fetch Spotify user info:", {
                status: userRes.status,
                statusText: userRes.statusText,
                error: errorText
            });
            return null;
        }

        const userData = await userRes.json();
        const userId = userData.id;
        console.log("[DEBUG] ✅ Got Spotify user ID:", userId);

        // 2️⃣ Create the playlist
        const requestBody = {
            name: playlistName,
            description: description || `Created from SongShare`,
            public: false, // Default to private
        };

        console.log("[DEBUG] Creating playlist with body:", requestBody);

        const response = await fetch(
            `https://api.spotify.com/v1/users/${userId}/playlists`,
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
            console.error("[DEBUG] ❌ Failed to create Spotify playlist:", {
                status: response.status,
                statusText: response.statusText,
                error: errorData
            });
            return null;
        }

        const playlistData = await response.json();
        console.log("[DEBUG] ✅ Spotify playlist created successfully:", {
            id: playlistData.id,
            name: playlistData.name,
            uri: playlistData.uri
        });

        return {
            id: playlistData.id,
            name: playlistData.name,
        };
    } catch (error) {
        console.error("[DEBUG] ❌ Exception in createSpotifyPlaylist:", error);
        return null;
    }
}
