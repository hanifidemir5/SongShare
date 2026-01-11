import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useSongs } from "@/app/contexts/SongsContext";
import { useAuth } from "@/app/contexts/AuthContext";
import { Song } from "@/app/types";

type Playlist = {
  id: string;
  title: string;
};

interface DesktopTableProps {
  currentSongs: Song[];
  spotifyPlaylists?: Playlist[] | null;
  youtubePlaylists?: Playlist[] | null;
  setSongToAdd: (song: Song) => void;
  setShowPlaylistModal: (value: boolean) => void;

  setShowUpdateForm: React.Dispatch<React.SetStateAction<boolean>>;
  setEditSong: (song: Song | null) => void;

  handleDelete: (id: string) => void;
}

const DesktopTableView: React.FC<DesktopTableProps> = ({
  currentSongs,
  setSongToAdd,
  setShowPlaylistModal,
  setShowUpdateForm,
  setEditSong,
  handleDelete,
  spotifyPlaylists,
  youtubePlaylists,
}) => {
  const { currentProfile } = useSongs();
  const { profile, isLoggedIn } = useAuth();
  const canEditOrDelete =
    isLoggedIn && currentProfile && profile && currentProfile.id === profile.id;

  return (
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
                    <a
                      target="_blank"
                      href={song.spotifyUrl}
                      className="text-[#1DB954] hover:text-[#1ed760] hover:scale-110 transition-all p-1"
                    >
                      <FontAwesomeIcon icon={faSpotify} />
                    </a>
                  )}
                  {song.youtubeUrl && (
                    <a
                      target="_blank"
                      href={song.youtubeUrl}
                      className="text-[#FF0000] hover:text-[#ff3333] hover:scale-110 transition-all p-1"
                    >
                      <FontAwesomeIcon icon={faYoutube} />
                    </a>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-500">-</span>
              )}
            </td>

            <td className="p-3">
              <div className="flex items-center gap-2">
                {(profile?.is_spotify_connected && spotifyPlaylists?.length) ||
                  (profile?.is_youtube_connected && youtubePlaylists?.length) ? (
                  <button
                    className="btn !bg-indigo-600 hover:!bg-indigo-500 !px-3 !py-1.5 text-xs font-medium rounded-lg"
                    onClick={() => {
                      setSongToAdd(song);
                      setShowPlaylistModal(true);
                    }}
                  >
                    Ekle
                  </button>
                ) : (
                  <span className="text-gray-500 text-[10px] italic">
                    {profile?.is_youtube_connected &&
                      !youtubePlaylists?.length ? (
                      "Youtube Playlisti Yok"
                    ) : profile?.is_spotify_connected &&
                      !spotifyPlaylists?.length ? (
                      "Spotify Playlisti Yok"
                    ) : (
                      "Giriş Gerekli"
                    )}
                  </span>
                )}

                {canEditOrDelete && (
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
  );
};

export default DesktopTableView;
