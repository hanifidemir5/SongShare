import React, { useEffect, useState } from "react";
import { Song } from "@/app/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { addToSpotifyPlaylist } from "@/app/helpers/addToSpotifyPlaylist";
import { addToYouTubePlaylist } from "@/app/helpers/addToYoutubePlaylist";
import { createSpotifyPlaylist } from "@/app/helpers/createSpotifyPlaylist";
import { createYouTubePlaylist } from "@/app/helpers/createYouTubePlaylist";
import {
  getSpotifyTokens,
  getYouTubeTokens,
} from "@/app/helpers/getSpotifyToken";
import { getUserPlaylists as getSpotifyPlaylists } from "@/app/helpers/spotifyApi";
import { getUserPlaylists as getYouTubePlaylists } from "@/app/helpers/youtubeApi";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface Playlist {
  id: string;
  name?: string;
  title?: string;
}

interface PlaylistModalProps {
  show: boolean;
  song: Song | null;
  spotifyPlaylists: Playlist[];
  youtubePlaylists: Playlist[];
  onClose: () => void;
  onPlaylistCreated?: () => void; // Callback to refresh parent's playlist data
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
  show,
  song,
  spotifyPlaylists: initialSpotifyPlaylists,
  youtubePlaylists: initialYoutubePlaylists,
  onClose,
  onPlaylistCreated,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState(initialSpotifyPlaylists);
  const [youtubePlaylists, setYoutubePlaylists] = useState(initialYoutubePlaylists);
  const { profile } = useAuth();

  // Update local state when props change
  useEffect(() => {
    setSpotifyPlaylists(initialSpotifyPlaylists);
  }, [initialSpotifyPlaylists]);

  useEffect(() => {
    setYoutubePlaylists(initialYoutubePlaylists);
  }, [initialYoutubePlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Lütfen bir playlist adı girin");
      return;
    }

    setIsCreating(true);
    try {
      if (selectedPlatform === "Spotify") {
        const { accessToken } = await getSpotifyTokens();
        if (!accessToken) {
          toast.error("Spotify token bulunamadı");
          return;
        }

        const result = await createSpotifyPlaylist(accessToken, newPlaylistName.trim());
        if (result) {
          toast.success(`✅ "${result.name}" oluşturuldu!`);

          // Refresh Spotify playlists
          const updatedPlaylists = await getSpotifyPlaylists(accessToken);
          setSpotifyPlaylists(updatedPlaylists);

          // Notify parent to refresh its playlist data
          onPlaylistCreated?.();

          // Auto-select the newly created playlist
          setSelectedPlaylist(result.id);
          setShowCreateForm(false);
          setNewPlaylistName("");
        } else {
          toast.error("Playlist oluşturulamadı");
        }
      } else if (selectedPlatform === "Youtube") {
        const { accessToken } = await getYouTubeTokens();
        if (!accessToken) {
          toast.error("YouTube token bulunamadı");
          return;
        }

        const result = await createYouTubePlaylist(accessToken, newPlaylistName.trim());
        if (result) {
          toast.success(`✅ "${result.title}" oluşturuldu!`);

          // Refresh YouTube playlists
          const updatedPlaylists = await getYouTubePlaylists(accessToken);
          setYoutubePlaylists(updatedPlaylists);

          // Notify parent to refresh its playlist data
          onPlaylistCreated?.();

          // Auto-select the newly created playlist
          setSelectedPlaylist(result.id);
          setShowCreateForm(false);
          setNewPlaylistName("");
        } else {
          toast.error("Playlist oluşturulamadı");
        }
      }
    } catch (error: any) {
      console.error("Error creating playlist:", error);

      // Check for YouTube channel requirement error
      const errorMessage = error?.error?.message || "";
      const errorReason = error?.error?.errors?.[0]?.reason || "";

      if (errorReason === "youtubeSignupRequired" || errorMessage.includes("youtubeSignupRequired")) {
        // Show helpful message with clickable link
        toast.error(
          <div>
            <p><strong>YouTube Kanalı Gerekli!</strong></p>
            <p>Playlist oluşturmak için bir YouTube kanalına sahip olmalısınız.</p>
            <a
              href="https://www.youtube.com/create_channel"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#60a5fa", textDecoration: "underline" }}
            >
              → Kanal Oluştur
            </a>
          </div>,
          {
            autoClose: 10000,
            position: "top-center",
          }
        );
      } else {
        toast.error("Bir hata oluştu");
      }
    } finally {
      setIsCreating(false);
    }
  };

