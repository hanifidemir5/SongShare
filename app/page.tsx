"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongTable from "@/components/SongTable";
import type { Song } from "./types";
import { supabase } from "../lib/supabaseClient"

export default function HomePage() {
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    const { data: recData, error: recError } = await supabase.from("recommended_songs").select("*");
    if (recError) console.error(recError);
    else setRecommended(recData ?? []);

    const { data: favData, error: favError } = await supabase.from("favorite_songs").select("*");
    if (favError) console.error(favError);
    else setFavorites(favData ?? []);
  }

  async function addSong(table: "recommended_songs" | "favorite_songs", song: Omit<Song, "id">) {
    const { data, error } = await supabase.from(table).insert([{ id: crypto.randomUUID(), ...song }]).select();
    if (data && data.length > 0) {
      const newSong = data[0];
      if (table === "recommended_songs")
        setRecommended([newSong, ...recommended]);
      else
        setFavorites([newSong, ...favorites]);
    } 
  }

  async function editSong(table: "recommended_songs" | "favorite_songs", id: string, song: Omit<Song, "id">) {
    const { data, error } = await supabase.from(table).update(song).eq("id", id).select();
    if (data && data.length > 0) {
      const updated = data[0];
      if (table === "recommended_songs")
        setRecommended(recommended.map(s => (s.id === id ? updated : s)));
      else
        setFavorites(favorites.map(s => (s.id === id ? updated : s)));
    }
  }

  async function deleteSong(table: "recommended_songs" | "favorite_songs", id: string) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) console.error(error);
    else {
      if (table === "recommended_songs") setRecommended(recommended.filter(s => s.id !== id));
      else setFavorites(favorites.filter(s => s.id !== id));
    }
  }

  return (
    <main className="container py-8 space-y-8">
      <Header onSearch={() => {}} />

      <SongTable
        title="🎧 Şu Sıralar Dinlediklerim"
        songs={recommended}
        onAdd={(song) => addSong("recommended_songs", song)}
        onEdit={(id, song) => editSong("recommended_songs", id, song)}
        onDelete={(id) => deleteSong("recommended_songs", id)}
      />

      <SongTable
        title="⭐ Tüm Zamanlar En Sevdiklerim"
        songs={favorites}
        onAdd={(song) => addSong("favorite_songs", song)}
        onEdit={(id, song) => editSong("favorite_songs", id, song)}
        onDelete={(id) => deleteSong("favorite_songs", id)}
      />
    </main>
  );
}
