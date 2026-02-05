export async function getUserPlaylists(token: string) {
  try {
    // 1️⃣ Fetch current user info to get their ID
    const userRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (userRes.status === 401) {
      console.warn("Spotify Token Expired or Invalid in getUserPlaylists");
      return [];
    }

    if (!userRes.ok) {
      console.warn("Failed to fetch Spotify user info:", userRes.statusText);
      return [];
    }

    const userData = await userRes.json();
    const userId = userData.id;

    // 2️⃣ Fetch playlists
    const response = await fetch("https://api.spotify.com/v1/me/playlists", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.warn("Failed to fetch playlists:", response.statusText);
      return [];
    }

    const data = await response.json();

    // 3️⃣ Filter playlists user can modify (owner = current user)
    const modifiablePlaylists = data.items.filter(
      (pl: any) => pl.owner.id === userId
    );

    return modifiablePlaylists; // only playlists user can add/remove songs
  } catch (error) {
    console.error("Spotify API Error:", error);
    return [];
  }
}
