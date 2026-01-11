"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleSpotifyCallback } from "@/app/services/auth/spotify/handleSpotifyCallback";
import { supabase } from "@/lib/supabaseClient";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<any>(null);
  useEffect(() => {
    async function processSpotifyLogin() {
      // 0. Check for errors in URL
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const errorDesc = params.get("error_description");

        if (error) {
          console.error("Spotify Login Error:", error, errorDesc);

          if (errorDesc?.includes("Identity is already linked")) {
            // VERIFY: Is it linked to the CURRENT user?
            const { data } = await supabase.auth.getUser();
            const user = data?.user;

            const isAlreadyLinkedToMe = user?.identities?.some(
              (id) => id.provider === "spotify"
            );

            if (isAlreadyLinkedToMe) {
              console.log("Spotify: Self-collision detected. Refreshing token.");

              // Retry with SignIn (Refresh)
              const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: "spotify",
                options: {
                  redirectTo: "http://localhost:3000/services/auth/spotify/callback",
                  scopes: [
                    "user-read-email",
                    "playlist-read-private",
                    "playlist-modify-private",
                    "playlist-modify-public",
                    "playlist-read-collaborative",
                  ].join(" "),
                  queryParams: {
                    show_dialog: "true",
                  },
                },
              });
              if (signInError) console.error("Re-auth failed", signInError);
              return;

            } else {
              // Linked to someone else
              console.log("Spotify: Identity linked to another user. Blocking.");
              window.location.href = "/?error=IdentityLinked";
              return;
            }
          }

          window.location.href = "/";
          return;
        }
      }

      try {
        const { data: authData, error } = await supabase.auth.getUser();

        if (error || !authData?.user) {
          router.replace("/");
          return;
        }

        const authUser = authData.user;

        // IDENTITY INTEGRITY CHECK (Session Guard)
        if (typeof window !== "undefined") {
          const expectedUserId = localStorage.getItem("latest_link_user_id");

          if (expectedUserId && authUser.id !== expectedUserId) {
            console.error("Spotify: SESSION MISMATCH! Logging out.");
            await supabase.auth.signOut();
            localStorage.removeItem("latest_link_user_id");
            window.location.href = "/?error=IdentityLinkedToAnotherUser";
            return;
          }
          localStorage.removeItem("latest_link_user_id");
        }

        const spotifyIdentity = authUser.identities?.find(
          (identity) => identity.provider === "spotify"
        );

        const spotifyId = spotifyIdentity?.id ?? null;

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session) {
          console.error("Session alınamadı:", error);
          return;
        }

        const providerAccessToken = data?.session.provider_token || null;
        const providerRefreshToken = data?.session.provider_refresh_token || null;

        await handleSpotifyCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
          spotifyId: spotifyId,
          spotifyAccessToken: providerAccessToken,
          spotifyRefreshToken: providerRefreshToken,
        });

        window.location.href = "/";
      } catch (error) {
        console.error("Spotify callback error", error);
        window.location.href = "/";
      }
    }

    processSpotifyLogin();
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
