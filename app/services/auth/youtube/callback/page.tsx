"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { handleYouTubeCallback } from "@/lib/services/auth/youtube/handleYoutubeCallback";
import { toast } from "react-toastify";

export default function YouTubeCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function processYouTubeLogin() {
      // 0. Check for errors in URL (e.g. Identity Linked to different user)
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const errorDesc = params.get("error_description");
        if (error) {
          console.error("YouTube Login Error:", error, errorDesc);

          // Check if it's "Identity is already linked"
          if (errorDesc?.includes("Identity is already linked")) {
            // VERIFY: Is it linked to the CURRENT user?
            const { data } = await supabase.auth.getUser();
            const user = data?.user;

            // Check identities for 'google' or 'youtube' provider
            const isAlreadyLinkedToMe = user?.identities?.some(
              (id) => id.provider === "google" || id.provider === "youtube"
            );

            if (isAlreadyLinkedToMe) {
              console.log(
                "Identity is already linked to THIS user. Treating as success (Refresh Session)..."
              );
              console.log("DEBUG: Case 1 - Self-collision detected. Refreshing token.");

              // RE-AUTH LOGIC:
              // Since it's linked to ME, but linkIdentity failed (collision), 
              // we can safely "Sign In" with Google to refresh the tokens without losing session 
              // (because the session IS the same user).

              // FIND EMAIL FOR HINT
              const googleIdentity = user?.identities?.find(
                (id) => id.provider === "google"
              );
              const hintEmail = googleIdentity?.identity_data?.email;

              const { error: signInError } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${process.env.NEXT_PUBLIC_REDIRECT_URI}/services/auth/youtube/callback`,
                  queryParams: {
                    access_type: "offline",
                    // prompt: "consent", // REMOVED: Don't force consent again
                    ...(hintEmail ? { login_hint: hintEmail } : {}), // Create smoother flow
                  },
                  scopes: [
                    "email",
                    "profile",
                    "https://www.googleapis.com/auth/youtube",
                  ].join(" "),
                },
              });

              if (signInError) {
                console.error("Re-auth failed", signInError);
                window.location.href = "/?error=ReAuthFailed";
              }

              return;

            } else {
              // It is linked to SOMEONE ELSE
              console.log("DEBUG: Case 2 - Identity linked to another user. Blocking login.");
              // Redirect to main page with error param so the toast is shown there
              window.location.href = "/?error=IdentityLinked";
              // console.log("DEBUG: Stopped before Redirect for inspection.");
              return;
            }
          } else {
            toast.error("YouTube giriş hatası: " + errorDesc, {
              autoClose: 5000,
            });
            window.location.href = "/";
            return;
          }
        }
      }

      try {
        const { data: authData, error } = await supabase.auth.getUser();

        if (error || !authData?.user) {
          router.replace("/services/auth/confirm-email");
          return;
        }

        const authUser = authData.user;

        // IDENTITY INTEGRITY CHECK
        // This is ESSENTIAL because the "Re-Auth Logic" above might inadvertently log us in
        // as a different user if we guessed wrong about "isAlreadyLinkedToMe".
        if (typeof window !== "undefined") {
          const expectedUserId = localStorage.getItem("latest_link_user_id");

          if (expectedUserId && authUser.id !== expectedUserId) {
            console.error("SESSION MISMATCH: Linked to another user, and session switched!");
            // The flow 'succeeded' but logged us in as the OTHER user.
            // We must revert this immediately.
            await supabase.auth.signOut();
            localStorage.removeItem("latest_link_user_id");

            // Redirect with error
            window.location.href = "/?error=IdentityLinkedToAnotherUser";
            return;
          }
          // Cleanup
          localStorage.removeItem("latest_link_user_id");
        }

        // 1. Try grabbing token from Supabase Session
        // 1. Try parsing from URL hash/query FIRST (Priority for Linked Accounts)
        let accessToken: string | null = null;
        let refreshToken: string | null = null;

        if (typeof window !== "undefined") {
          // Check Hash
          if (window.location.hash) {
            const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
            // STRICTLY check for provider_token only.
            const hashToken = params.get("provider_token");
            if (hashToken) {
              console.log("Found YouTube provider_token in Hash");
              accessToken = hashToken;
            }
            const hashRefreshToken = params.get("provider_refresh_token");
            if (hashRefreshToken) {
              console.log("Found YouTube provider_refresh_token in Hash");
              refreshToken = hashRefreshToken;
            }
          }
          // Check Query
          if (!accessToken && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            const queryToken = params.get("provider_token");
            if (queryToken) {
              console.log("Found YouTube provider_token in Query");
              accessToken = queryToken;
            }
          }
          // Check Query for Refresh Token (independent of access token check order)
          if (!refreshToken && window.location.search) {
            const params = new URLSearchParams(window.location.search);
            const queryRefreshToken = params.get("provider_refresh_token");
            if (queryRefreshToken) {
              console.log("Found YouTube provider_refresh_token in Query");
              refreshToken = queryRefreshToken;
            }
          }
        }

        // 2. Fallback: Try grabbing token from Supabase Session (Only if not in URL)
        if (!accessToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          accessToken = sessionData.session?.provider_token || null;
        }

        if (accessToken) {
          // localStorage.setItem("youtube_token", accessToken); // Removed in favor of DB
        } else {
          console.error("CRITICAL: No YouTube token found in Session or Hash!");
        }

        // Get refresh token from session as fallback/primary if not in URL
        if (!refreshToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          refreshToken = sessionData.session?.provider_refresh_token || null;
        }

        console.log("FINAL Access Token:", accessToken);
        console.log("FINAL Refresh Token:", refreshToken);

        await handleYouTubeCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
          accessToken: accessToken!,
          refreshToken: refreshToken
        });

        window.location.href = "/";
      } catch (error) {
        console.error("YouTube callback error:", error);
        window.location.href = "/";
      }
    }

    processYouTubeLogin();
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen text-xl">
      Connecting your YouTube...
    </div>
  );
}
