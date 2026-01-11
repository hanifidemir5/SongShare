import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { Song } from "@/app/types";
import { useSongs } from "@/app/contexts/SongsContext";
import { useAuth } from "@/app/contexts/AuthContext";

interface MobileTableProps {
  currentSongs: Song[];
  setSongToAdd: (song: Song) => void;
  setShowPlaylistModal: (show: boolean) => void;
  setShowUpdateForm: (cb: (prev: boolean) => boolean) => void;
  setEditSong: (song: Song | null) => void;
  handleDelete: (id: string) => void;
  spotifyPlaylists: any[];
  youtubePlaylists: any[];
}

import { extractSpotifyId, extractYoutubeId } from "@/app/helpers/mediaUtils";
import { usePlayer } from "@/app/contexts/PlayerContext";

const MobileTableView = ({
  currentSongs,
  setSongToAdd,
  setShowPlaylistModal,
  setShowUpdateForm,
  setEditSong,
  handleDelete,
  spotifyPlaylists,
  youtubePlaylists,
}: MobileTableProps) => {
  const { currentProfile } = useSongs();
  const { profile, isLoggedIn } = useAuth();
  const { play } = usePlayer();

  // Aynı mantık: sadece profil sahibiyse edit/sil görünür
  const canEditOrDelete =
    isLoggedIn && currentProfile && profile && currentProfile.id === profile.id;

  const handlePlay = (song: Song, type: 'youtube' | 'spotify') => {
    const url = type === 'youtube' ? song.youtubeUrl : song.spotifyUrl;
    const id = type === 'youtube' ? extractYoutubeId(url) : extractSpotifyId(url);

    if (id) {
      play(id, type);
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

            {(profile?.is_spotify_connected && spotifyPlaylists.length > 0) ||
              (profile?.is_youtube_connected && youtubePlaylists.length > 0) ? (
              <button
                className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setSongToAdd(song);
                  setShowPlaylistModal(true);
                }}
              >
                Ekle
              </button>
            ) : (
              <span className="text-gray-500 text-xs whitespace-nowrap">
                {profile?.is_youtube_connected &&
                  !youtubePlaylists?.length ? (
                  "Youtube Playlisti Yok"
                ) : profile?.is_spotify_connected &&
                  !spotifyPlaylists?.length ? (
                  "Spotify Playlisti Yok"
                ) : (
                  "Eklemek için giriş yapın"
                )}
              </span>
            )}

            {/* Düzenle — SADECE ÖZ SAHİBİ GÖRÜR */}
            {canEditOrDelete && (
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

            {/* Sil — SADECE ÖZ SAHİBİ GÖRÜR */}
            {canEditOrDelete && (
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
