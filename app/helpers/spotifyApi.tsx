export async function getUserPlaylists(token: string) {
  // 1️⃣ Fetch current user info to get their ID
  const userRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch user info");
  const userData = await userRes.json();
  const userId = userData.id;

  // 2️⃣ Fetch playlists
  const response = await fetch("https://api.spotify.com/v1/me/playlists", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch playlists");
  }

  const data = await response.json();

  // 3️⃣ Filter playlists user can modify (owner = current user)
  const modifiablePlaylists = data.items.filter(
    (pl: any) => pl.owner.id === userId
  );

  return modifiablePlaylists; // only playlists user can add/remove songs
}
