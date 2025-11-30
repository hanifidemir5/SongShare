"use client";
import { useAuth } from "@/app/contexts/AuthContext";
import React from "react";

interface SpotifyConnectButtonProps {
  profile?: {
    is_spotify_connected: boolean;
  };
}

const SpotifyConnectButton: React.FC<SpotifyConnectButtonProps> = ({
  profile,
}) => {
  const { loading, connectSpotify, disconnectSpotify } = useAuth();

  if (loading) return <p>Checking Spotify...</p>;

  return (
    <div className="flex w-full">
      <div className="flex flex-col w-full">
        <button
          className={
            profile?.is_spotify_connected
              ? "hover:bg-[rgb(99_102_241/1)] text-left px-3 py-2 rounded-md text-green-600"
              : "bg-green-600 hover:bg-green-400 text-left px-3 py-2 rounded-md text-gray-100"
          }
          onClick={
            profile?.is_spotify_connected ? disconnectSpotify : connectSpotify
          }
        >
          {profile?.is_spotify_connected
            ? "Spotify'dan Çıkış Yap"
            : "Spotify İle Bağlan"}
        </button>
      </div>
    </div>
  );
};

export default SpotifyConnectButton;