  if (!show || !song) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded space-y-4 w-80">
        {/* Başlık */}
        <h3 className="text-lg font-semibold">Oynatma Listesi Seç</h3>

        {/* Platform Seçimi */}
        <select
          value={selectedPlatform ?? ""}
          onChange={(e) => {
            setSelectedPlatform(e.target.value);
            setSelectedPlaylist(null);
            setShowCreateForm(false);
          }}
          className="bg-gray-800 text-white w-full rounded px-2 py-1"
        >
          <option value="">Platform Seç</option>

          {profile?.is_youtube_connected && (
            <option value="Youtube">Youtube</option>
          )}

          {profile?.is_spotify_connected && (
            <option value="Spotify">Spotify</option>
          )}
        </select>

        {/* Spotify Playlist Seçimi */}
        {selectedPlatform === "Spotify" && !showCreateForm && (
          <>
            <select
              value={selectedPlaylist ?? ""}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="bg-gray-800 text-white w-full rounded px-2 py-1"
            >
              <option value="">Oynatma Listesi Seç</option>
              {spotifyPlaylists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateForm(true)}
              className="btn !bg-indigo-600 hover:!bg-indigo-500 !px-3 !py-2 text-sm w-full flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yeni Playlist Oluştur
            </button>
          </>
        )}

        {/* YouTube Playlist Seçimi */}
        {selectedPlatform === "Youtube" && !showCreateForm && (
          <>
            <select
              value={selectedPlaylist ?? ""}
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              className="bg-gray-800 text-white w-full rounded px-2 py-1"
            >
              <option value="">Oynatma Listesi Seç</option>
              {youtubePlaylists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.title}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowCreateForm(true)}
              className="btn !bg-red-600 hover:!bg-red-500 !px-3 !py-2 text-sm w-full flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
              Yeni Playlist Oluştur
            </button>
          </>
        )}

        {/* Create Playlist Form */}
        {showCreateForm && selectedPlatform && (
          <div className="space-y-3 border border-gray-700 rounded p-3 bg-gray-800/50">
            <label className="text-sm text-gray-300 font-medium">
              Playlist Adı
            </label>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreatePlaylist();
                }
              }}
              placeholder="Playlist adını girin..."
              className="bg-gray-700 text-white w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlaylist}
                disabled={isCreating || !newPlaylistName.trim()}
                className="flex-1 btn !bg-green-600 hover:!bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed !px-3 !py-2 text-sm flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                    Oluştur
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName("");
                }}
                className="btn !bg-gray-600 hover:!bg-gray-500 !px-3 !py-2 text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex justify-end gap-2">
          <button
            className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-green-600"
            disabled={!selectedPlaylist || showCreateForm}
            onClick={async () => {
              if (selectedPlatform === "Spotify") {
                const { accessToken } = await getSpotifyTokens();
                if (accessToken && song && selectedPlaylist) {
                  addToSpotifyPlaylist(accessToken, song, selectedPlaylist);
                } else {
                  console.error("Spotify token missing");
                }
              } else if (selectedPlatform === "Youtube") {
                const { accessToken } = await getYouTubeTokens();
                const spotifyTokens = await getSpotifyTokens();
                if (accessToken && song && selectedPlaylist) {
                  addToYouTubePlaylist(accessToken, song, selectedPlaylist, spotifyTokens.accessToken);
                } else {
                  console.error("YouTube token missing");
                  toast.error("YouTube oturumu açık değil veya token alınamadı.");
                }
              }
              onClose();
            }}
          >
            Ekle
          </button>

          <button
            className="btn !bg-gray-600 hover:!bg-gray-500 !px-2 !py-1 text-xs"
            onClick={onClose}
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaylistModal;
