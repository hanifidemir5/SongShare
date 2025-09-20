type Props = {
  onSearch: (q: string) => void;
};

import { usePerson } from "../app/personContext";

export default function Header({ onSearch }: Props) {
  const { person, togglePerson } = usePerson();

  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold">Listen<span className="text-indigo-400">To</span>This</h1>
        <p className="text-sm text-[var(--muted)]">Paylaş, keşfet ve sıradaki favorini bul ✨</p>
      </div>
      <input
        className="input md:w-80"
        placeholder="Ara: başlık / sanatçı / etiket"
        onChange={(e) => onSearch(e.target.value)}
      />
      <button className="btn !px-3 !py-1 text-sm" onClick={togglePerson}>
        {person}
      </button>
    </header>
  );
}
