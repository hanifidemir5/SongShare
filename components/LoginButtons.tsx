"use client";

import { useState } from "react";
import { loginWithSpotify } from "@/app/helpers/spotifyAuth";
import { loginWithYouTube } from "@/app/helpers/youtubeAuth";

export default function LoginButtons({
  isSpotifyLoggedIn,
  isYoutubeLoggedIn,
  logoutSpotify,
  logoutYoutube,
  onOpenLogin,
  onOpenRegister,
}: {
  isSpotifyLoggedIn: boolean;
  isYoutubeLoggedIn: boolean;
  logoutSpotify: () => void;
  logoutYoutube: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block text-left">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn w-48 text-white px-6 py-2 rounded-lg shadow-md"
      >
        Giriş Yap / Kayıt Ol
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/10 divide-y divide-gray-100 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2 flex flex-col text-sm text-gray-700">
            {/* Regular login/register (you can later link these to modals or routes) */}
            <button
              className="hover:bg-gray-100 text-left px-3 py-2 rounded-md"
              onClick={onOpenLogin}
            >
              Login
            </button>
            <button
              className="hover:bg-gray-100 text-left px-3 py-2 rounded-md"
              onClick={onOpenRegister}
            >
              Register
            </button>

            {/* Divider */}
            <div className="border-t my-1"></div>

            {/* Spotify */}
            {isSpotifyLoggedIn ? (
              <button
                className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-red-600"
                onClick={logoutSpotify}
              >
                Logout from Spotify
              </button>
            ) : (
              <>
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-green-600"
                  onClick={loginWithSpotify}
                >
                  Login with Spotify
                </button>
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-green-600"
                  onClick={() => alert("Register with Spotify clicked")}
                >
                  Register with Spotify
                </button>
              </>
            )}

            {/* YouTube */}
            {isYoutubeLoggedIn ? (
              <button
                className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-red-600"
                onClick={logoutYoutube}
              >
                Logout from YouTube
              </button>
            ) : (
              <>
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-[#FF0000]"
                  onClick={loginWithYouTube}
                >
                  Login with YouTube
                </button>
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-[#FF0000]"
                  onClick={() => alert("Register with YouTube clicked")}
                >
                  Register with YouTube
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
