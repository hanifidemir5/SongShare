// services/auth/spotifyLogin.ts
import { supabase } from "@/lib/supabaseClient";

export async function loginWithSpotify() {
  await supabase.auth.signInWithOAuth({
    provider: "spotify",
    options: {
      redirectTo: "http://localhost:3000/services/auth/spotify/callback",
    },
  });
}
