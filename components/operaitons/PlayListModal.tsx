import React, { useEffect, useState } from "react";
import { Song } from "@/app/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { addToSpotifyPlaylist } from "@/app/helpers/addToSpotifyPlaylist";
import { addToYouTubePlaylist } from "@/app/helpers/addToYoutubePlaylist";
import {
  getSpotifyTokens,
  getYouTubeTokens,
} from "@/app/helpers/getSpotifyToken";

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
            <option
              value="Youtube"
              disabled={!youtubePlaylists || youtubePlaylists.length === 0}
            >
              {(!youtubePlaylists || youtubePlaylists.length === 0)
                ? "No Playlist"
                : "Youtube"}
            </option>
          )}

          {profile?.is_spotify_connected && (
            <option
              value="Spotify"
              disabled={!spotifyPlaylists || spotifyPlaylists.length === 0}
            >
              {(!spotifyPlaylists || spotifyPlaylists.length === 0)
                ? "No Playlist"
                : "Spotify"}
            </option>
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
          <button
            className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:!bg-green-600"
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
                if (accessToken && song && selectedPlaylist) {
                  addToYouTubePlaylist(accessToken, song, selectedPlaylist);
                } else {
                  console.error("YouTube token missing");
                  alert("YouTube oturumu açık değil veya token alınamadı.");
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
