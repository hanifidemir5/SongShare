"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SongTable from "@/components/SongTable";
import type { Song } from "./types";
import { supabase } from "../lib/supabaseClient"
import {Person, SongState} from "./types"
import { usePerson } from "./contexts/personContext";

export default function HomePage() {
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
      .select("*").order("created_at", { ascending: false });

    const { data: favData } = await supabase
      .from(`${person}'s_favorite_songs`)
      .select("*")
      .order("created_at", { ascending: false });

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
    song: Omit<Song, "uuid">
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını dinamik oluştur
    const { data, error } = await supabase
      .from(table)
      .insert([{ ...song }])
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
    uuid: string,
    song: Omit<Song, "uuid">
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını oluştur

    const { data, error } = await supabase
      .from(table)
      .update(song)
      .eq("uuid", uuid)
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
          ].map((s) => (s.uuid === uuid ? updated : s)),
        },
      }));
    }
  }

  async function deleteSong(
    person: Person,
    category: "recommended" | "favorite",
    uuid: string
  ) {
    const table = `${person}'s_${category}_songs`; // tablo adını oluştur

    const { error } = await supabase.from(table).delete().eq("uuid", uuid);

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
        ].filter((s) => s.uuid !== uuid),
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
        onEdit={(uuid, song) => editSong(person, "recommended", uuid, song)}
        onDelete={(uuid) => deleteSong(person,"recommended", uuid)}
      />

      <SongTable
        title="⭐ Tüm Zamanlar En Sevdiklerim"
        songs={songs[person].favorites}
        onAdd={(song) => addSong(person,"favorite", song)}
        onEdit={(uuid, song) => editSong(person,"favorite", uuid, song)}
        onDelete={(uuid) => deleteSong(person,"favorite", uuid)}
      />
    </main>
  );
}
