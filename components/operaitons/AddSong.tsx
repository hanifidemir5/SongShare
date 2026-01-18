"use client";
import { getSongInfo } from "@/app/helpers/getSongInfo";
import { Song } from "@/app/types";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
import { useSongs } from "../../app/contexts/SongsContext";
import { searchSpotifyTrackByName } from "@/app/helpers/searchSpotifyTrackByName";
import { useAuth } from "@/app/contexts/AuthContext";
import ImportPlaylistModal from "./ImportPlaylistModal";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { createSpotifyPlaylist } from "@/app/helpers/createSpotifyPlaylist";
import { createYouTubePlaylist } from "@/app/helpers/createYouTubePlaylist";
import { getSpotifyTokens, getYouTubeTokens } from "@/app/helpers/getSpotifyToken";

interface Category {
  id: string;
  name: string;
  user_id: string | null;
}

function AddSong() {
  const { currentProfile, refetchSongs } = useSongs();
  const { isLoggedIn, user } = useAuth();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [url, setUrl] = useState<string>("");
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);

  // State for Search Results (List of 10)
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  // State for Final Preview (Single Song to Add)
  const [previewData, setPreviewData] = useState<{
    title: string;
    artist: string;
    duration: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
  } | null>(null);

  // Fetch available categories (global + user's custom)
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) {
        setAvailableCategories([]);
        return;
      }

      const { data, error } = await supabase
        .from('Category')
        .select('id, name, user_id')
        .or(`user_id.is.null,user_id.eq.${user.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        // Silently handle error
        return;
      }

      setAvailableCategories(data || []);

      // Set default to first global category (recommended)
      if (data && data.length > 0 && !selectedCategoryId) {
        const recommended = data.find(cat => cat.name === 'recommended' && !cat.user_id);
        if (recommended) {
          setSelectedCategoryId(recommended.id);
        }
      }
    };

    fetchCategories();
  }, [user]);

  // 1. INPUT HANDLER: Decide if URL or Search
  async function handleInitialSubmit() {
    if (!currentProfile) {
      toast.error("Bir kullanıcı seçmelisin.");
      return;
    }

    const inputVal = url.trim();
    if (!inputVal) {
      toast.error("Lütfen bir şarkı adı veya bağlantı girin.");
      return;
    }

    setIsLoading(true);
    setSearchResults(null);
    setPreviewData(null);

    try {
      // Check if it looks like a URL
      const isUrl = /(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.com|youtube\.com|youtu\.be)\//i.test(inputVal);

      if (isUrl) {
        // FLOW A: Direct URL -> Get Info -> Preview
        const songInfo = await getSongInfo(inputVal);
        if ((songInfo as any).error) {
          toast.error((songInfo as any).error);
        } else {
          setPreviewData(songInfo as any);
        }
      } else {
        // FLOW B: Search Text -> Get List -> Show List
        const results = await searchSpotifyTrackByName(inputVal);
        setSearchResults(results);
      }
    } catch (error) {
      // Silently handle error
      toast.error("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  }

  // 2. SELECTION HANDLER (For Search Flow)
  async function handleSelectResult(track: any) {
    if (!track.spotifyUrl) {
      toast.error("Bu şarkının Spotify bağlantısı bulunamadı.");
      return;
    }

    setIsLoading(true);
    try {
      // Re-fetch full info (including YouTube match) using the Spotify URL
      const songInfo = await getSongInfo(track.spotifyUrl);

      if ((songInfo as any).error) {
        toast.error((songInfo as any).error);
      } else {
        setPreviewData(songInfo as any);
        setSearchResults(null); // Hide list, show preview
      }
    } catch (error) {
      // Silently handle error
      toast.error("Şarkı detayları alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }

  // 3. CONFIRM HANDLER (Final Add)
  async function handleConfirm() {
    if (!previewData || !user) return;

    // Validate category selection
    if (!selectedCategoryId) {
      toast.error("Lütfen bir kategori seçin!");
      return;
    }

    // Determing who owns the song: The currently logged in user
    const addedById = user.id;

    const newSong: Song = {
      id: uuidv4(),
      title: previewData.title,
      artist: previewData.artist,
      youtubeUrl: previewData.youtubeUrl,
      spotifyUrl: previewData.spotifyUrl,
      addedBy: addedById,
      Category: selectedCategoryId,
    };

    const { error } = await supabase.from("Song").insert([newSong]);

    if (error) {
      toast.error("Şarkı eklenemedi!");
      return;
    }

    // Interactive Feedback
    if (currentProfile?.id !== user.id) {
      toast.success("Şarkı kendi listenize eklendi!");
    }

    // Refresh songs instantly in UI
    await refetchSongs();

    // Reset All
    setUrl("");
    setPreviewData(null);
    setSearchResults(null);
    setShowAddForm(false);
  }

  const handleCancel = () => {
    setPreviewData(null);
    setSearchResults(null);
    setUrl("");
    setShowAddForm(false);
  };

  const handleBackToResults = () => {
    // If we had search results previously, maybe we want to go back? 
    // Current logic clears searchResults when selecting. 
    // Simple behavior: Go back to input.
    setPreviewData(null);
    // If user typed a search, 'url' state still has the text, so they can search again easily.
  };

  return (
    <div>
      {showAddForm ? (
        <div className="space-y-4 p-4 border border-white/10 rounded-xl bg-gray-900/50 backdrop-blur-sm">

          {/* STATE 1: INPUT FORM (Show if no preview and no search results) */}
          {!previewData && !searchResults && (
            <div className="space-y-4">
              <input
                className="input w-full"
                placeholder="URL veya Şarkı Adı Ara..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInitialSubmit()}
              />

              <select
                className="input w-full"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="">Kategori Seç...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.user_id ? '(Özel)' : ''}
                  </option>
                ))}
              </select>

              <div className="flex gap-2 justify-end">
                <button
                  className="btn bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={handleInitialSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? "İşleniyor..." : "Devam Et"}
                </button>
                <button
                  className="btn bg-gray-700 hover:bg-gray-600 text-gray-200"
                  onClick={handleCancel}
                >
                  Vazgeç
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: SEARCH RESULTS LIST */}
          {searchResults && !previewData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex justify-between items-end">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Arama Sonuçları
                </h3>
                <button
                  onClick={() => setSearchResults(null)}
                  className="text-xs text-gray-500 hover:text-gray-300"
                >
                  Geri Dön
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="p-3 rounded-lg bg-black/20 hover:bg-white/5 border border-white/5 flex justify-between items-center group transition-colors cursor-pointer"
                    onClick={() => handleSelectResult(track)}
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-white truncate">{track.title}</div>
                      <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500 font-mono">{track.duration}</span>
                      <button className="btn-sm bg-indigo-600/80 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Seç
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {isLoading && <div className="text-center text-sm text-gray-400">Seçim yükleniyor...</div>}

              <div className="flex justify-end">
                <button
                  className="btn bg-gray-700 hover:bg-gray-600 text-gray-200"
                  onClick={() => setSearchResults(null)}
                >
                  Aramaya Dön
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: PREVIEW */}
          {previewData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Önizleme
              </h3>

              <div className="bg-black/30 p-4 rounded-lg border border-white/5 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg text-white">{previewData.title}</h4>
                    <p className="text-indigo-400 font-medium">{previewData.artist}</p>
                  </div>
                  <span className="bg-white/10 text-xs px-2 py-1 rounded text-gray-300 font-mono">
                    {previewData.duration || "0:00"}
                  </span>
                </div>

                <div className="flex gap-2 mt-2">
                  {previewData.spotifyUrl && <span className="text-[10px] bg-[#1DB954]/20 text-[#1DB954] px-2 py-0.5 rounded">Spotify</span>}
                  {previewData.youtubeUrl && <span className="text-[10px] bg-[#FF0000]/20 text-[#FF0000] px-2 py-0.5 rounded">YouTube</span>}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  className="btn bg-green-600 hover:bg-green-500 text-white font-medium px-6"
                  onClick={handleConfirm}
                  disabled={isLoading}
                >
                  Onayla ve Ekle
                </button>
                <button
                  className="btn bg-gray-700 hover:bg-gray-600 text-gray-200"
                  onClick={handleBackToResults}
                >
                  Geri Dön
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // DEFAULT STATE : BUTTONS
        <div>
          {isLoggedIn ? (
            <div className="flex flex-row flex-wrap gap-4 justify-between">
              <div className="flex gap-4">
                <button className="btn" onClick={() => setShowAddForm(true)}>
                  Link ile Şarkı Ekle
                </button>
                <button className="btn" onClick={() => setShowAddForm(true)}>
                  Arama ile Şarkı Ekle
                </button>
                <button
                  className="btn !bg-purple-600 hover:!bg-purple-500"
                  onClick={() => setShowImportModal(true)}
                >
                  Playlist Ekle
                </button>
              </div>
              <button
                className="btn !bg-indigo-600 hover:!bg-indigo-500"
                onClick={() => setShowCreatePlaylistModal(true)}
                title="Yeni Playlist Oluştur"
              >
                + Playlist Oluştur
              </button>
            </div>
          ) : (
            <div className="flex flex-row gap-4 justify-end">
              <button className="btn !pointer-events-none opacity-60 bg-gray-800">
                Şarkı Eklemek İçin Giriş Yapın
              </button>
            </div>
          )}
        </div>
      )}


      {/* Import Playlist Modal */}
      <ImportPlaylistModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <CreatePlaylistModal
          onClose={() => setShowCreatePlaylistModal(false)}
        />
      )}
    </div>
  );
}

// Create Playlist Modal Component
function CreatePlaylistModal({ onClose }: { onClose: () => void }) {
  const { profile } = useAuth();
  const [selectedPlatform, setSelectedPlatform] = useState<"Spotify" | "YouTube" | "">("");
  const [playlistName, setPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const hasSpotify = profile?.is_spotify_connected;
  const hasYouTube = profile?.is_youtube_connected;

  const handleCreate = async () => {
    if (!selectedPlatform) {
      toast.error("Lütfen bir platform seçin");
      return;
    }

    if (!playlistName.trim()) {
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

        const result = await createSpotifyPlaylist(accessToken, playlistName.trim());
        if (result) {
          toast.success(`✅ "${result.name}" Spotify'da oluşturuldu!`);
          onClose();
        } else {
          toast.error("Playlist oluşturulamadı");
        }
      } else { // YouTube
        const { accessToken } = await getYouTubeTokens();
        if (!accessToken) {
          toast.error("YouTube token bulunamadı");
          return;
        }

        const result = await createYouTubePlaylist(accessToken, playlistName.trim());
        if (result) {
          toast.success(`✅ "${result.title}" YouTube'da oluşturuldu!`);
          onClose();
        } else {
          toast.error("Playlist oluşturulamadı");
        }
      }
    } catch (error: any) {
      const errorReason = error?.error?.errors?.[0]?.reason || "";

      if (errorReason === "youtubeSignupRequired") {
        toast.error(
          <div>
            <p><strong>YouTube Kanalı Gerekli!</strong></p>
            <p>Playlist oluşturmak için YouTube kanalınız olmalı.</p>
            <a href="https://www.youtube.com/create_channel" target="_blank" rel="noopener noreferrer">
              → Kanal Oluştur
            </a>
          </div>,
          { autoClose: 10000 }
        );
      } else {
        toast.error("Bir hata oluştu");
      }
    } finally {
      setIsCreating(false);
    }
  };

  const getButtonColor = () => {
    if (!selectedPlatform) return "bg-gray-600";
    return selectedPlatform === "Spotify" ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-lg space-y-4 w-96 border border-gray-700">
        <h3 className="text-lg font-semibold">Yeni Playlist Oluştur</h3>

        {/* Platform Selection */}
        <select
          value={selectedPlatform}
          onChange={(e) => setSelectedPlatform(e.target.value as "Spotify" | "YouTube")}
          className="input w-full bg-gray-800 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Platform Seç...</option>
          {hasSpotify && <option value="Spotify">Spotify</option>}
          {hasYouTube && <option value="YouTube">YouTube</option>}
        </select>

        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !isCreating && handleCreate()}
          placeholder="Playlist adı girin..."
          className="input w-full bg-gray-800 text-white rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={!selectedPlatform}
        />


        {/* Action Buttons - Only show if platforms are connected */}
        {(hasSpotify || hasYouTube) && (
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleCreate}
              disabled={isCreating || !playlistName.trim() || !selectedPlatform}
              className={`btn ${getButtonColor()} disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 flex items-center gap-2`}
            >
              {isCreating && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
              {isCreating ? "Oluşturuluyor..." : "Oluştur"}
            </button>
            <button
              onClick={onClose}
              className="btn bg-gray-600 hover:bg-gray-500 px-4 py-2"
            >
              İptal
            </button>
          </div>
        )}

        {/* Close button when no platforms connected */}
        {!hasSpotify && !hasYouTube && (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="btn bg-gray-600 hover:bg-gray-500 px-4 py-2"
            >
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddSong;
