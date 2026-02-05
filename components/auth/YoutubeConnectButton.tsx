import { useAuth } from "@/contexts/AuthContext";

export default function YouTubeConnectButton() {
  const { profile, connectYouTube, disconnectYouTube } = useAuth();

  return (
    <button
      onClick={
        profile?.is_youtube_connected ? disconnectYouTube : connectYouTube
      }
      className={
        profile?.is_youtube_connected
          ? `hover:bg-[rgb(99_102_241/1)] text-left px-3 py-2 rounded-md text-red-600 w-full transition-colors`
          : `bg-red-600 hover:bg-red-400 text-left px-3 py-2 rounded-md text-gray-100 w-full transition-colors`
      }
    >
      {profile?.is_youtube_connected
        ? "YouTube Bağlantısını Kes"
        : "YouTube İle Bağlan"}
    </button>
  );
}
