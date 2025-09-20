import { useState } from "react";

// types.ts
export type Song = {
  id: string;
  title: string;
  artist: string;
  url: string;
};

export type Person = "Fatma" | "Hanifi";
export type SongState = {
  recommended: Song[];
  favorites: Song[];
};
