import { error } from "console";

// youtubeApi.ts
export interface YouTubePlaylist {
  id: string;
  title: string;
}

/**
 * Fetch all playlists of the authenticated user
 */
export async function getUserPlaylists(
  token: string | null
): Promise<YouTubePlaylist[]> {
  if (!token) throw new Error("No YouTube access token provided");
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&mine=true&maxResults=50`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errorBody = await res.json();
    throw errorBody;
  }

  const data = await res.json();

  return data.items.map((pl: any) => ({
    id: pl.id,
    title: pl.snippet.title,
  }));
}
