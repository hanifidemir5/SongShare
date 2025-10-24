import { useState } from "react";

export enum Platform {
  YouTube = "YouTube",
  Spotify = "Spotify",
}
// types.ts
export type Song = {
  id: string;
  title: string;
  artist: string;
  youtubeUrl: string | undefined;
  spotifyUrl: string | undefined;
};

export type Person = "Fatma" | "Hanifi";
export type SongState = {
  recommended: Song[];
  favorites: Song[];
};
