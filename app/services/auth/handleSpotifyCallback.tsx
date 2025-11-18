import { supabase } from "@/lib/supabaseClient";

export async function handleSpotifyCallback(authUser: {
  id: string;
  email: string | null;
  user_metadata?: any;
}) {
  const spotifyId = authUser.user_metadata?.spotify_id ?? null;
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
      })
      .eq("id", authUser.id);

    return;
  }

  // Create new profile
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: authUser.id, // tie profile to users table
      email: authUser.email,
      name: displayName,
      spotify_id: spotifyId,
      is_spotify_connected: true,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return;
}
