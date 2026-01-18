import { supabase } from "@/lib/supabaseClient";
import { getUserToken, saveUserToken } from "./tokenManager";

/**
 * Refreshes a Spotify access token using the refresh token
 */
async function refreshSpotifyToken(
    userId: string,
    refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
        const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error("Spotify client credentials not configured");
            return null;
        }

        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Spotify token refresh failed:", errorData);
            return null;
        }

        const data = await response.json();
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken; // Spotify may or may not return a new refresh token

        // Save the new token to the database
        await saveUserToken(userId, "spotify", newAccessToken, newRefreshToken);

        console.log("✅ Spotify token refreshed successfully");
        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
        console.error("Error refreshing Spotify token:", error);
        return null;
    }
}

/**
 * Refreshes a YouTube/Google access token using the refresh token
 */
async function refreshYouTubeToken(
    userId: string,
    refreshToken: string
): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
        const clientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID;
        const clientSecret = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            console.error("YouTube client credentials not configured");
            return null;
        }

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                refresh_token: refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("YouTube token refresh failed:", errorData);
            return null;
        }

        const data = await response.json();
        const newAccessToken = data.access_token;

        // Save the new token to the database (Google doesn't return a new refresh token)
        await saveUserToken(userId, "youtube", newAccessToken, refreshToken);

        console.log("✅ YouTube token refreshed successfully");
        return { accessToken: newAccessToken, refreshToken };
    } catch (error) {
        console.error("Error refreshing YouTube token:", error);
        return null;
    }
}

/**
 * Gets a valid access token for the specified provider
 * Automatically refreshes the token if it's expired or about to expire
 */
export async function getValidToken(
    userId: string,
    provider: "spotify" | "youtube" | "google"
): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    try {
        // First, try to get the token from the database
        const tokens = await getUserToken(userId, provider);

        if (!tokens || !tokens.accessToken) {
            console.warn(`No ${provider} token found in database for user ${userId}`);
            return { accessToken: null, refreshToken: null };
        }

        // If we have a refresh token, try to refresh the access token proactively
        // This is useful because we can't easily detect if a token is expired without making an API call
        if (tokens.refreshToken) {
            let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

            if (provider === "spotify") {
                refreshedTokens = await refreshSpotifyToken(userId, tokens.refreshToken);
            } else if (provider === "youtube" || provider === "google") {
                refreshedTokens = await refreshYouTubeToken(userId, tokens.refreshToken);
            }

            // If refresh was successful, return the new token
            if (refreshedTokens) {
                return refreshedTokens;
            }

            // If refresh failed, fall back to the existing token (it might still be valid)
            console.warn(`Token refresh failed for ${provider}, using existing token`);
        }

        // Return the existing token if no refresh token is available or refresh failed
        return tokens;
    } catch (error) {
        console.error(`Error getting valid ${provider} token:`, error);
        return { accessToken: null, refreshToken: null };
    }
}

/**
 * Attempts to refresh a token after receiving a 401 error
 * This is a fallback mechanism for when proactive refresh fails
 */
export async function handleTokenError(
    userId: string,
    provider: "spotify" | "youtube" | "google"
): Promise<string | null> {
    console.log(`🔄 Attempting to recover from ${provider} token error...`);

    const tokens = await getUserToken(userId, provider);

    if (!tokens || !tokens.refreshToken) {
        console.error(`Cannot refresh ${provider} token: No refresh token available`);
        return null;
    }

    let refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

    if (provider === "spotify") {
        refreshedTokens = await refreshSpotifyToken(userId, tokens.refreshToken);
    } else if (provider === "youtube" || provider === "google") {
        refreshedTokens = await refreshYouTubeToken(userId, tokens.refreshToken);
    }

    if (refreshedTokens) {
        console.log(`✅ Successfully recovered from ${provider} token error`);
        return refreshedTokens.accessToken;
    }

    console.error(`❌ Failed to recover from ${provider} token error`);
    return null;
}
