import { supabase } from "@/lib/supabaseClient";
import { saveUserToken } from "@/app/helpers/tokenManager";

export async function handleYouTubeCallback(authUser: {
  id: string;
  email: string | null;
  user_metadata?: any;
  accessToken: string;
  refreshToken?: string | null;
}) {
  console.log("[DEBUG] handleYouTubeCallback started with user:", authUser.id);
  // Save Token to DB
  console.log("[DEBUG] Saving YouTube token to DB for user:", authUser.id);
  await saveUserToken(authUser.id, "youtube", authUser.accessToken, authUser.refreshToken);
  console.log("[DEBUG] YouTube token saved successfully");
  const youtubeId =
    authUser.user_metadata?.sub ?? authUser.user_metadata?.provider_id ?? null;

  const displayName =
    authUser.user_metadata?.name ??
    authUser.user_metadata?.full_name ??
    authUser.email ??
    "Unknown";

  console.log("[DEBUG] YouTube ID:", youtubeId, "Display Name:", displayName);

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
        youtube_id: youtubeId,
        is_youtube_connected: true,
        name: existingProfile.name ?? displayName,
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
      youtube_id: youtubeId,
      is_youtube_connected: true,
    })
    .select()
    .single();

  if (profileError) {
    console.error("[DEBUG] Profile creation error:", profileError);
    throw profileError;
  }

  console.log("[DEBUG] Profile created successfully");
  return;
}
