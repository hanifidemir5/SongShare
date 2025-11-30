"use client"; // Must be first line

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // correct for App Router
import { supabase } from "@/lib/supabaseClient";
import { handleYouTubeCallback } from "../handleYoutubeCallback";

export default function YouTubeCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function processYouTubeLogin() {
      try {
        const { data: authData, error } = await supabase.auth.getUser();

        if (error || !authData?.user) {
          router.replace("/services/auth/confirm-email");
          return;
        }

        const authUser = authData.user;

        await handleYouTubeCallback({
          id: authUser.id,
          email: authUser.email ?? null,
          user_metadata: authUser.user_metadata,
        });

        router.replace("/");
      } catch (error) {
        console.error("YouTube callback error:", error);
        router.replace("/");
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
