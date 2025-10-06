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
  url: string;
  platform: Platform | null;
};

export type Person = "Fatma" | "Hanifi";
export type SongState = {
  recommended: Song[];
  favorites: Song[];
};
