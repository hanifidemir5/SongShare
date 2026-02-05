"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Song, Profile } from "@/types";
import { getSpotifyTokens } from "@/lib/helpers/getSpotifyToken";

export interface CustomCategory {
  id: string;
  name: string;
  songs: Song[];
  songCount: number;
}

interface SongsContextValue {
  recommendedSongs: Song[];
  favoriteSongs: Song[];
  myPlaylistSongs: Song[];
  customCategories: CustomCategory[];
  recentlyPlayed: Song[];
  topTracks: Song[];
  globalTopTracks: Song[];
  groupSongs: Song[];
  isLoading: boolean;
  currentProfile: Profile | null;
  setCurrentProfile: (profile: Profile) => void;
  profileList: Profile[];
  refetchSongs: () => void;
  refreshData: () => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  joinGroup: (code: string) => Promise<void>;
  leaveGroup: () => Promise<void>;
  groupDetails: { id: string; name: string; code: string } | null;
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
  const [customCategories, setCustomCategories] = React.useState<CustomCategory[]>([]);
  const [groupDetails, setGroupDetails] = React.useState<{ id: string; name: string; code: string } | null>(null);
  const [globalCategoryIds, setGlobalCategoryIds] = React.useState<{
    recommended?: string;
    favorites?: string;
    myPlaylist?: string;
  }>({});

  // Fetch global category IDs once
  const fetchGlobalCategories = async () => {
    const { data, error } = await supabase
      .from('playlist')
      .select('id, name')
      .is('user_id', null);

    if (error || !data) return;

    const ids: any = {};
    data.forEach((cat: { id: string; name: string }) => {
      ids[cat.name] = cat.id;
    });
    setGlobalCategoryIds(ids);
  };

  // Fetch global categories on mount
  React.useEffect(() => {
    fetchGlobalCategories();
  }, []);

  // Fetch profiles - filtered by group membership
  const fetchProfiles = async () => {
    // Get current logged-in user to check their group
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Guest mode - show no profiles
      setProfileList([]);
      setCurrentProfile(null);
      return;
    }

    // Get current user's profile to check group_id
    const { data: myProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !myProfile) {
      console.error("Error fetching own profile:", profileError);
      // Even if profile fetch fails, we still need to set something to prevent infinite loading
      // Try to create a minimal profile object so the UI doesn't hang
      setProfileList([]);
      setCurrentProfile(null);
      return;
    }

    // Set current profile immediately so loading can proceed
    setCurrentProfile(myProfile);

    let query = supabase.from("profiles").select("*");

    // If user is in a group, only fetch profiles from same group
    if (myProfile.group_id) {
      query = query.eq("group_id", myProfile.group_id);
    } else {
      // If user has no group, only show their own profile
      query = query.eq("id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching profiles list:", error);
      // Still set profile list with own profile so UI works
      setProfileList([myProfile]);
      return;
    }

    setProfileList(data ?? [myProfile]);

    // Ensure current profile is the user's own profile (or first in list)
    const ownProfile = data?.find(p => p.id === user.id);
    if (ownProfile) {
      setCurrentProfile(ownProfile);
    }
  };

  React.useEffect(() => {
    fetchProfiles();
  }, []);

  // Fetch group details when profile has group_id
  const fetchGroupDetails = async () => {
    if (!currentProfile?.group_id) {
      setGroupDetails(null);
      return;
    }

    const { data, error } = await supabase
      .from('groups')
      .select('id, name, code')
      .eq('id', currentProfile.group_id)
      .single();

    if (error || !data) {
      setGroupDetails(null);
      return;
    }

    setGroupDetails(data);
  };

  React.useEffect(() => {
    fetchGroupDetails();
  }, [currentProfile?.group_id]);

  // Fetch songs for currentUser using React Query
  const fetchSongs = async (): Promise<Song[]> => {
    if (!currentProfile) return [];
    const { data, error } = await supabase
      .from("song")
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
        .from('song')
        .select('*')
        .in('addedBy', memberIds)
        .order('created_at', { ascending: false });

      if (songError) throw songError;

      setGroupSongs(songs || []);

    } catch (error) {
      console.error("Error fetching group songs:", error);
    }
  };

  // Fetch Custom Categories and their songs
  const fetchCustomCategories = async () => {
    if (!currentProfile) {
      setCustomCategories([]);
      return;
    }

    try {
      // 1. Fetch all custom categories for this user
      const { data: categories, error: catError } = await supabase
        .from('playlist')
        .select('id, name')
        .eq('user_id', currentProfile.id)
        .or('category_type.eq.custom,category_type.is.null')
        .order('created_at', { ascending: false });

      if (catError) throw catError;

      if (!categories || categories.length === 0) {
        setCustomCategories([]);
        return;
      }

      // 2. For each category, fetch its songs
      const categoriesWithSongs: CustomCategory[] = await Promise.all(
        categories.map(async (cat) => {
          const { data: songs, error: songError } = await supabase
            .from('song')
            .select('*')
            .eq('addedBy', currentProfile.id)
            .eq('playlist_id', cat.id)
            .order('created_at', { ascending: false });

          if (songError) {
            console.error(`Error fetching songs for category ${cat.name}:`, songError);
            return {
              id: cat.id,
              name: cat.name,
              songs: [],
              songCount: 0,
            };
          }

          return {
            id: cat.id,
            name: cat.name,
            songs: songs || [],
            songCount: songs?.length || 0,
          };
        })
      );

      setCustomCategories(categoriesWithSongs);

    } catch (error) {
      console.error("Error fetching custom categories:", error);
      setCustomCategories([]);
    }
  };

  // Exposed refresh function
  const refreshData = async () => {
    await Promise.all([
      fetchCustomCategories(),
      fetchGroupSongs(),
      fetchSpotifyHistory(),
      refetchSongs()
    ]);
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
    if (!currentProfile?.is_spotify_connected) {
      setRecentlyPlayed([]);
      return;
    }

    try {
      // Use helper to get a guaranteed valid token (refreshes if needed)
      const { accessToken } = await getSpotifyTokens();

      if (!accessToken) {
        console.warn("Could not get valid Spotify token for history");
        return;
      }

      const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=10", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (response.status === 401) {
        console.warn("Spotify token expired or invalid (even after refresh check).");
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

  // Trigger history, Group, and Custom Categories fetches when profile changes
  React.useEffect(() => {
    fetchSpotifyHistory();
    fetchGroupSongs();
    fetchCustomCategories();
  }, [currentProfile]);

  // Fetch global top tracks on mount (for all users including guests)
  React.useEffect(() => {
    fetchSpotifyTopTracks();
  }, []);

  const recommendedSongs = songs
    .filter((s) => s.playlist_id === globalCategoryIds.recommended)
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );
  const favoriteSongs = songs
    .filter((s) => s.playlist_id === globalCategoryIds.favorites)
    .sort(
      (a, b) =>
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
    );
  const myPlaylistSongs = songs
    .filter((s) => s.playlist_id === globalCategoryIds.myPlaylist)
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
        myPlaylistSongs,
        customCategories,
        recentlyPlayed,
        topTracks,
        globalTopTracks,
        groupSongs,
        isLoading,
        currentProfile,
        setCurrentProfile,
        profileList,
        refetchSongs,
        refreshData,
        createGroup,
        joinGroup,
        leaveGroup,
        groupDetails
      }}
    >
      {children}
    </SongsContext.Provider>
  );
};
