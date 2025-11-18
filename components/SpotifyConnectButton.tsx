"use client";
import { loginWithSpotify } from "@/app/services/auth/spotify/login";
import { useSpotifyAuth } from "../app/hooks/useSpotifyAuth";
import { useAuth } from "@/app/contexts/AuthContext";

export default function SpotifyConnectButton() {
  const { isLoggedIn, loading, logout, profile } = useAuth();

  if (loading) return <p>Checking Spotify...</p>;

  return (
    <div className="flex w-full">
      {isLoggedIn ? (
        <div className="flex flex-col w-full">
          <button
            className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-red-600 w-full"
            onClick={logout}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          className="hover:bg-gray-100 text-left px-3 py-2 rounded-md text-green-600 w-full"
          onClick={loginWithSpotify}
        >
          Spotify İle Bağlan
        </button>
      )}
    </div>
  );
}
