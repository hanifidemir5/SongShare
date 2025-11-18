"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { handleSpotifyCallback } from "@/app/services/auth/handleSpotifyCallback";
import { supabase } from "@/lib/supabaseClient";

export default function SpotifyCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function process() {
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error || !authData?.user) {
          router.replace("/services/auth/confirm-email");
          return;
        }

        const authUser = authData.user;

        // Fix TypeScript: cast undefined email to null
        await handleSpotifyCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
        });

        router.replace("/");
      } catch (error) {
        console.error("Spotify callback error", error);
        router.replace("/");
      }
    }

    process();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      Logging you in with Spotify...
    </div>
  );
}
