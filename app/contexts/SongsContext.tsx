"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Song, Profile } from "../types";

interface SongsContextValue {
  recommendedSongs: Song[];
  favoriteSongs: Song[];
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

  // Fetch all users once on mount
  const fetchProfiles = async () => {
    const { data, error } = await supabase.from("profiles").select("*");
    if (error) {
      console.error("Error fetching users:", error);
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
