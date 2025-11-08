"use client";

import Header from "@/components/Header";
import SongTable from "@/components/SongTable";
import AddSong from "@/components/AddSong";
import { useSongs } from "./contexts/SongsContext";

export default function HomePage() {
  const {
    recommendedSongs,
    favoriteSongs,
    userList,
    currentUser,
    setCurrentUser,
  } = useSongs();

  return (
    <main className="container py-8 space-y-8">
      {currentUser && (
        <Header
          userList={userList}
          onSearch={() => {}}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
        />
      )}
      <AddSong />
      <SongTable title="🎧 Şu Sıralar Dinlediklerim" songs={recommendedSongs} />
      <SongTable title="⭐ Tüm Zamanlar En Sevdiklerim" songs={favoriteSongs} />
    </main>
  );
}
