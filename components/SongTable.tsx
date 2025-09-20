import { useState } from "react";
import type { Song } from "../app/types";

type Props = {
  title: string;
  songs: Song[];
  onAdd: (song: Omit<Song, "id">) => void;
  onEdit: (id: string, song: Omit<Song, "id">) => void;
  onDelete: (id: string) => void;
};

export default function SongTable({ title, songs, onAdd, onEdit, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Song, "id">>({
    title: "",
    artist: "",
    url: "",
  });

  function handleSubmit() {
    if (!form.title.trim() || !form.artist.trim()) return;

    if (editingId) {
      onEdit(editingId, form);
      setEditingId(null);
    } else {
      onAdd(form);
    }

    setForm({ title: "", artist: "", url: "" });
    setShowForm(false);
  }

  return (
    <section className="card space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {/* Desktop & Tablet (Table Layout) */}
      <table className="hidden md:table w-full border-collapse">
        <thead>
          <tr className="text-left text-[var(--muted)] border-b border-gray-700 text-sm">
            <th className="p-2">#</th>
            <th className="p-2">Şarkı</th>
            <th className="p-2">Sanatçı</th>
            <th className="p-2">Link</th>
            <th className="p-2">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          {songs.map((song, idx) => (
            <tr key={song.id} className="border-b border-gray-800 text-sm">
              <td className="p-2 font-medium truncate max-w-[150px]">{song.title}</td>
              <td className="p-2 truncate max-w-[150px]">{song.artist}</td>
              <td className="p-2">
                {song.url ? (
                  <a
                    href={song.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn !px-3 !py-1 text-xs"
                  >
                    Dinle
                  </a>
                ) : (
                  <span className="badge text-xs">yok</span>
                )}
              </td>
              <td className="p-2 flex gap-2 flex-wrap">
                <button
                  className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                  onClick={() => {
                    setEditingId(song.id);
                    setForm({ title: song.title, artist: song.artist, url: song.url });
                    setShowForm(true);
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile (Card Layout) */}
      <div className="md:hidden space-y-3">
        {songs.map((song) => (
          <div
            key={song.id}
            className="p-3 border border-gray-700 rounded text-xs space-y-1 flex flex-col items-start justify-between"
          >
            <div className="font-semibold">
               {song.title}
            </div>
            <div className="text-[var(--muted)]">{song.artist}</div>
            <div className="flex gap-2 mt-2 justify-end w-full">
              {song.url ? (
                <a
                  href={song.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn !px-2 !py-1 text-xs"
                >
                  Dinle
                </a>
              ) : (
                <span className="badge text-xs">yok</span>
              )}
              <button
                className="btn !bg-yellow-600 hover:!bg-yellow-500 !px-2 !py-1 text-xs"
                onClick={() => {
                  setEditingId(song.id);
                  setForm({ title: song.title, artist: song.artist, url: song.url });
                  setShowForm(true);
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

      {/* Form */}
      {showForm && (
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
              {editingId ? "Kaydet" : "Ekle"}
            </button>
            <button
              className="btn !bg-gray-600 hover:!bg-gray-500"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="flex justify-end">
          <button className="btn" onClick={() => setShowForm(true)}>
            Şarkı Ekle
          </button>
        </div>
      )}
    </section>
  );
}
