// /app/helpers/authUtils.ts

import { supabase } from "@/lib/supabaseClient";
import { getUserToken } from "./tokenManager";

export async function getSpotifyTokens() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { accessToken: null, refreshToken: null };

    const tokens = await getUserToken(user.id, "spotify");
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
    let tokens = await getUserToken(user.id, "youtube");

    // Fallback to 'google' if needed (sometimes saved as google provider)
    if (!tokens) {
      tokens = await getUserToken(user.id, "google");
    }

    return tokens || { accessToken: null, refreshToken: null };
  } catch (err) {
    console.error("YouTube token retrieval error:", err);
    return { accessToken: null, refreshToken: null };
  }
}
