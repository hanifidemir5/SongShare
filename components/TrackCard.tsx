import type { Track } from "@/app/page";

type Props = {
  track: Track;
  onRemove?: () => void;
};

export default function TrackCard({ track, onRemove }: Props) {
  return (
    <article className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-lg font-semibold">{track.title}</h3>
        <p className="text-sm text-[var(--muted)]">{track.artist}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(track.tags || []).map((tag) => (
            <span key={tag} className="badge">#{tag}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {track.url && (
          <a className="btn" href={track.url} target="_blank" rel="noreferrer">Dinle</a>
        )}
        {onRemove && (
          <button className="btn !bg-red-600 hover:!bg-red-500" onClick={onRemove}>Sil</button>
        )}
      </div>
    </article>
  );
}
