"use client";
import React, { createContext, useContext, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Song, User } from "../types";

interface SongsContextValue {
  recommendedSongs: Song[];
  favoriteSongs: Song[];
  isLoading: boolean;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  userList: User[];
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
  const [userList, setUserList] = React.useState<User[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  // Fetch all users once on mount
  React.useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from("User").select("*");
      if (error) {
        console.error("Error fetching users:", error);
        return;
      }
      setUserList(data ?? []);
      // set first user as current by default
      if (data && data.length > 0) setCurrentUser(data[0]);
    };
    fetchUsers();
  }, []);

  // Fetch songs for currentUser using React Query
  const fetchSongs = async (): Promise<Song[]> => {
    if (!currentUser) return [];
    const { data, error } = await supabase
      .from("Song")
      .select("*")
      .eq("addedBy", currentUser.id);
    if (error) throw error;
    return data ?? [];
  };

  const {
    data: songs = [],
    isLoading,
    refetch: refetchSongs,
  } = useQuery({
    queryKey: ["songs", currentUser?.id],
    queryFn: fetchSongs,
    enabled: !!currentUser, // only fetch if currentUser exists
  });

  const recommendedSongs = songs.filter((s) => s.category === "recommended");
  const favoriteSongs = songs.filter((s) => s.category === "favorites");

  return (
    <SongsContext.Provider
      value={{
        recommendedSongs,
        favoriteSongs,
        isLoading,
        currentUser,
        setCurrentUser,
        userList,
        refetchSongs,
      }}
    >
      {children}
    </SongsContext.Provider>
  );
};
