import { supabase } from "@/lib/supabaseClient";

export async function handleYouTubeCallback(authUser: {
  id: string;
  email: string | null;
  user_metadata?: any;
}) {
  const youtubeId =
    authUser.user_metadata?.sub ?? authUser.user_metadata?.provider_id ?? null;

  const displayName =
    authUser.user_metadata?.name ??
    authUser.user_metadata?.full_name ??
    authUser.email ??
    "Unknown";

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existingProfile) {
    await supabase
      .from("profiles")
      .update({
        youtube_id: youtubeId,
        is_youtube_connected: true,
        name: existingProfile.name ?? displayName,
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
      youtube_id: youtubeId,
      is_youtube_connected: true,
    })
    .select()
    .single();

  if (profileError) throw profileError;

  return;
}
