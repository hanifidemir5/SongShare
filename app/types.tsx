export type Song = {
  id: string | null;
  title: string;
  artist: string;
  youtubeUrl: string | undefined;
  spotifyUrl: string | undefined;
  addedBy: string | null | undefined;
  Category: string | null;  // UUID foreign key to Category.id
  readonly created_at?: string;
};

export type Group = {
  id: string;
  name: string;
  code: string;
  created_by: string;
};

export type Profile = {
  id: string | null;
  name: string | null;
  email?: string | null;
  source: string | null;
  is_spotify_connected?: boolean;
  is_youtube_connected?: boolean;
  spotify_access_token?: string | null;
  group_id?: string | null;
  group_role?: 'admin' | 'member' | null;
};
