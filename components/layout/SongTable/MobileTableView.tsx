import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Song } from "@/types";
import { useSongs } from "@/contexts/SongsContext";
import { useAuth } from "@/contexts/AuthContext";

interface MobileTableProps {
  currentSongs: Song[];
  allSongs?: Song[];
  setSongToAdd: (song: Song) => void;
  setShowPlaylistModal: (show: boolean) => void;
  setShowPortalModal: (show: boolean) => void;
  setShowUpdateForm: (cb: (prev: boolean) => boolean) => void;
  setEditSong: (song: Song | null) => void;
  handleDelete: (id: string) => void;
  spotifyPlaylists: any[];
  youtubePlaylists: any[];
  fetchPlaylists: () => Promise<void>;
  isSystemPlaylist?: boolean;
}

import { extractSpotifyId, extractYoutubeId } from "@/lib/helpers/mediaUtils";
import { usePlayer, PlaylistItem } from "@/contexts/PlayerContext";

const MobileTableView = ({
  currentSongs,
  allSongs,
  setSongToAdd,
  setShowPlaylistModal,
  setShowPortalModal,
  setShowUpdateForm,
  setEditSong,
  handleDelete,
  spotifyPlaylists,
  youtubePlaylists,
  fetchPlaylists,
  isSystemPlaylist = false,
}: MobileTableProps) => {
  const { currentProfile } = useSongs();
  const { profile, isLoggedIn } = useAuth();
  const { playWithPlaylist } = usePlayer();



  const handlePlay = (song: Song, type: 'youtube' | 'spotify') => {
    const url = type === 'youtube' ? song.youtubeUrl : song.spotifyUrl;
    const id = type === 'youtube' ? extractYoutubeId(url) : extractSpotifyId(url);

    if (id) {
      // Build playlist from all songs (not just current page) for the same platform
      const songsForPlaylist = allSongs || currentSongs;
      const playlistItems: PlaylistItem[] = songsForPlaylist.flatMap((s) => {
        const songUrl = type === 'youtube' ? s.youtubeUrl : s.spotifyUrl;
        const songId = type === 'youtube' ? extractYoutubeId(songUrl) : extractSpotifyId(songUrl);
        if (songId) {
          return [{ id: songId, platform: type, title: s.title, artist: s.artist }];
        }
        return [];
      });

      const currentIndex = playlistItems.findIndex((item) => item.id === id);
      playWithPlaylist(id, type, playlistItems, currentIndex >= 0 ? currentIndex : 0, song.title, song.artist);
    } else {
      // Fallback to new tab if parsing fails
      window.open(url, '_blank');
    }
  };

  return (
    <div className="md:hidden space-y-3 min-h-28">
      {currentSongs.map((song) => (
        <div
          key={song.id || song.title}
          className="p-3 border border-gray-700 rounded text-xs space-y-1 flex flex-col items-start justify-between"
        >
          {/* Şarkı & Sanatçı */}
          <div className="font-semibold truncate max-w-[200px]">
            {song.title}
          </div>

          <div className="text-[var(--muted)] truncate max-w-[200px]">
            {song.artist}
          </div>

          {/* Aksiyonlar */}
          <div className="flex flex-wrap gap-2 mt-3 justify-end w-full items-center">
            {/* Dinleme */}
            {song.spotifyUrl || song.youtubeUrl ? (
              <span className="gap-2 flex items-center justify-center text-2xl p-2 rounded-full">
                {song.spotifyUrl && (
                  <button onClick={() => handlePlay(song, 'spotify')}>
                    <FontAwesomeIcon
                      icon={faSpotify}
                      className="text-[#1DB954] hover:scale-125 transition-transform"
                    />
                  </button>
                )}

                {song.youtubeUrl && (
                  <button onClick={() => handlePlay(song, 'youtube')}>
                    <FontAwesomeIcon
                      icon={faYoutube}
                      className="text-[#FF0000] hover:scale-125 transition-transform"
                    />
                  </button>
                )}
              </span>
            ) : (
              <span className="badge text-xs">yok</span>
            )}

            {/* Dinleme & Ekleme Butonları */}
            {(profile?.is_spotify_connected || profile?.is_youtube_connected) ? (
              <div className="flex gap-2">
                <button
                  className="btn !bg-indigo-600 hover:!bg-indigo-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    setSongToAdd(song);
                    fetchPlaylists();
                    setShowPlaylistModal(true);
                  }}
                >
                  Ekle
                </button>
                <button
                  className="btn !bg-orange-600 hover:!bg-orange-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    setSongToAdd(song);
                    setShowPortalModal(true);
                  }}
                >
                  Portal+
                </button>
              </div>
            ) : (
              <a
                href="/settings?highlight=connections"
                className="btn !bg-gray-800 hover:!bg-gray-700 !px-2 !py-1 text-xs border border-white/10"
              >
                <span className="text-gray-400">Bağla</span>
              </a>
            )}

            {/* Düzenle — SADECE ÖZ SAHİBİ GÖRÜR ve SYSTEM PLAYLIST DEĞİLSE */}
            {!isSystemPlaylist && isLoggedIn && currentProfile && profile && currentProfile.id === profile.id && song.playlist_id !== 'history' && song.playlist_id !== 'topTracks' && song.playlist_id !== 'globalTopTracks' && (
              <button
                className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setShowUpdateForm((prev) => {
                    const newState = !prev;
                    setEditSong(newState ? song : null);
                    return newState;
                  });
                }}
              >
                Düzenle
              </button>
            )}

            {/* Sil — SADECE ÖZ SAHİBİ GÖRÜR ve SYSTEM PLAYLIST DEĞİLSE */}
            {!isSystemPlaylist && isLoggedIn && currentProfile && profile && currentProfile.id === profile.id && song.playlist_id !== 'history' && song.playlist_id !== 'topTracks' && song.playlist_id !== 'globalTopTracks' && (
              <button
                className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                onClick={() => song.id && handleDelete(song.id)}
              >
                Sil
              </button>
            )}
          </div>
        </div>
      ))}
    </div>

  );
};

export default MobileTableView;
