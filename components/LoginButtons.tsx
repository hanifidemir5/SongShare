import { loginWithSpotify } from "@/app/helpers/spotifyAuth";
import { loginWithYouTube } from "@/app/helpers/youtubeAuth";

export default function LoginButtons({
  isSpotifyLoggedIn,
  isYoutubeLoggedIn,
  logoutSpotify,
  logoutYoutube,
}: {
  isSpotifyLoggedIn: boolean;
  isYoutubeLoggedIn: boolean;
  logoutSpotify: () => void;
  logoutYoutube: () => void;
}) {
  return (
    <div className="flex justify-center gap-4">
      {/* Spotify */}
      {isSpotifyLoggedIn ? (
        <button
          onClick={logoutSpotify}
          className="btn !bg-red-700 hover:!bg-red-600"
        >
          Spotify'dan Çıkış Yap
        </button>
      ) : (
        <button
          onClick={loginWithSpotify}
          className="btn !bg-green-600 hover:!bg-green-500"
        >
          Spotify'la Giriş Yap
        </button>
      )}

      {/* YouTube */}
      {isYoutubeLoggedIn ? (
        <button
          onClick={logoutYoutube}
          className="btn !bg-red-700 hover:!bg-red-600"
        >
          YouTube'dan Çıkış Yap
        </button>
      ) : (
        <button
          onClick={loginWithYouTube}
          className="btn !bg-[#FF0000] hover:!bg-[#FF3333] text-white shadow-md"
        >
          YouTube'la Giriş Yap
        </button>
      )}
    </div>
  );
}
