"use client";
import { Song } from "@/app/types";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { useSongs } from "../app/contexts/SongsContext";

type Props = {
  showUpdateForm: boolean;
  song: Song;
  setShowUpdateForm: React.Dispatch<React.SetStateAction<boolean>>;
};

function EditSong({ showUpdateForm, setShowUpdateForm, song }: Props) {
  const { refetchSongs } = useSongs(); // ✅ refetch after update

  const [updateForm, setUpdateForm] = useState<Song>({
    id: song.id,
    title: song.title,
    artist: song.artist || "",
    youtubeUrl: song.youtubeUrl || "",
    spotifyUrl: song.spotifyUrl || "",
    addedBy: song.addedBy,
    category: song.category,
  });

  // Keep local state in sync if song prop changes
  useEffect(() => {
    if (song) {
      setUpdateForm({
        id: song.id,
        title: song.title,
        artist: song.artist || "",
        youtubeUrl: song.youtubeUrl || "",
        spotifyUrl: song.spotifyUrl || "",
        addedBy: song.addedBy,
        category: song.category,
      });
    }
  }, [song]);

  // 🔄 Update song in Supabase
  async function handleSubmit() {
    if (!updateForm) return;

    const { error } = await supabase
      .from("Song")
      .update({
        title: updateForm.title,
        artist: updateForm.artist,
        youtubeUrl: updateForm.youtubeUrl,
        spotifyUrl: updateForm.spotifyUrl,
      })
      .eq("id", updateForm.id);

    if (error) {
      console.error("Şarkı güncellenemedi:", error);
      alert("Şarkı güncellenemedi!");
      return;
    }

    await refetchSongs(); // ✅ Refresh UI with latest data
    setShowUpdateForm(false);
  }

  const handleCancel = () => {
    setShowUpdateForm(false);
  };

  return (
    <>
      {showUpdateForm && (
        <div className="space-y-2">
          <input
            className="input"
            placeholder="Şarkı"
            value={updateForm.title}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, title: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Sanatçı"
            value={updateForm.artist}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, artist: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Youtube Url"
            value={updateForm.youtubeUrl}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, youtubeUrl: e.target.value })
            }
          />
          <input
            className="input"
            placeholder="Spotify Url"
            value={updateForm.spotifyUrl}
            onChange={(e) =>
              setUpdateForm({ ...updateForm, spotifyUrl: e.target.value })
            }
          />
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={handleSubmit}>
              Güncelle
            </button>
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500"
              onClick={handleCancel}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default EditSong;
