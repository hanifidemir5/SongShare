"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleSpotifyCallback } from "@/app/services/auth/spotify/handleSpotifyCallback";
import { supabase } from "@/lib/supabaseClient";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<any>(null);
  useEffect(() => {
    async function process() {
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error) {
          setLoginError(error);
        }
        if (!authData?.user) {
          router.replace("/services/auth/confirm-email");
          return;
        }
        const authUser = authData.user;

        const spotifyIdentity = authUser.identities?.find(
          (identity) => identity.provider === "spotify"
        );

        const spotifyId = spotifyIdentity?.id ?? null;

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          console.error("Session alınamadı:", error);
          return;
        }

        console.log(authUser.identities);
        const providerAccessToken = data?.session.provider_token;
        const providerRefreshToken = data?.session.provider_refresh_token;

        await handleSpotifyCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
          spotifyId: spotifyId,
          spotifyAccessToken: providerAccessToken,
          spotifyRefreshToken: providerRefreshToken,
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
    <div>
      {loginError ? (
        <div>Error </div>
      ) : (
        // {loginError}
        <div className="flex items-center justify-center h-screen text-xl">
          Logging you in with Spotify...
        </div>
      )}
    </div>
  );
}
