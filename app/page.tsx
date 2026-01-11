"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useEffect } from "react";
import Header from "@/components/Header";
import PlaylistTabs from "@/components/layout/PlaylistTabs";
import AddSong from "@/components/operaitons/AddSong";
import { useSongs } from "./contexts/SongsContext";
import { useAuth } from "./contexts/AuthContext";

export default function HomePage() {
  const {
    recommendedSongs,
    favoriteSongs,
    recentlyPlayed,
    profileList,
    currentProfile,
    setCurrentProfile,
  } = useSongs();
  const { user } = useAuth();

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

  return (
    <main className="container py-8 space-y-8">
      <Header
        profileList={profileList}
        onSearch={() => { }}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        user={user}
      />

      <AddSong />

      <PlaylistTabs
        recommendedSongs={recommendedSongs}
        favoriteSongs={favoriteSongs}
        recentlyPlayed={recentlyPlayed}
      />
    </main>
  );
}
