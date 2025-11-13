"use client";

import Header from "@/components/Header";
import SongTable from "@/components/SongTable";
import AddSong from "@/components/AddSong";
import { useSongs } from "./contexts/SongsContext";
import { getSpotifyUserProfile } from "./helpers/spotifyAuth";
import { registerOrGetUser } from "./helpers/registerOrGetUser";
import { useEffect } from "react";

export default function HomePage() {
  const {
    recommendedSongs,
    favoriteSongs,
    userList,
    currentUser,
    setCurrentUser,
  } = useSongs();

  useEffect(() => {
    async function loginFlow() {
      // 1. Read token from URL (after redirect)
      const hash = window.location.hash;
      const tokenMatch = hash.match(/access_token=([^&]*)/);

      let token = null;

      if (tokenMatch) {
        token = tokenMatch[1];
        localStorage.setItem("spotify_token", token);
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } else {
        token = localStorage.getItem("spotify_token");
      }

      if (!token) return; // user not logged in

      try {
        // 2. Fetch Spotify profile
        const profile = await getSpotifyUserProfile(token);

        // 3. Register or load from DB
        const user = await registerOrGetUser(profile);

        if (user) {
          setCurrentUser({
            id: user.id,
            name: user.name,
            source: "spotify",
          });
        }
      } catch (err) {
        console.error("Login error:", err);
        localStorage.removeItem("spotify_token");
      }
    }

    loginFlow();
  }, [setCurrentUser]);

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
