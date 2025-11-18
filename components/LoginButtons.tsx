"use client";

import { useState } from "react";
import { loginWithYouTube } from "@/app/services/auth/youtubeAuth";
import { useSpotifyAuth } from "@/app/hooks/useSpotifyAuth";
import SpotifyConnectButton from "./SpotifyConnectButton";
import { useAuth } from "@/app/contexts/AuthContext";

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
  const { loading } = useSpotifyAuth();
  const { isLoggedIn, profile } = useAuth();

  if (loading) return <p>Checking Spotify...</p>;

  return (
    <div className="relative inline-block text-left">
      {/* Main Button */}
      {isLoggedIn ? (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn w-48 text-white px-6 py-2 rounded-lg shadow-md"
        >
          {profile?.name}
        </button>
      ) : (
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="btn w-48 text-white px-6 py-2 rounded-lg shadow-md"
        >
          Giriş Yap / Kayıt Ol
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/10 divide-y divide-gray-100 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2 flex flex-col text-sm text-gray-700">
            {/* Regular login/register (you can later link these to modals or routes) */}
            {isLoggedIn ? null : (
              <div className="flex flex-col">
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md"
                  onClick={onOpenLogin}
                >
                  Giriş Yap
                </button>
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md"
                  onClick={onOpenRegister}
                >
                  Kayıt Ol
                </button>
                <div className="border-t my-1"></div>
              </div>
            )}

            {/* Divider */}

            {/* Spotify */}
            <SpotifyConnectButton />

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
                  YouTube İle Devam Et
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
