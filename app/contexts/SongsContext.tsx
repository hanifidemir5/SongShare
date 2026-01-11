"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Song, Profile } from "../types";

interface SongsContextValue {
  recommendedSongs: Song[];
  favoriteSongs: Song[];
  recentlyPlayed: Song[];
  topTracks: Song[];
  globalTopTracks: Song[];
  groupSongs: Song[];
  isLoading: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile) => void;
  profileList: Profile[];
  refetchSongs: () => void;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
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
  const [topTracks, setTopTracks] = React.useState<Song[]>([]);
  const [globalTopTracks, setGlobalTopTracks] = React.useState<Song[]>([]);
  const [groupSongs, setGroupSongs] = React.useState<Song[]>([]);

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

  // Fetch Group Songs
  const fetchGroupSongs = async () => {
    if (!currentProfile?.group_id) {
      setGroupSongs([]);
      return;
    }

    try {
      // 1. Get all member IDs of the group
      const { data: members, error: memberError } = await supabase
        .from('profiles')
        .select('id')
        .eq('group_id', currentProfile.group_id);

      if (memberError) throw memberError;

      const memberIds = members.map(m => m.id);

      // 2. Fetch songs added by these members
      const { data: songs, error: songError } = await supabase
        .from('Song')
        .select('*')
        .in('addedBy', memberIds)
        .order('created_at', { ascending: false });

      if (songError) throw songError;

      setGroupSongs(songs || []);

    } catch (error) {
      console.error("Error fetching group songs:", error);
    }
  };

  // Group Actions
  const createGroup = async (name: string) => {
    if (!currentProfile) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: group, error } = await supabase
      .from('groups')
      .insert({ name, code, created_by: currentProfile.id })
      .select()
      .single();

    if (error) {
      console.error("Error creating group:", error);
      alert("Grup oluşturulurken hata oluştu!");
      return;
    }

    await joinGroup(code); // Update profile to join the new group
  };

  const joinGroup = async (codeOrId: string) => {
    if (!currentProfile) return;

    // Detect if input is a UUID or a 6-char code
    const isUUID = codeOrId.length > 10 && codeOrId.includes('-');

    // 1. Find group
    let query = supabase.from('groups').select('id');
    if (isUUID) {
      query = query.eq('id', codeOrId);
    } else {
      query = query.eq('code', codeOrId.toUpperCase());
    }

    const { data: group, error: findError } = await query.single();

    if (findError || !group) {
      console.error("Group find error:", findError);
      alert("Grup bulunamadı! Kod veya ID hatalı olabilir.");
      return;
    }

    // 2. Update Profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        group_id: group.id,
        group_role: 'member' // Default role
      })
      .eq('id', currentProfile.id);

    if (updateError) {
      console.error("Error joining group:", updateError);
      return;
    }

    // Refresh
    await fetchProfiles();
    // Wait a bit for profile update then fetch songs
    setTimeout(fetchGroupSongs, 500);
  };

  const leaveGroup = async () => {
    if (!currentProfile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ group_id: null, group_role: null })
      .eq('id', currentProfile.id);

    if (error) {
      console.error("Error leaving group:", error);
      return;
    }

    await fetchProfiles();
    setGroupSongs([]);
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

  // Fetch Global Spotify Top Tracks (works for all users including guests)
  const fetchSpotifyTopTracks = async () => {
    try {
      const response = await fetch("/api/spotify/top-tracks");

      if (!response.ok) {
        console.warn("Failed to fetch top tracks");
        return;
      }

      const data = await response.json();

      // Turkey Top 20
      const turkeyTracks = (data.turkeyTracks || []).map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        spotifyUrl: track.spotifyUrl,
        addedBy: "spotify-turkey",
        category: "topTracks",
        created_at: new Date().toISOString()
      }));
      setTopTracks(turkeyTracks);

      // Global Top 20
      const globalTracks = (data.globalTracks || []).map((track: any) => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        spotifyUrl: track.spotifyUrl,
        addedBy: "spotify-global",
        category: "globalTopTracks",
        created_at: new Date().toISOString()
      }));
      setGlobalTopTracks(globalTracks);

    } catch (error) {
      console.error("Error fetching top tracks:", error);
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

  // Trigger history and Group fetches when profile changes
  React.useEffect(() => {
    fetchSpotifyHistory();
    fetchGroupSongs();
  }, [currentProfile]);

  // Fetch global top tracks on mount (for all users including guests)
  React.useEffect(() => {
    fetchSpotifyTopTracks();
  }, []);

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
        topTracks,
        globalTopTracks,
        groupSongs,
        isLoading,
        currentProfile,
        setCurrentProfile,
        profileList,
        refetchSongs,
        createGroup,
        joinGroup,
        leaveGroup
      }}
    >
      {children}
    </SongsContext.Provider>
  );
};
