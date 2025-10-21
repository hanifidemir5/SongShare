'use client'
import React, { createContext, useContext, useEffect, useState } from "react";

interface YouTubeAuthContextType {
  isLoggedInWithYouTube: boolean;
  youtubeToken: string | null;
  loginWithYouTube: (token: string) => void;
  logoutWithYouTube: () => void;
}

const YouTubeAuthContext = createContext<YouTubeAuthContextType | undefined>(undefined);

export const YouTubeAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [youtubeToken, setYoutubeToken] = useState<string | null>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("youtube_token");
    if (storedToken) {
      setYoutubeToken(storedToken);
    }
  }, []);

  // Parse token from URL hash after redirect from YouTube
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.hash) return;

    const hash = window.location.hash.substring(1); // remove #
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const state = params.get("state");

    if (accessToken && state === "youtube") {
      setYoutubeToken(accessToken);
      localStorage.setItem("youtube_token", accessToken);
      window.location.hash = ""; // clean URL to avoid parsing again
    }
  }, []);

  const loginWithYouTube = (newToken: string) => {
    setYoutubeToken(newToken);
    localStorage.setItem("youtube_token", newToken);
  };

  const logoutWithYouTube = () => {
    setYoutubeToken(null);
    localStorage.removeItem("youtube_token");
  };

  const value = {
    isLoggedInWithYouTube: !!youtubeToken,
    youtubeToken,
    loginWithYouTube,
    logoutWithYouTube,
  };

  return <YouTubeAuthContext.Provider value={value}>{children}</YouTubeAuthContext.Provider>;
};

export const useYouTubeAuth = () => {
  const context = useContext(YouTubeAuthContext);
  if (!context) {
    throw new Error("useYouTubeAuth must be used within a YouTubeAuthProvider");
  }
  return context;
};
