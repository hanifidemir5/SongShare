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
    <table className="hidden md:table w-full border-collapse min-h-48">
      <thead>
        <tr className="text-left text-[var(--muted)] border-b border-gray-700 text-sm">
          <th className="p-2">Şarkı</th>
          <th className="p-2">Sanatçı</th>
          <th className="p-2">Dinle</th>
          <th className="p-2">PlayListe Ekle</th>
          {canEditOrDelete && <th className="p-2">Düzenle</th>}
          {canEditOrDelete && <th className="p-2">Sil</th>}
        </tr>
      </thead>

      <tbody>
        {currentSongs?.map((song) => (
          <tr
            key={song.id || song.title}
            className="border-b border-gray-800 text-sm"
          >
            <td className="p-2 font-medium truncate min-w-[130px] max-w-[200px]">
              {song.title}
            </td>

            <td className="p-2 truncate min-w-[80px] max-w-[120px]">
              {song.artist}
            </td>

            <td className="p-2">
              {song.spotifyUrl || song.youtubeUrl ? (
                <span className="flex items-center gap-2 text-xl">
                  {song.spotifyUrl && (
                    <a target="_blank" href={song.spotifyUrl}>
                      <FontAwesomeIcon
                        icon={faSpotify}
                        className="text-[#1DB954] hover:scale-125 transition"
                      />
                    </a>
                  )}
                  {song.youtubeUrl && (
                    <a target="_blank" href={song.youtubeUrl}>
                      <FontAwesomeIcon
                        icon={faYoutube}
                        className="text-[#FF0000] hover:scale-125 transition"
                      />
                    </a>
                  )}
                </span>
              ) : (
                <span className="text-xs text-gray-500">yok</span>
              )}
            </td>

            <td className="p-2">
              {(profile?.is_spotify_connected && spotifyPlaylists?.length) ||
              (profile?.is_youtube_connected && youtubePlaylists?.length) ? (
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
                <span className="text-gray-500 text-xs">
                  Eklemek için giriş yapın
                </span>
              )}
            </td>

            {canEditOrDelete && (
              <td className="p-2">
                <button
                  className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
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
              </td>
            )}

            {canEditOrDelete && (
              <td className="p-2">
                <button
                  className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                  onClick={() => song.id && handleDelete(song.id)}
                >
                  Sil
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DesktopTableView;
