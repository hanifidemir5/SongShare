"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { handleSpotifyCallback } from "@/lib/services/auth/spotify/handleSpotifyCallback";
import { supabase } from "@/lib/supabaseClient";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<any>(null);
  useEffect(() => {
    console.log("[DEBUG] Spotify Callback Page Mounted");
    async function processSpotifyLogin() {
      console.log("[DEBUG] processSpotifyLogin started");
      // 0. Check for errors in URL
      console.log("[DEBUG] Step 1: Checking URL for errors");
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const errorDesc = params.get("error_description");
        console.log("[DEBUG] URL params - error:", error, "errorDesc:", errorDesc);

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
                  redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URI}/services/auth/spotify/callback`,
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

          console.log("[DEBUG] Error found in URL, redirecting to home");
          window.location.href = "/";
          return;
        }
        console.log("[DEBUG] No URL errors found");
      }

      console.log("[DEBUG] Step 2: Fetching authenticated user");
      try {
        console.log("[DEBUG] Calling supabase.auth.getUser() with 10s timeout...");

        // Add timeout to prevent infinite hanging
        const getUserPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getUser() timeout after 10 seconds")), 10000)
        );

        const { data: authData, error } = await Promise.race([
          getUserPromise,
          timeoutPromise
        ]) as any;

        console.log("[DEBUG] getUser() response - error:", error, "user:", authData?.user ? "Found" : "Not found");

        if (error || !authData?.user) {
          console.log("[DEBUG] No user found or error, redirecting home");
          router.replace("/");
          return;
        }

        const authUser = authData.user;
        console.log("[DEBUG] Auth user ID:", authUser.id);

        // IDENTITY INTEGRITY CHECK (Session Guard)
        console.log("[DEBUG] Step 3: Identity integrity check");
        if (typeof window !== "undefined") {
          const expectedUserId = localStorage.getItem("latest_link_user_id");
          console.log("[DEBUG] Expected user ID:", expectedUserId, "Actual user ID:", authUser.id);

          if (expectedUserId && authUser.id !== expectedUserId) {
            console.error("Spotify: SESSION MISMATCH! Logging out.");
            await supabase.auth.signOut();
            localStorage.removeItem("latest_link_user_id");
            window.location.href = "/?error=IdentityLinkedToAnotherUser";
            return;
          }
          localStorage.removeItem("latest_link_user_id");
        }

        console.log("[DEBUG] Step 4: Getting Spotify identity");
        const spotifyIdentity = authUser.identities?.find(
          (identity: { provider: string; id: string }) => identity.provider === "spotify"
        );
        console.log("[DEBUG] Spotify identity found:", spotifyIdentity ? "Yes" : "No");

        const spotifyId = spotifyIdentity?.id ?? null;

        console.log("[DEBUG] Step 5: Getting session for tokens");
        const { data, error: sessionError } = await supabase.auth.getSession();
        console.log("[DEBUG] Session response - error:", sessionError, "session:", data?.session ? "Found" : "Not found");

        if (sessionError || !data.session) {
          console.error("Session alınamadı:", sessionError);
          console.log("[DEBUG] Session error, returning");
          return;
        }

        const providerAccessToken = data?.session.provider_token || null;
        const providerRefreshToken = data?.session.provider_refresh_token || null;
        console.log("[DEBUG] Provider tokens - access:", providerAccessToken ? "Found" : "Missing", "refresh:", providerRefreshToken ? "Found" : "Missing");

        console.log("[DEBUG] Step 6: Calling handleSpotifyCallback");
        await handleSpotifyCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
          spotifyId: spotifyId,
          spotifyAccessToken: providerAccessToken,
          spotifyRefreshToken: providerRefreshToken,
        });
        console.log("[DEBUG] handleSpotifyCallback completed successfully");

        console.log("[DEBUG] Step 7: Redirecting to home page");
        window.location.href = "/";
      } catch (error) {
        console.error("[DEBUG] FATAL ERROR in Spotify callback:", error);
        console.error("[DEBUG] Error stack:", (error as Error).stack);
        console.log("[DEBUG] Attempting to redirect home after error");
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
