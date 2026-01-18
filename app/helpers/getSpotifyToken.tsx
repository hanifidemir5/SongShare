// /app/helpers/authUtils.ts

import { supabase } from "@/lib/supabaseClient";
import { getValidToken } from "./tokenRefreshHandler";

export async function getSpotifyTokens() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { accessToken: null, refreshToken: null };

    // Use the new token refresh handler which automatically refreshes if needed
    const tokens = await getValidToken(user.id, "spotify");
    return tokens || { accessToken: null, refreshToken: null };
  } catch (err) {
    console.error("Spotify token alma hatası:", err);
    return { accessToken: null, refreshToken: null };
  }
}


export async function getYouTubeTokens() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { accessToken: null, refreshToken: null };

    // Try 'youtube' first (as saved in handleYouTubeCallback)
    let tokens = await getValidToken(user.id, "youtube");

    // Fallback to 'google' if needed (sometimes saved as google provider)
    if (!tokens || !tokens.accessToken) {
      tokens = await getValidToken(user.id, "google");
    }

    return tokens || { accessToken: null, refreshToken: null };
  } catch (err) {
    console.error("YouTube token retrieval error:", err);
    return { accessToken: null, refreshToken: null };
  }
}
