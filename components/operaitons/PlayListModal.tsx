import React, { useEffect, useState } from "react";
import { Song } from "@/app/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { addToSpotifyPlaylist } from "@/app/helpers/addToSpotifyPlaylist";
import { addToYouTubePlaylist } from "@/app/helpers/addToYoutubePlaylist";
import { getSpotifyAccessToken } from "@/app/helpers/spotifyTokenManager";

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
}

const PlaylistModal: React.FC<PlaylistModalProps> = ({
  show,
  song,
  spotifyPlaylists,
  youtubePlaylists,
  onClose,
}) => {
  if (!show || !song) return null;
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const { profile } = useAuth();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded space-y-4 w-80">
        {/* Başlık */}
        <h3 className="text-lg font-semibold">Oynatma Listesi Seç</h3>

        {/* Platform Seçimi */}
        <select
          value={selectedPlatform ?? ""}
          onChange={(e) => setSelectedPlatform(e.target.value)}
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
        {selectedPlatform === "Spotify" && (
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
        )}

        {/* YouTube Playlist Seçimi */}
        {selectedPlatform === "Youtube" && (
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
        )}

        {/* Butonlar */}
        <div className="flex justify-end gap-2">
          {selectedPlatform === "Spotify" && (
            <button
              className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
              onClick={() => {
                if (profile?.spotify_access_token && song && selectedPlaylist) {
                  addToSpotifyPlaylist(
                    profile?.spotify_access_token,
                    song,
                    selectedPlaylist
                  );
                }
                onClose();
              }}
            >
              Ekle
            </button>
          )}

          {selectedPlatform === "Youtube" && (
            <button
              className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
              onClick={() => {
                if (profile?.youtube_access_token && song && selectedPlaylist) {
                  addToYouTubePlaylist(
                    profile?.youtube_access_token,
                    song,
                    selectedPlaylist
                  );
                }
                onClose();
              }}
            >
              Ekle
            </button>
          )}

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
