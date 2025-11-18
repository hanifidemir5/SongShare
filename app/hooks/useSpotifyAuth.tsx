"use client";

import { useEffect, useState, useCallback } from "react";
import {
  redirectToSpotifyAuth,
  getStoredAccessToken,
  validateStoredToken,
  fetchSpotifyProfile,
  logoutSpotify,
} from "@/lib/spotify";

interface SpotifyProfile {
  id: string;
  display_name?: string;
  email?: string;
}

export function useSpotifyAuth() {
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExistingSession = useCallback(async () => {
    setLoading(true);
    const token = getStoredAccessToken();
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const valid = await validateStoredToken();
      if (!valid) {
        setProfile(null);
      } else {
        const userProfile = await fetchSpotifyProfile(token);
        setProfile(userProfile);
      }
    } catch (err: any) {
      setProfile(null);
      setError(err.message || "Spotify validation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExistingSession();
  }, [loadExistingSession]);

  /**
   * Start Spotify login redirect
   */
  function connect() {
    redirectToSpotifyAuth();
  }

  /**
   * Clear token and state
   */
  function disconnect() {
    logoutSpotify();
    setProfile(null);
  }

  return {
    profile,
    loading,
    error,
    connect,
    disconnect,
    isConnected: Boolean(profile),
    refresh: loadExistingSession,
  };
}
