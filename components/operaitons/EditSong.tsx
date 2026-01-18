"use client";
import { Song } from "@/app/types";
import { supabase } from "@/lib/supabaseClient";
import React, { useEffect, useState } from "react";
import { useSongs } from "@/app/contexts/SongsContext";
import { toast } from "react-toastify";

type Props = {
  showUpdateForm: boolean;
  song: Song;
  setShowUpdateForm: React.Dispatch<React.SetStateAction<boolean>>;
};

function EditSong({ showUpdateForm, setShowUpdateForm, song }: Props) {
  const { refetchSongs } = useSongs();

  const [updateForm, setUpdateForm] = useState<Song>({
    id: song.id,
    title: song.title,
    artist: song.artist || "",
    youtubeUrl: song.youtubeUrl || "",
    spotifyUrl: song.spotifyUrl || "",
    addedBy: song.addedBy,
    Category: song.Category,
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
        Category: song.Category,
      });
    }
  }, [song]);

  async function handleSubmit() {
    if (!updateForm) return;

    try {
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
        throw error;
      }
    } catch (error) {
      toast.error("Şarkı güncellenemedi!");
      return;
    }

    await refetchSongs();
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
