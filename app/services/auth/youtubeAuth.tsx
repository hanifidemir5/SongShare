import { supabase } from "@/lib/supabaseClient";

const CLIENT_ID = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID!;
// const REDIRECT_URI = "https://songshareforlove.netlify.app";
const REDIRECT_URI = "http://localhost:300/services/auth/youtube/callback";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const RESPONSE_TYPE = "token";

const SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
];

export function loginWithYouTube() {
  const state = "youtube"; // unique identifier
  const authUrl = `${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=${RESPONSE_TYPE}&scope=${SCOPES.join(
    " "
  )}&include_granted_scopes=true&prompt=consent&state=${state}`;

  window.location.href = authUrl;
}

const connectYouTube = async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/services/auth/youtube/callback`,
      scopes:
        "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.force-ssl",
    },
  });
};
