export type Song = {
  id: string | null;
  title: string;
  artist: string;
  youtubeUrl: string | undefined;
  spotifyUrl: string | undefined;
  addedBy: string | null | undefined;
  category: string;
  readonly created_at?: string;
};

export type Profile = {
  id: string | null;
  name: string | null;
  email?: string | null;
  source: string | null;
};
