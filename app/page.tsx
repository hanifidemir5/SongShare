"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import PlaylistTabs from "@/components/layout/PlaylistTabs";
import AddSong from "@/components/operations/AddSong";
import { useSongs } from "@/contexts/SongsContext";
import { useAuth } from "@/contexts/AuthContext";

// Separate component to handle search params inside Suspense
function SearchParamsHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "IdentityLinked") {
      toast.error(
        "Bu hesap zaten başka bir kullanıcıya bağlı! Lütfen farklı bir hesap deneyin.",
        { autoClose: 5000 }
      );
      router.replace("/");
    } else if (error === "IdentityLinkedToAnotherUser") {
      toast.error(
        "Bu Google hesabı başka bir kullanıcıya bağlı. Güvenlik nedeniyle işlem iptal edildi.",
        { autoClose: 5000 }
      );
      router.replace("/");
    }
  }, [searchParams, router]);

  return null;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const {
    recommendedSongs,
    favoriteSongs,
    myPlaylistSongs,
    recentlyPlayed,
    topTracks,
    globalTopTracks,
    groupSongs,
    customCategories,
    profileList,
    currentProfile,
    setCurrentProfile,
  } = useSongs();
  const { user } = useAuth();

  // Filter function for search
  const filterSongs = (songs: any[]) => {
    if (!searchQuery.trim()) return songs;
    const query = searchQuery.toLowerCase();
    return songs.filter(
      (song) =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query)
    );
  };

  return (
    <main className="container py-8 space-y-8">
      {/* Suspense boundary required for useSearchParams during static export */}
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <Header
        profileList={profileList}
        onSearch={(q) => setSearchQuery(q)}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        user={user}
      />


      <AddSong />

      <PlaylistTabs
        recommendedSongs={filterSongs(recommendedSongs)}
        favoriteSongs={filterSongs(favoriteSongs)}
        myPlaylistSongs={filterSongs(myPlaylistSongs)}
        customCategories={customCategories.map(cat => ({
          ...cat,
          songs: filterSongs(cat.songs)
        }))}
        recentlyPlayed={filterSongs(recentlyPlayed)}
        topTracks={filterSongs(topTracks)}
        globalTopTracks={filterSongs(globalTopTracks)}
      />
    </main>
  );
}
