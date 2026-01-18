import { useEffect, useState, useCallback } from "react";
import type { Song } from "../../../app/types";
import { getUserPlaylists as getSpotifyPlaylists } from "@/app/helpers/spotifyApi";
import { getUserPlaylists as getYouTubePlaylists } from "@/app/helpers/youtubeApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic } from "@fortawesome/free-solid-svg-icons";

import { useSongs } from "@/app/contexts/SongsContext";
import EditSong from "../../operaitons/EditSong";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/app/contexts/AuthContext";
import { toast } from "react-toastify";
import {
  getSpotifyTokens,
  getYouTubeTokens,
} from "@/app/helpers/getSpotifyToken";
import SongListTable from "./DesktopTableView";
import MobileTableView from "./MobileTableView";
import PlaylistModal from "../../operaitons/PlayListModal";

type Props = {
  title: string;
  songs: Song[];
};

export default function SongTable({ title, songs }: Props) {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);
  const [editSong, setEditSong] = useState<Song | null>();
  const { isLoading, refetchSongs } = useSongs();
  const { disconnectYouTube, fetchProfile, profile } = useAuth();
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentSongs = songs.slice(startIdx, startIdx + itemsPerPage);

  const [showUpdateForm, setShowUpdateForm] = useState<boolean>(false);

  // Extract fetchAllPlaylists so it can be called from modal callback
  const fetchAllPlaylists = useCallback(async () => {
    // --- 1. SPOTIFY İŞLEMLERİ ---
    if (profile?.is_spotify_connected) {
      try {
        const { accessToken, refreshToken } = await getSpotifyTokens();
        if (accessToken) {
          const playlists = await getSpotifyPlaylists(accessToken);
          setSpotifyPlaylists(playlists);
        } else {
          console.warn(
            "Spotify Access Token alınamadı. Yeniden giriş gerekebilir."
          );
          setSpotifyPlaylists([]);
        }
      } catch (error) {
        console.error("Spotify oynatma listeleri çekilirken hata:", error);
      }
    } else {
      // Bağlantı kesikse veya profil yoksa listeyi temizle
      setSpotifyPlaylists([]);
    }

    // --- 2. YOUTUBE İŞLEMLERİ ---
    if (profile?.is_youtube_connected) {
      try {
        const { accessToken } = await getYouTubeTokens();
        const playlists = await getYouTubePlaylists(accessToken);
        setYoutubePlaylists(playlists);
      } catch (err) {
        const apiError = err as any;
        const code = apiError?.error?.code;
        const message = apiError?.error?.message;

        // Handle "Channel not found" error - user hasn't created a YouTube channel yet
        // This is normal and should be treated as having zero playlists
        if (code === 404 && message?.includes("channelNotFound")) {
          console.log("[DEBUG] YouTube channel not found - treating as empty playlist list");
          setYoutubePlaylists([]); // Empty list, but still allow creating playlists
        }
        // Token refresh is handled automatically by getYouTubeTokens()
        // Only log errors for debugging, don't show user warnings for token issues
        else if (code === 401) {
          console.warn("YouTube token expired or invalid (401) - token should have been auto-refreshed");
          setYoutubePlaylists([]);
        } else {
          console.error(
            "YouTube oynatma listeleri çekilirken beklenmeyen hata:",
            err
          );
          setYoutubePlaylists([]);
        }
      }
    } else {
      setYoutubePlaylists([]);
    }
  }, [profile?.is_spotify_connected, profile?.is_youtube_connected]);

  useEffect(() => {
    fetchAllPlaylists();
  }, [
    profile?.is_spotify_connected,
    profile?.is_youtube_connected,
    profile?.id,
  ]);

  async function deleteSong(id: string) {
    const { error } = await supabase.from("Song").delete().eq("id", id);

    if (error) {
      console.error("Error deleting song:", error);
      return false;
    }

    return true;
  }

  async function handleDelete(uuid: string) {
    const success = await deleteSong(uuid);
    if (success) {
      await refetchSongs();
    }
  }

  return (
    <section className="card space-y-4">
      {isLoading ? (
        <p>Loading songs...</p>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-500">
          <h2 className="text-xl font-semibold mb-2 self-start w-full text-left">
            {title}
          </h2>
          <div className="flex flex-col items-center justify-center gap-3">
            <FontAwesomeIcon icon={faMusic} className="text-4xl opacity-50" />
            <p className="text-sm">Henüz şarkı eklenmemiş</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Desktop */}
          <h2 className="text-xl font-semibold">{title}</h2>

          <SongListTable
            currentSongs={currentSongs}
            allSongs={songs}
            setSongToAdd={setSongToAdd}
            setShowPlaylistModal={setShowPlaylistModal}
            setShowUpdateForm={setShowUpdateForm}
            setEditSong={setEditSong}
            handleDelete={handleDelete}
            spotifyPlaylists={spotifyPlaylists}
            youtubePlaylists={youtubePlaylists}
          />
          <MobileTableView
            currentSongs={currentSongs}
            allSongs={songs}
            setSongToAdd={setSongToAdd}
            setShowPlaylistModal={setShowPlaylistModal}
            setShowUpdateForm={setShowUpdateForm}
            setEditSong={setEditSong}
            handleDelete={handleDelete}
            spotifyPlaylists={spotifyPlaylists}
            youtubePlaylists={youtubePlaylists}
          />
        </div>
      )}

      <div className="flex flex-col justify-center gap-2 mt-4">
        <div>
          {showUpdateForm && editSong && (
            <EditSong
              showUpdateForm={showUpdateForm}
              setShowUpdateForm={setShowUpdateForm}
              song={editSong || null}
            />
          )}
        </div>
        <div className="flex justify-center">
          <button
            className="btn !px-2 !py-1 text-xs"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          >
            Önceki
          </button>
          <span className="px-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button
            className="btn !px-2 !py-1 text-xs"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          >
            Sonraki
          </button>
        </div>
      </div>

      <PlaylistModal
        show={showPlaylistModal}
        song={songToAdd}
        spotifyPlaylists={spotifyPlaylists}
        youtubePlaylists={youtubePlaylists}
        onPlaylistCreated={fetchAllPlaylists}
        onClose={() => {
          setShowPlaylistModal(false);
          setSongToAdd(null);
        }}
      />

      {/* {showPlaylistModal && songToAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded space-y-4 w-80">
            <h3 className="text-lg font-semibold">Select Playlist</h3>
            <select
              value={selectedPlatformInModal ?? ""}
              onChange={(e) => setSelectedPlatformInModal(e.target.value)}
              className="bg-gray-800 text-white w-full rounded px-2 py-1"
            >
              <option value="">Select a platform</option>
              {profile?.is_youtube_connected && (
                <option key={"youtube"} value={"Youtube"}>
                  Youtube
                </option>
              )}
              {profile?.is_youtube_connected && (
                <option key={"spotify"} value={"Spotify"}>
                  Spotify
                </option>
              )}
            </select>

            {selectedPlatformInModal == "Spotify" && (
              <select
                value={selectedPlaylistInModal ?? ""}
                onChange={(e) => setSelectedPlaylistInModal(e.target.value)}
                className="bg-gray-800 text-white w-full rounded px-2 py-1"
              >
                <option value="">Select a playlist</option>
                {spotifyPlaylists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.name}
                  </option>
                ))}
              </select>
            )}

            {selectedPlatformInModal == "Youtube" && (
              <select
                value={selectedPlaylistInModal ?? ""}
                onChange={(e) => setSelectedPlaylistInModal(e.target.value)}
                className="bg-gray-800 text-white w-full rounded px-2 py-1"
              >
                <option value="">Select a playlist</option>
                {youtubePlaylists.map((pl) => (
                  <option key={pl.id} value={pl.id}>
                    {pl.title}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end gap-2">
              {selectedPlatformInModal == "Spotify" && (
                <button
                  className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    addToSpotifyPlaylist(
                      profile?.spotify_token,
                      songToAdd,
                      selectedPlaylistInModal
                    );
                    setShowPlaylistModal(false);
                    setSongToAdd(null);
                    setSelectedPlaylistInModal(null);
                  }}
                >
                  Ekle
                </button>
              )}
              {selectedPlatformInModal == "Youtube" && (
                <button
                  className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    addToYouTubePlaylist(
                      profile?.youtube_token,
                      songToAdd,
                      selectedPlaylistInModal
                    );
                    setShowPlaylistModal(false);
                    setSongToAdd(null);
                    setSelectedPlaylistInModal(null);
                  }}
                >
                  Ekle
                </button>
              )}
              <button
                className="btn !bg-gray-600 hover:!bg-gray-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setShowPlaylistModal(false);
                  setSongToAdd(null);
                  setSelectedPlaylistInModal(null);
                  setSelectedPlatformInModal(null);
                }}
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )} */}
    </section>
  );
}
