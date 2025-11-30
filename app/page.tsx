"use client";

import Header from "@/components/Header";
import SongTable from "@/components/layout/SongTable/SongTable";
import AddSong from "@/components/operaitons/AddSong";
import { useSongs } from "./contexts/SongsContext";

export default function HomePage() {
  const {
    recommendedSongs,
    favoriteSongs,
    profileList,
    currentProfile,
    setCurrentProfile,
  } = useSongs();

  return (
    <main className="container py-8 space-y-8">
      {currentProfile && (
        <Header
          profileList={profileList}
          onSearch={() => {}}
          currentProfile={currentProfile}
          setCurrentProfile={setCurrentProfile}
        />
      )}

      <AddSong />

      <SongTable title="🎧 Şu Sıralar Dinlediklerim" songs={recommendedSongs} />

      <SongTable title="⭐ Tüm Zamanlar En Sevdiklerim" songs={favoriteSongs} />
    </main>
  );
}
