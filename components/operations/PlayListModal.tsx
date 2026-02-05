import React, { useEffect, useState } from "react";
import { Song } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { addToSpotifyPlaylist } from "@/lib/helpers/addToSpotifyPlaylist";
import { addToYouTubePlaylist } from "@/lib/helpers/addToYoutubePlaylist";
import { createSpotifyPlaylist } from "@/lib/helpers/createSpotifyPlaylist";
import { createYouTubePlaylist } from "@/lib/helpers/createYouTubePlaylist";
import {
  getSpotifyTokens,
  getYouTubeTokens,
} from "@/lib/helpers/getSpotifyToken";
import { getUserPlaylists as getSpotifyPlaylists } from "@/lib/helpers/spotifyApi";
import { getUserPlaylists as getYouTubePlaylists } from "@/lib/helpers/youtubeApi";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import PlatformSelector from "../PlatformSelector";

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

  if (!show || !song) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-2xl w-[500px] border border-gray-700 shadow-xl space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">
            {!selectedPlatform ? "Oynatma Listesi Seç" : `${selectedPlatform} Playlist Seç`}
          </h3>
          <button onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {!selectedPlatform ? (
          <PlatformSelector
            onSelect={(p) => {
              setSelectedPlatform(p === "spotify" ? "Spotify" : "Youtube");
              setSelectedPlaylist(null);
              setShowCreateForm(false);
            }}
            showSpotify={!!profile?.is_spotify_connected}
            showYoutube={!!profile?.is_youtube_connected}
          />
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-2">
              <button onClick={() => setSelectedPlatform(null)} className="hover:text-white underline">Platform Seçimi</button>
              <span>/</span>
              <span className="text-white font-medium">{selectedPlatform}</span>
            </div>

            {/* Playlist Seçimi Dropdown */}
            {(!showCreateForm) && (
              <>
                <select
                  value={selectedPlaylist ?? ""}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="bg-gray-800 text-white w-full rounded-xl px-4 py-3 border border-gray-700 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Oynatma Listesi Seç ({selectedPlatform === "Spotify" ? spotifyPlaylists.length : youtubePlaylists.length})</option>
                  {(selectedPlatform === "Spotify" ? spotifyPlaylists : youtubePlaylists).map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {selectedPlatform === "Spotify" ? pl.name : pl.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowCreateForm(true)}
                  className={`btn !px-3 !py-2 text-sm w-full flex items-center justify-center gap-2 rounded-xl font-medium transition-all ${selectedPlatform === "Spotify" ? "!bg-indigo-600 hover:!bg-indigo-500" : "!bg-red-600 hover:!bg-red-500"
                    }`}
                >
                  <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                  Yeni Playlist Oluştur
                </button>
              </>
            )}

            {/* Create Playlist Form */}
            {showCreateForm && (
              <div className="space-y-3 border border-gray-700 rounded-xl p-4 bg-gray-800/50">
                <label className="text-sm text-gray-300 font-medium">
                  Yeni Playlist Adı
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
                  placeholder="Örn: Favorilerim 2024"
                  className="bg-gray-700 text-white w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreatePlaylist}
                    disabled={isCreating || !newPlaylistName.trim()}
                    className="flex-1 btn !bg-green-600 hover:!bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed !px-3 !py-2 text-sm flex items-center justify-center gap-2 rounded-lg"
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
                    className="btn !bg-gray-600 hover:!bg-gray-500 !px-3 !py-2 text-sm rounded-lg"
                  >
                    İptal
                  </button>
                </div>
              </div>
            )}

            {/* Main Action Buttons */}
            {!showCreateForm && (
              <button
                className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg mt-4 ${selectedPlatform === "Spotify"
                  ? "bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-[#1DB954]/20"
                  : "bg-[#FF0000] hover:bg-[#ff3333] shadow-[#FF0000]/20"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={!selectedPlaylist}
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
                Şarkıyı Ekle
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistModal;
