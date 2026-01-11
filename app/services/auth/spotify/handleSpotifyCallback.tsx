import { supabase } from "@/lib/supabaseClient";
import { saveUserToken } from "@/app/helpers/tokenManager";

export async function handleSpotifyCallback(authUser: {
  id: string;
  email: string | null;
  user_metadata?: any;
  spotifyId: string | null;
  spotifyAccessToken: string | null; // Removed | undefined to match strict types if needed, or keep it.
  spotifyRefreshToken: string | null;
}) {
  // Save Token to DB
  if (authUser.spotifyAccessToken) {
    await saveUserToken(authUser.id, "spotify", authUser.spotifyAccessToken, authUser.spotifyRefreshToken);
  }
  const spotifyId = authUser.user_metadata?.provider_id ?? null;
  const displayName =
    authUser.user_metadata?.name ?? authUser.email ?? "Unknown";

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existingProfile) {
    await supabase
      .from("profiles")
      .update({
        spotify_id: spotifyId,
        is_spotify_connected: true,
        name: existingProfile.name ?? displayName,
        spotify_access_token: authUser.spotifyAccessToken,
      })
      .eq("id", authUser.id);

    return;
  }

  // Create new profile
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

  if (profileError) throw profileError;

  return spotifyId;
}
