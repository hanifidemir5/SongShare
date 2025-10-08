import { useState } from "react";
import type { Platform, Song } from "../app/types";
import { getSongInfo } from "@/app/helpers/getSongInfo";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpotify, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

type Props = {
  title: string;
  songs: Song[];
  onAdd: (song: Omit<Song, "id">) => void;
  onEdit: (id: string, song: Omit<Song, "id">) => void;
  onDelete: (id: string) => void;
};

export default function SongTable({ title, songs, onAdd, onEdit, onDelete }: Props) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Song, "id">>({
    title: "",
    artist: "",
    url: "",
    platform: null,
  });

  const [url, setUrl] = useState<string>("");
 
  // 🔹 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // bir sayfada kaç şarkı gözüksün?

  const totalPages = Math.ceil(songs.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentSongs = songs.slice(startIdx, startIdx + itemsPerPage);

  async function handleSubmit() {
    const result = await getSongInfo(url);
    const newForm = {
      title: result.title,
      artist: result.artist,
      url,
      platform: result.platform ? (result.platform as Platform) : null,
    };

    if (editingId) {
      onEdit(editingId, form);  
      setEditingId(null);
      setShowUpdateForm(false);
    } else {
      onAdd(newForm);
      setUrl("");
      setShowAddForm(false);
    }

    setForm({ title: "", artist: "", url: "" , platform:null});
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
            <th className="p-2">Link</th>
            <th className="p-2">Düzenle</th>
            <th className="p-2">Sil</th>
          </tr>
        </thead>
        <tbody>
          {currentSongs.map((song) => (
            <tr key={song.id} className="border-b border-gray-800 text-sm">
              <td className="p-2 font-medium truncate max-w-[150px]">{song.title}</td>
              <td className="p-2 truncate max-w-[150px]">{song.artist}</td>
              <td className="p-2">
              {song.url ? (
                <a
                  href={song.url}
                  target="_blank"
                  rel="noreferrer"
                  className="relative flex items-center gap-2 group !px-3 !py-1 text-xl overflow-hidden"
                >
                  {/* Ana ikon */}
                  {song.platform === "Spotify" ? (
                    <FontAwesomeIcon
                      icon={faSpotify}
                      className="text-[#1DB954] transition-transform duration-300 group-hover:-translate-x-2"
                    />
                  ) : (
                    <FontAwesomeIcon
                      icon={faYoutube}
                      className="text-[#FF0000] transition-transform duration-300 group-hover:-translate-x-2"
                    />
                  )}

                  {/* Ok ikonu */}
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="absolute right-12 opacity-0 translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 text-gray-400"
                  />
                </a>
              ) : (
                <span className="badge text-xs">yok</span>
              )}
              </td>

              <td className="p-2 ">
                <button
                  className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    setEditingId(song.id);
                    setForm({ title: song.title, artist: song.artist, url: song.url, platform: song.platform });
                    setShowUpdateForm(true);
                  }}
                >
                  Düzenle
                </button>
              </td>
              <td>
                <button
                  className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                  onClick={() => onDelete(song.id)}
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
            key={song.id}
            className="p-3 border border-gray-700 rounded text-xs space-y-1 flex flex-col items-start justify-between"
          >
            <div className="font-semibold">{song.title}</div>
            <div className="text-[var(--muted)]">{song.artist}</div>
            <div className="flex gap-2 mt-2 justify-end w-full items-center">
            {song.url ? (
              <a
                href={song.url}
                target="_blank"
                rel="noreferrer"
                className={`
                  relative flex items-center justify-center group 
                  text-2xl sm:text-xl p-2 sm:p-1 rounded-full
                  transition-all duration-300
                  hover:scale-110 active:scale-95
                  ${song.platform === "Spotify" ? "text-[#1DB954]" : "text-[#FF0000]"}
                `}
              >
                {/* Ana ikon */}
                <FontAwesomeIcon
                  icon={song.platform === "Spotify" ? faSpotify : faYoutube}
                  className="transition-transform duration-300 group-hover:-translate-x-2"
                />

                {/* Ok ikonu (sadece masaüstüde görünsün) */}
                <FontAwesomeIcon
                  icon={faArrowRight}
                  className={`
                    absolute right-10 opacity-0 translate-x-2 
                    transition-all duration-300 
                    group-hover:opacity-100 group-hover:translate-x-0
                    hidden sm:block text-gray-400
                  `}
                />
              </a>
            ) : (
              <span className="badge text-xs">yok</span>
            )}

              <button
                className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setEditingId(song.id);
                  setForm({ title: song.title, artist: song.artist, url: song.url, platform: song.platform });
                  setShowUpdateForm(true);
                }}
              >
                Düzenle
              </button>
              <button
                className="btn !bg-red-600 hover:!bg-red-500 !px-2 !py-1 text-xs"
                onClick={() => onDelete(song.id)}
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
            placeholder="URL"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
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
                setEditingId(null);
                setForm({ title: "", artist: "", url: "" , platform: null});
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
    </section>
  );
}
