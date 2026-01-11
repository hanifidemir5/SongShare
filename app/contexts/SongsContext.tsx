"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Song, Profile } from "../types";

interface SongsContextValue {
  recommendedSongs: Song[];
  favoriteSongs: Song[];
  recentlyPlayed: Song[];
  isLoading: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile) => void;
  profileList: Profile[];
  refetchSongs: () => void;
}

const SongsContext = createContext<SongsContextValue | undefined>(undefined);
export const useSongs = () => {
  const context = useContext(SongsContext);
  if (!context) throw new Error("useSongs must be used within SongsProvider");
  return context;
};

interface Props {
  children: ReactNode;
}

export const SongsProvider = ({ children }: Props) => {
  const [profileList, setProfileList] = React.useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = React.useState<Profile | null>(
    null
  );
  const [recentlyPlayed, setRecentlyPlayed] = React.useState<Song[]>([]);

  // Fetch all users once on mount
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("CRITICAL: Error fetching profiles from Supabase:", error);
      console.error("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL); // Debug config
      return;
    }
    setProfileList(data ?? []);
    if ((data && data.length > 0) || currentProfile == null)
      setCurrentProfile(data[0]);
  };

  React.useEffect(() => {
    fetchProfiles();
  }, []);

  // Fetch songs for currentUser using React Query
  const fetchSongs = async (): Promise<Song[]> => {
    if (!currentProfile) return [];
    const { data, error } = await supabase
      .from("Song")
      .select("*")
      .eq("addedBy", currentProfile.id);
    if (error) throw error;
    return data ?? [];
  };

  // Fetch Spotify History
  const fetchSpotifyHistory = async () => {
    if (!currentProfile?.is_spotify_connected || !currentProfile?.spotify_access_token) {
      setRecentlyPlayed([]);
      return;
    }

    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
        headers: {
          Authorization: `Bearer ${currentProfile.spotify_access_token}`
        }
      });

      if (response.status === 401) {
        console.warn("Spotify token expired or invalid.");
        // Optionally clear token here or handle refresh
        return;
      }

      const data = await response.json();
      const history = data.items.map((item: any) => ({
        id: `${item.track.id}-${item.played_at}`, // Keep ID unique for React Key
        title: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
        spotifyUrl: item.track.external_urls.spotify,
        addedBy: currentProfile.id,
        category: "history",
        // Use played_at as created_at for sorting if needed
        created_at: item.played_at
      }));

      setRecentlyPlayed(history);

    } catch (error) {
      console.error("Error fetching Spotify history:", error);
    }
  };

  // Add this inside SongsProvider, under fetchProfiles effect
  React.useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // user logged in → find matching profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) setCurrentProfile(profile);
        } else {
          // user logged out → clear profile
          fetchProfiles();
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const {
    data: songs = [],
    isLoading,
    refetch: refetchSongs,
  } = useQuery({
    queryKey: ["songs", currentProfile?.id],
    queryFn: fetchSongs,
    enabled: !!currentProfile, // only fetch if currentUser exists
  });

  // Trigger history fetch when profile changes
  React.useEffect(() => {
    fetchSpotifyHistory();
  }, [currentProfile]);

  const recommendedSongs = songs
    .filter((s) => s.category === "recommended")
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );
  const favoriteSongs = songs
    .filter((s) => s.category === "favorites")
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );

  return (
    <SongsContext.Provider
      value={{
        recommendedSongs,
        favoriteSongs,
        recentlyPlayed,
        isLoading,
        currentProfile,
        setCurrentProfile,
        profileList,
        refetchSongs,
      }}
    >
      {children}
    </SongsContext.Provider>
  );
};
