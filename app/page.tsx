"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongTable from "@/components/SongTable";
import type { Song } from "./types";
import { supabase } from "../lib/supabaseClient"
import {Person, SongState} from "./types"
import { usePerson } from "./personContext";


export default function HomePage() {
  const [fatmas_recommended, setFatmasRecommended] = useState<Song[]>([]);
  const [fatmas_favorites, setFatmasFavorites] = useState<Song[]>([]);
  const [hanifis_recommended, setHanifisRecommended] = useState<Song[]>([]);
  const [hanifis_favorites, setHanifisFavorites] = useState<Song[]>([]);

  const { person } = usePerson();

  const [songs, setSongs] = useState<Record<Person, SongState>>({
    Fatma: { recommended: [], favorites: [] },
    Hanifi: { recommended: [], favorites: [] },
  });

  useEffect(() => {
    fetchSongs(person);
  }, [person]);

  async function fetchSongs(person: Person) {
    const { data: recData } = await supabase
      .from(`${person}'s_recommended_songs`)
      .select("*");

    const { data: favData } = await supabase
      .from(`${person}'s_favorite_songs`)
      .select("*");

    setSongs((prev) => ({
      ...prev,
      [person]: {
        recommended: recData ?? [],
        favorites: favData ?? [],
      },
    
    }));
  }

  async function addSong(
    person: Person,
    category: "recommended" | "favorite",
    song: Omit<Song, "id">
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını dinamik oluştur

    const { data, error } = await supabase
      .from(table)
      .insert([{ id: crypto.randomUUID(), ...song }])
      .select();

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      const newSong = data[0];

      setSongs((prev) => ({
        ...prev,
        [person]: {
          ...prev[person],
          [category === "recommended" ? "recommended" : "favorites"]: [
            newSong,
            ...prev[person][category === "recommended" ? "recommended" : "favorites"],
          ],
        },
      }));
    }
  }


  async function editSong(
    person: Person,
    category: "recommended" | "favorite",
    id: string,
    song: Omit<Song, "id">
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını oluştur

    const { data, error } = await supabase
      .from(table)
      .update(song)
      .eq("id", id)
      .select();

    if (error) {
      console.error(error);
      return;
    }

    if (data && data.length > 0) {
      const updated = data[0];

      setSongs((prev) => ({
        ...prev,
        [person]: {
          ...prev[person],
          [category === "recommended" ? "recommended" : "favorites"]: prev[person][
            category === "recommended" ? "recommended" : "favorites"
          ].map((s) => (s.id === id ? updated : s)),
        },
      }));
    }
  }


  async function deleteSong(
    person: Person,
    category: "recommended" | "favorite",
    id: string
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını oluştur

    const { error } = await supabase.from(table).delete().eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setSongs((prev) => ({
      ...prev,
      [person]: {
        ...prev[person],
        [category === "recommended" ? "recommended" : "favorites"]: prev[person][
          category === "recommended" ? "recommended" : "favorites"
        ].filter((s) => s.id !== id),
      },
    }));
  }

  return (
    <main className="container py-8 space-y-8">
      <Header onSearch={() => {}} />

      <SongTable
        title="🎧 Şu Sıralar Dinlediklerim"
        songs={songs[person].recommended}   // ✅ aktif kişinin recommended listesi
        onAdd={(song) => addSong(person,"recommended", song)}
        onEdit={(id, song) => editSong(person, "recommended", id, song)}
        onDelete={(id) => deleteSong(person,"recommended", id)}
      />

      <SongTable
        title="⭐ Tüm Zamanlar En Sevdiklerim"
        songs={songs[person].favorites}
        onAdd={(song) => addSong(person,"favorite", song)}
        onEdit={(id, song) => editSong(person,"favorite", id, song)}
        onDelete={(id) => deleteSong(person,"favorite", id)}
      />
    </main>
  );
}
