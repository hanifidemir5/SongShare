import { useEffect, useState } from "react";
import type { Platform, Song } from "../app/types";
import { getSongInfo } from "@/app/helpers/getSongInfo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { useSpotifyAuth } from "../app/contexts/SpotifyAuthContext";
import { getUserPlaylists as getSpotifyPlaylists} from "@/app/helpers/spotifyApi";
import { getUserPlaylists as getYouTubePlaylists} from "@/app/helpers/youtubeApi";
import { addToSpotifyPlaylist } from "@/app/helpers/addToSpotifyPlaylist";
import { useYouTubeAuth } from "@/app/contexts/YoutubeAuthContext";
import { addToYouTubePlaylist } from "@/app/helpers/addToYoutubePlaylist";


type Props = {
  title: string;
  songs: Song[];
  onAdd: (song: Omit<Song, "uuid">) => void;
  onEdit: (uuid: string, song: Omit<Song, "uuid">) => void;
  onDelete: (uuid: string) => void;
};

export default function SongTable({ title, songs, onAdd, onEdit, onDelete }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Song, "uuid">>({
    title: "",
    artist: "",
    youtubeUrl: "",
    spotifyUrl: "",
  });

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [songToAdd, setSongToAdd] = useState<Song | null>(null);
  const [selectedPlaylistInModal, setSelectedPlaylistInModal] = useState<string | null>(null);
  const [selectedPlatformInModal, setSelectedPlatformInModal] = useState<string | null>(null);


  const { spotifyToken, isLoggedInWithSpotify } = useSpotifyAuth();
  const { youtubeToken, isLoggedInWithYouTube } = useYouTubeAuth();
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [youtubePlaylists, setYoutubePlaylists] = useState<any[]>([]);
  const [url, setUrl] = useState<string>("");
 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentSongs = songs.slice(startIdx, startIdx + itemsPerPage);

  useEffect(() => {
    if (isLoggedInWithSpotify && spotifyToken) {
      getSpotifyPlaylists(spotifyToken).then(setSpotifyPlaylists).catch(console.error);
    }
  }, [isLoggedInWithSpotify, spotifyToken]);

  useEffect(() => {

    if (isLoggedInWithYouTube && youtubeToken) {
      getYouTubePlaylists(youtubeToken).then(setYoutubePlaylists).catch(console.error);
    }
  }, [youtubeToken, isLoggedInWithYouTube]);

  async function handleAddSong() {
    if (url === "") {
      return alert("URL boş bırakılamaz.");
    }

    const result = await getSongInfo(url);
    const newSong: Song = {
      uuid: crypto.randomUUID(),
      title: result.title,
      artist: result.artist,
      youtubeUrl: result.youtubeUrl,
      spotifyUrl: result.spotifyUrl,
    };

    onAdd(newSong);
    setUrl("");
    setShowAddForm(false);
    setForm({ title: "", artist: "", youtubeUrl: "", spotifyUrl: "" });
  }

  async function handleUpdateSong() {
    if (!editingId) return;

    onEdit(editingId, form);  
    setEditingId(null);
    setShowUpdateForm(false);
    setForm({ title: "", artist: "", youtubeUrl: "", spotifyUrl: "" });
  }

  async function handleSubmit() {
    if (editingId) {
      await handleUpdateSong();
    } else {
      await handleAddSong();
    }
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {/* Desktop & Tablet (Table Layout) */}
      <table className="hidden md:table w-full border-collapse min-h-48">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-gray-700 text-sm">
            <th className="p-2">Şarkı</th>
            <th className="p-2">Sanatçı</th>
            <th className="p-2">Dinle</th>
            <th className="p-2">PlayListe Ekle</th>
            <th className="p-2">Düzenle</th>
            <th className="p-2">Sil</th>
          </tr>
        </thead>
        <tbody>
          {currentSongs.map((song) => (
            <tr key={song.uuid} className="border-b border-gray-800 text-sm">
              <td className="p-2 font-medium truncate max-w-[150px]">{song.title}</td>
              <td className="p-2 truncate max-w-[150px]">{song.artist}</td>
              <td className="p-2">
              {song.spotifyUrl || song.youtubeUrl ? (
                <span
                  rel="noreferrer"
                  className="relative flex items-center gap-2 group !px-3 !py-1 text-xl overflow-hidden"
                >
                <a target="blank" href={song.spotifyUrl}>
                  <FontAwesomeIcon
                    icon={faSpotify}
                    className="text-[#1DB954] transition-transform duration-300 hover:scale-125"
                  />
                </a>
                <a target="blank" href={song.youtubeUrl}>
                  <FontAwesomeIcon
                    href={song.youtubeUrl}
                    icon={faYoutube}
                    className="text-[#FF0000] transition-transform duration-700 hover:scale-125"
                  />
                </a>
                </span>
              ) : (
                <span className="badge text-xs">yok</span>
              )}
              </td>
              <td className="p-2">
                {isLoggedInWithSpotify && spotifyPlaylists.length > 0 || isLoggedInWithYouTube && youtubePlaylists.length > 0 ? (
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
                  <span className="text-gray-500 text-xs">Eklemek için giriş yapın</span>
                )}
              </td>

              <td className="p-2 ">
                <button
                  className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    setEditingId(song.uuid);
                    setForm({ title: song.title, artist: song.artist, youtubeUrl: song.youtubeUrl, spotifyUrl:song.spotifyUrl });
                    setShowUpdateForm(true);
                  }}
                >
                  Düzenle
                </button>
              </td>
              <td>
                <button
                  className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                  onClick={() => onDelete(song.uuid)}
                >
                  Sil
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile (Card Layout) */}
      <div className="md:hidden space-y-3 min-h-28">
        {currentSongs.map((song) => (
          <div
            key={song.uuid}
            className="p-3 border border-gray-700 rounded text-xs space-y-1 flex flex-col items-start justify-between"
          >
            {/* Song Title & Artist */}
            <div className="font-semibold truncate max-w-[200px]">{song.title}</div>
            <div className="text-[var(--muted)] truncate max-w-[200px]">{song.artist}</div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-3 justify-end w-full items-center">
              {/* Listen / Go to Song */}
              {song.youtubeUrl || song.spotifyUrl ? (
                <span
                  rel="noreferrer"
                  className={`
                    gap-2
                    relative flex items-center justify-center group 
                    text-2xl sm:text-xl p-2 sm:p-1 rounded-full
                    transition-all duration-300
                  `}
                >
                  <a target="blank" href={song.spotifyUrl}
                  >
                    <FontAwesomeIcon
                      icon={faSpotify}
                      className="transition-transform text-[#1DB954] duration-300 hover:scale-125"
                    />
                  </a>
                  <a target="blank" href={song.youtubeUrl} >
                    <FontAwesomeIcon
                      icon={faYoutube}
                      className="transition-transform text-[#FF0000] duration-300 hover:scale-125"
                    />
                  </a>
                </span>
              ) : (
                <span className="badge text-xs">yok</span>
              )}

              {/* Add to Playlist */}
              {((isLoggedInWithSpotify && spotifyPlaylists.length > 0) ||
                (isLoggedInWithYouTube && youtubePlaylists.length > 0)) ? (
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
                  Eklemek için giriş yapın
                </span>
              )}

              {/* Edit Song */}
              <button
                className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setEditingId(song.uuid);
                  setForm({
                    title: song.title,
                    artist: song.artist,
                    youtubeUrl: song.youtubeUrl,
                    spotifyUrl: song.spotifyUrl,
                  });
                  setShowUpdateForm(true);
                }}
              >
                Düzenle
              </button>

              {/* Delete Song */}
              <button
                className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                onClick={() => onDelete(song.uuid)}
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          className="btn !px-2 !py-1 text-xs"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
        >
          Önceki
        </button>
        <span className="px-2 text-sm">
          {currentPage} / {totalPages}
        </span>
        <button
          className="btn !px-2 !py-1 text-xs"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
        >
          Sonraki
        </button>
      </div>

      {/* Form */}
      {showUpdateForm && (
        <div className="space-y-2">
          <input
            className="input"
            placeholder="Şarkı"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            className="input"
            placeholder="Sanatçı"
            value={form.artist}
            onChange={(e) => setForm({ ...form, artist: e.target.value })}
          />
          <input
            className="input"
            placeholder="Youtube Url"
            value={form.youtubeUrl}
            onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
          />
          <input
            className="input"
            placeholder="Spotify Url"
            value={form.spotifyUrl}
            onChange={(e) => setForm({ ...form, spotifyUrl: e.target.value })}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={handleSubmit}>
              Güncelle
            </button>
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500"
              onClick={() => {
                setShowUpdateForm(false);
                setEditingId(null);
                setForm({ title: "", artist: "", youtubeUrl: "" , spotifyUrl:""});
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="space-y-2">
          <input
            className="input"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <button className="btn" onClick={handleSubmit}>
              Kontrol Et
            </button>
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500"
              onClick={() => {
                setShowAddForm(false);
                url !== "" && setUrl("");
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}


      {!showAddForm && (
        <div className="flex justify-end">
          <button className="btn" onClick={() => setShowAddForm(true)}>
            Şarkı Ekle
          </button>
        </div>
      )}

      {showPlaylistModal && songToAdd && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-900 p-6 rounded space-y-4 w-80">
          <h3 className="text-lg font-semibold">Select Playlist</h3>
          <select
            value={selectedPlatformInModal ?? ""}
            onChange={(e) => setSelectedPlatformInModal(e.target.value)}
            className="bg-gray-800 text-white w-full rounded px-2 py-1"
          >
            <option value="">Select a platform</option>
            {isLoggedInWithYouTube &&
              <option key={"youtube"} value={"Youtube"}>Youtube</option>
            }
            {
              isLoggedInWithSpotify &&
              <option key={"spotify"} value={"Spotify"}>Spotify</option>
            }
          </select>

          { selectedPlatformInModal == "Spotify" &&
              <select
              value={selectedPlaylistInModal ?? ""}
              onChange={(e) => setSelectedPlaylistInModal(e.target.value)}
              className="bg-gray-800 text-white w-full rounded px-2 py-1"
            >
              <option value="">Select a playlist</option>
              {spotifyPlaylists.map((pl) => (
                <option key={pl.uuid} value={pl.uuid}>{pl.name}</option>
              ))}
            </select>
          }

          { selectedPlatformInModal == "Youtube" &&
              <select
              value={selectedPlaylistInModal ?? ""}
              onChange={(e) => setSelectedPlaylistInModal(e.target.value)}
              className="bg-gray-800 text-white w-full rounded px-2 py-1"
            >
              <option value="">Select a playlist</option>
              {youtubePlaylists.map((pl) => (
                <option key={pl.uuid} value={pl.uuid}>{pl.title}</option>
              ))}
            </select>
          }
          
          <div className="flex justify-end gap-2">
          { selectedPlatformInModal == "Spotify" &&       
            <button
              className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
              onClick={() => {
                addToSpotifyPlaylist(spotifyToken,songToAdd, selectedPlaylistInModal);
                setShowPlaylistModal(false);
                setSongToAdd(null);
                setSelectedPlaylistInModal(null);
              }}
            >
              Ekle
            </button>
          }
          {
            selectedPlatformInModal == "Youtube" &&  
            <button
              className="btn !bg-green-600 hover:!bg-green-500 !px-2 !py-1 text-xs"
              onClick={() => {
                addToYouTubePlaylist(youtubeToken, songToAdd, selectedPlaylistInModal);
                setShowPlaylistModal(false);
                setSongToAdd(null);
                setSelectedPlaylistInModal(null);
              }}
            >
              Ekle
            </button>
          }
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500 !px-2 !py-1 text-xs"
              onClick={() => {
                setShowPlaylistModal(false);
                setSongToAdd(null);
                setSelectedPlaylistInModal(null);
              }}
            >
              İptal
            </button>
          </div>
        </div>
      </div>
      )}

    </section>
  );
}
