"use client";
import { getSongInfo } from "@/app/helpers/getSongInfo";
import { Song } from "@/app/types";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";
import { useSongs } from "../app/contexts/SongsContext"; // ✅ import context
import { searchSpotifyTrackByName } from "@/app/helpers/searchSpotifyTrackByName";

function AddSong() {
  const { currentUser, refetchSongs } = useSongs(); // ✅ use from context

  const [showAddForm, setShowAddForm] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [category, setCategory] = useState<"recommended" | "favorites">(
    "recommended"
  );

  async function handleAddSong() {
    if (!currentUser) {
      alert("Bir kullanıcı seçmelisin.");
      return;
    }

    if (!url.trim()) {
      alert("URL boş bırakılamaz.");
      return;
    }

    var songInfo;
    console.log(url);
    const pattern =
      /(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.com|youtube\.com|youtu\.be)\//i;
    if (!pattern.test(url.trim())) {
      songInfo = await searchSpotifyTrackByName(url);
    } else {
      songInfo = await getSongInfo(url);
    }
    console.log(songInfo);
    const newSong: Song = {
      id: uuidv4(),
      title: songInfo.title,
      artist: songInfo.artist,
      youtubeUrl: songInfo.youtubeUrl,
      spotifyUrl: songInfo.spotifyUrl,
      addedBy: currentUser.id,
      category,
    };

    const { error } = await supabase.from("Song").insert([newSong]);

    if (error) {
      console.error("Şarkı eklenirken hata oluştu:", error);
      alert("Şarkı eklenemedi!");
      return;
    }

    // ✅ Refresh songs instantly in UI
    await refetchSongs();

    setUrl("");
    setShowAddForm(false);
  }

  return (
    <div>
      {showAddForm ? (
        <div className="space-y-4">
          <input
            className="input"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <select
            className="input"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as "recommended" | "favorites")
            }
          >
            <option value="recommended">🎧 Şu sıralar dinlediklerim</option>
            <option value="favorites">⭐ Tüm zamanlar favorilerim</option>
          </select>

          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={handleAddSong}>
              Ekle
            </button>
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500"
              onClick={() => {
                setShowAddForm(false);
                if (url) setUrl("");
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-4 justify-end">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            Link ile Şarkı Ekle
          </button>
          <button className="btn" onClick={() => setShowAddForm(true)}>
            Arama ile Şarkı Ekle
          </button>
        </div>
      )}
    </div>
  );
}

export default AddSong;
