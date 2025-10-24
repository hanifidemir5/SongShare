import { Song } from "../types";

/**
 * Adds a video to a YouTube playlist
 * @param token YouTube OAuth access token
 * @param song Song object containing the URL
 * @param playlistId ID of the YouTube playlist
 */
export async function addToYouTubePlaylist(token: string | null, song: Song, playlistId: string | null) {
  if (!playlistId) return alert("Please select a playlist");
  if (!token) return alert("You must be logged in");

  // Extract YouTube video ID from URL
  // Handles URLs like:
  // https://www.youtube.com/watch?v=VIDEOID
  // https://youtu.be/VIDEOID
  const match = song.youtubeUrl?.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  const videoId = match ? match[1] : null;
  if (!videoId) return alert("Invalid YouTube URL");

  const body = {
    snippet: {
      playlistId: playlistId,
      resourceId: {
        kind: "youtube#video",
        videoId: videoId,
      },
    },
  };

  const response = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (response.ok) {
    alert(`Added "${song.title}" to YouTube playlist!`);
  } else {
    const error = await response.json();
    console.error(error);
    alert("Failed to add video to playlist");
  }
}
