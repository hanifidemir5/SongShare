'use client'
import React, { createContext, useContext, useEffect, useState } from "react";

interface SpotifyAuthContextType {
  isLoggedInWithSpotify: boolean;
  spotifyToken: string | null;
  logoutWithSpotify: () => void;
}

const SpotifyAuthContext = createContext<SpotifyAuthContextType | undefined>(undefined);

export const SpotifyAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("spotify_token");
    if (storedToken) {
      setSpotifyToken(storedToken);
    }
  }, []);

  // Parse token from URL hash after redirect from Spotify
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;

    const hash = window.location.hash.substring(1); // remove #
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const state = params.get("state");

    if (accessToken && state === "spotify") {
      setSpotifyToken(accessToken);
      localStorage.setItem("spotify_token", accessToken);
      window.location.hash = ""; // clean URL to avoid parsing again
    }
  }, []);

  const logoutWithSpotify = () => {
    setSpotifyToken(null);
    localStorage.removeItem("spotify_token");
  };

  const value = {
    isLoggedInWithSpotify: !!spotifyToken,
    spotifyToken,
    logoutWithSpotify,
  };

  return <SpotifyAuthContext.Provider value={value}>{children}</SpotifyAuthContext.Provider>;
};

export const useSpotifyAuth = () => {
  const context = useContext(SpotifyAuthContext);
  if (!context) {
    throw new Error("useSpotifyAuth must be used within a SpotifyAuthProvider");
  }
  return context;
};
