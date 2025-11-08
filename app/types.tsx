export type Song = {
  id: string | null;
  title: string;
  artist: string;
  youtubeUrl: string | undefined;
  spotifyUrl: string | undefined;
  addedBy: string | null | undefined;
  category: string;
};

export type User = {
  id: string;
  name: string;
};
