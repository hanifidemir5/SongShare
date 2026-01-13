"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect, useState, Suspense } from "react";
import Header from "@/components/Header";
import PlaylistTabs from "@/components/layout/PlaylistTabs";
import AddSong from "@/components/operaitons/AddSong";
import { useSongs } from "./contexts/SongsContext";
import { useAuth } from "./contexts/AuthContext";

import GroupManagement from "@/components/GroupManagement";

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
  const {
    recommendedSongs,
    favoriteSongs,
    myPlaylistSongs,
    recentlyPlayed,
    topTracks,
    globalTopTracks,
    groupSongs,
    profileList,
    currentProfile,
    setCurrentProfile,
  } = useSongs();
  const { user } = useAuth();

  const [showGroupModal, setShowGroupModal] = useState(false);

  return (
    <main className="container py-8 space-y-8">
      {/* Suspense boundary required for useSearchParams during static export */}
      <Suspense fallback={null}>
        <SearchParamsHandler />
      </Suspense>

      <Header
        profileList={profileList}
        onSearch={() => { }}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        user={user}
      />

      {/* Group Management Button - only for logged in users */}
      {user && (
        <button
          onClick={() => setShowGroupModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <span>👥</span> Grup İşlemleri
        </button>
      )}

      {/* Group Modal */}
      {showGroupModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowGroupModal(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowGroupModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"
            >
              ✕
            </button>
            <GroupManagement />
          </div>
        </div>
      )}

      <AddSong />

      <PlaylistTabs
        recommendedSongs={recommendedSongs}
        favoriteSongs={favoriteSongs}
        myPlaylistSongs={myPlaylistSongs}
        recentlyPlayed={recentlyPlayed}
        topTracks={topTracks}
        globalTopTracks={globalTopTracks}
      />
    </main>
  );
}
