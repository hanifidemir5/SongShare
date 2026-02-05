import { useEffect, useState, useCallback } from "react";
import type { Song } from "@/types";
import { getUserPlaylists as getSpotifyPlaylists } from "@/lib/helpers/spotifyApi";
import { getUserPlaylists as getYouTubePlaylists } from "@/lib/helpers/youtubeApi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMusic, faSpinner } from "@fortawesome/free-solid-svg-icons";

import { useSongs } from "@/contexts/SongsContext";
import EditSong from "@/components/operations/EditSong";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-toastify";
import {
  getSpotifyTokens,
  getYouTubeTokens,
} from "@/lib/helpers/getSpotifyToken";
import SongListTable from "./DesktopTableView";
import MobileTableView from "./MobileTableView";
import PlaylistModal from "@/components/operations/PlayListModal";
import AddToPortalPlaylistModal from "@/components/operations/AddToPortalPlaylistModal";

type Props = {
  title: string;
  songs: Song[];
  isSystemPlaylist?: boolean;
};

export default function SongTable({ title, songs, isSystemPlaylist = false }: Props) {
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showPortalModal, setShowPortalModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);
  const [editSong, setEditSong] = useState<Song | null>();
  const { isLoading, refetchSongs, refreshData } = useSongs();
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
          toast.warning("Spotify oturumu sona erdi. Lütfen tekrar giriş yapın.");
          setSpotifyPlaylists([]);
        }
      } catch (error) {
        console.error("Spotify oynatma listeleri çekilirken hata:", error);
        toast.error("Spotify listeleri yüklenemedi.");
      }
    } else {
      // Bağlantı kesikse veya profil yoksa listeyi temizle
      setSpotifyPlaylists([]);
    }

    // --- 2. YOUTUBE İŞLEMLERİ ---
    if (profile?.is_youtube_connected) {
      try {
        const { accessToken } = await getYouTubeTokens();
        if (accessToken) {
          const playlists = await getYouTubePlaylists(accessToken);
          setYoutubePlaylists(playlists);
        } else {
          // Token missing or expired (invalid_grant)
          // Silent fail or optional toast, but set empty to stop loading state
          setYoutubePlaylists([]);
        }
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

  // Removed useEffect to prevent auto-fetching on every table load.
  // Playlists will be fetched only when the modal is opened or a playlist is created.

  async function deleteSong(id: string) {
    const { error } = await supabase.from("song").delete().eq("id", id);

    if (error) {
      console.error("Error deleting song:", error);
      return false;
    }

    return true;
  }

  async function handleDelete(uuid: string) {
    const success = await deleteSong(uuid);
    if (success) {
      await refreshData();
    }
  }

  return (
    <section className="card space-y-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
          <h2 className="text-xl font-semibold mb-4 self-start w-full text-left text-white">
            {title}
          </h2>
          <div className="flex flex-col items-center justify-center gap-3">
            <FontAwesomeIcon icon={faSpinner} className="text-3xl text-indigo-400 animate-spin" />
            <p className="text-sm">Şarkılar yükleniyor...</p>
          </div>
        </div>
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
            setShowPortalModal={setShowPortalModal}
            setShowUpdateForm={setShowUpdateForm}
            setEditSong={setEditSong}
            handleDelete={handleDelete}
            spotifyPlaylists={spotifyPlaylists}
            youtubePlaylists={youtubePlaylists}
            fetchPlaylists={fetchAllPlaylists}
            isSystemPlaylist={isSystemPlaylist}
          />
          <MobileTableView
            currentSongs={currentSongs}
            allSongs={songs}
            setSongToAdd={setSongToAdd}
            setShowPlaylistModal={setShowPlaylistModal}
            setShowPortalModal={setShowPortalModal}
            setShowUpdateForm={setShowUpdateForm}
            setEditSong={setEditSong}
            handleDelete={handleDelete}
            spotifyPlaylists={spotifyPlaylists}
            youtubePlaylists={youtubePlaylists}
            fetchPlaylists={fetchAllPlaylists}
            isSystemPlaylist={isSystemPlaylist}
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
        onClose={() => setShowPlaylistModal(false)}
        onPlaylistCreated={fetchAllPlaylists}
      />

      <AddToPortalPlaylistModal
        isOpen={showPortalModal}
        onClose={() => setShowPortalModal(false)}
        song={songToAdd}
      />
    </section>
  );
}
