import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useSongs } from "@/contexts/SongsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Song } from "@/types";

type Playlist = {
  id: string;
  title: string;
};

interface DesktopTableProps {
  currentSongs: Song[];
  allSongs?: Song[];
  spotifyPlaylists?: Playlist[] | null;
  youtubePlaylists?: Playlist[] | null;
  setSongToAdd: (song: Song) => void;
  setShowPlaylistModal: (value: boolean) => void;
  setShowPortalModal: (value: boolean) => void;

  setShowUpdateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setEditSong: (song: Song | null) => void;

  handleDelete: (id: string) => void;
  fetchPlaylists: () => Promise<void>;
  isSystemPlaylist?: boolean;
}

import { extractSpotifyId, extractYoutubeId } from "@/lib/helpers/mediaUtils";
import { usePlayer, PlaylistItem } from "@/contexts/PlayerContext";

const DesktopTableView: React.FC<DesktopTableProps> = ({
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
}) => {
  const { currentProfile } = useSongs();
  const { profile, isLoggedIn } = useAuth();
  const { playWithPlaylist } = usePlayer();

  const canEditOrDelete =
    isLoggedIn && currentProfile && profile && currentProfile.id === profile.id;

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
    <>
      <table className="hidden md:table w-full border-collapse min-h-48 table-fixed">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-gray-700 text-sm">
            <th className="p-3 w-[30%]">Şarkı</th>
            <th className="p-3 w-[25%]">Sanatçı</th>
            <th className="p-3 w-[15%]">Dinle</th>
            <th className="p-3 w-[30%]">İşlemler</th>
          </tr>
        </thead>

        <tbody>
          {currentSongs?.map((song) => (
            <tr
              key={song.id || song.title}
              className="border-b border-gray-800 text-sm hover:bg-white/5 transition-colors"
            >
              <td className="p-3 font-medium truncate">
                <span className="block truncate" title={song.title}>
                  {song.title}
                </span>
              </td>

              <td className="p-3 truncate text-gray-400">
                <span className="block truncate" title={song.artist}>
                  {song.artist}
                </span>
              </td>

              <td className="p-3">
                {song.spotifyUrl || song.youtubeUrl ? (
                  <div className="flex items-center gap-3 text-lg">
                    {song.spotifyUrl && (
                      <button
                        onClick={() => handlePlay(song, 'spotify')}
                        className="text-[#1DB954] hover:text-[#1ed760] hover:scale-110 transition-all p-1"
                        title="Spotify'da Dinle"
                      >
                        <FontAwesomeIcon icon={faSpotify} />
                      </button>
                    )}
                    {song.youtubeUrl && (
                      <button
                        onClick={() => handlePlay(song, 'youtube')}
                        className="text-[#FF0000] hover:text-[#ff3333] hover:scale-110 transition-all p-1"
                        title="YouTube'da İzle"
                      >
                        <FontAwesomeIcon icon={faYoutube} />
                      </button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">-</span>
                )}
              </td>

              <td className="p-3">
                <div className="flex items-center gap-2">
                  {/* Logic: 
                      1. Check if connected to EITHER platform globally (profile.is_X_connected).
                      2. If connected, show "Ekle" -> updates state + fetches playlists (lazy).
                      3. If NOT connected, show "Bağla" -> redirects to settings.
                  */}
                  {(profile?.is_spotify_connected || profile?.is_youtube_connected) ? (
                    <>
                      <button
                        className="btn !bg-indigo-600 hover:!bg-indigo-500 !px-3 !py-1.5 text-xs font-medium rounded-lg"
                        onClick={() => {
                          setSongToAdd(song);
                          fetchPlaylists(); // Lazy fetch
                          setShowPlaylistModal(true);
                        }}
                        title="Platform'a Ekle (Spotify/YouTube)"
                      >
                        Ekle
                      </button>
                      <button
                        className="btn !bg-orange-600 hover:!bg-orange-500 !px-3 !py-1.5 text-xs font-medium rounded-lg"
                        onClick={() => {
                          setSongToAdd(song);
                          setShowPortalModal(true);
                        }}
                        title="Portal Playlist'ine Ekle"
                      >
                        Portal+
                      </button>
                    </>
                  ) : (
                    <a
                      href="/settings?highlight=connections"
                      className="btn !bg-gray-800 hover:!bg-gray-700 !px-3 !py-1.5 text-xs font-medium rounded-lg border border-white/10 flex items-center gap-1"
                    >
                      <span className="text-gray-400">Platf. Bağla</span>
                    </a>
                  )}

                  {/* Actions for User-Owned Songs (Edit/Delete) - BUT NOT for system playlists */}
                  {!isSystemPlaylist && isLoggedIn && currentProfile && profile && currentProfile.id === profile.id && song.playlist_id !== 'history' && song.playlist_id !== 'topTracks' && song.playlist_id !== 'globalTopTracks' && (
                    <>
                      <button
                        className="btn !bg-gray-700 hover:!bg-gray-600 !px-2 !py-1.5 text-xs rounded-lg"
                        onClick={() => {
                          setShowUpdateForm((prev) => {
                            const open = !prev;
                            setEditSong(open ? song : null);
                            return open;
                          });
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        className="btn !bg-rose-900/50 hover:!bg-rose-900 !text-rose-200 !px-2 !py-1.5 text-xs rounded-lg border border-rose-800/50"
                        onClick={() => song.id && handleDelete(song.id)}
                      >
                        Sil
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default DesktopTableView;
