import { supabase } from "@/lib/supabaseClient";
import { saveUserToken } from "@/lib/helpers/tokenManager";

export async function handleSpotifyCallback(authUser: {
  id: string;
  email: string | null;
  user_metadata?: any;
  spotifyId: string | null;
  spotifyAccessToken: string | null;
  spotifyRefreshToken: string | null;
}) {
  console.log("[DEBUG] handleSpotifyCallback started with user:", authUser.id);
  // Save Token to DB
  if (authUser.spotifyAccessToken) {
    console.log("[DEBUG] Saving Spotify token to DB for user:", authUser.id);
    await saveUserToken(authUser.id, "spotify", authUser.spotifyAccessToken, authUser.spotifyRefreshToken);
    console.log("[DEBUG] Spotify token saved successfully");
  } else {
    console.warn("[DEBUG] No Spotify access token found for user:", authUser.id);
  }
  const spotifyId = authUser.user_metadata?.provider_id ?? null;
  const displayName =
    authUser.user_metadata?.name ?? authUser.email ?? "Unknown";

  console.log("[DEBUG] Spotify ID:", spotifyId, "Display Name:", displayName);

  // Check if profile already exists
  console.log("[DEBUG] Checking for existing profile...");
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  console.log("[DEBUG] Existing profile:", existingProfile ? "Found" : "Not found");

  if (existingProfile) {
    console.log("[DEBUG] Updating existing profile...");
    await supabase
      .from("profiles")
      .update({
        spotify_id: spotifyId,
        is_spotify_connected: true,
        name: existingProfile.name ?? displayName,
        spotify_access_token: authUser.spotifyAccessToken,
      })
      .eq("id", authUser.id);

    console.log("[DEBUG] Profile updated successfully");
    return;
  }

  // Create new profile
  console.log("[DEBUG] Creating new profile...");
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: displayName,
      spotify_id: spotifyId,
      is_spotify_connected: true,
      spotify_access_token: authUser.spotifyAccessToken,
    })
    .select()
    .single();

  if (profileError) {
    console.error("[DEBUG] Profile creation error:", profileError);
    throw profileError;
  }

  console.log("[DEBUG] Profile created successfully, Spotify ID:", spotifyId);
  return spotifyId;
}
