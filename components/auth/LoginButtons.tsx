"use client";

import { useState } from "react";
import SpotifyConnectButton from "./SpotifyConnectButton";
import { useAuth } from "@/app/contexts/AuthContext";
import YouTubeConnectButton from "./YoutubeConnectButton";

export default function LoginButtons({
  onOpenLogin,
  onOpenRegister,
}: {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { loading, isLoggedIn, logout, profile } = useAuth();

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
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-[rgb(79_70_229/1)] shadow-lg ring-1 ring-black/10 divide-y divide-gray-100 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="p-2 flex flex-col text-sm text-gray-700 gap-2">
            {/* Regular login/register (you can later link these to modals or routes) */}
            {isLoggedIn ? (
              <div className="flex flex-col w-full">
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-red-600 w-full"
                  onClick={logout}
                >
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <button
                  className="hover:bg-gray-100 text-left px-3 py-2 text-white hover:text-black rounded-md"
                  onClick={onOpenLogin}
                >
                  Giriş Yap
                </button>
                <button
                  className="hover:bg-gray-100 mt-2 text-left px-3 text-white hover:text-black py-2 rounded-md"
                  onClick={onOpenRegister}
                >
                  Kayıt Ol
                </button>
              </div>
            )}
            {isLoggedIn && (
              <div>
                <SpotifyConnectButton />
                <YouTubeConnectButton />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
