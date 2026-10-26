import { useState } from "react";
import type { Note } from "../types";
import { useI18n } from "../i18n";
import { formatDateTime } from "../api";

const COLLAPSE_LENGTH = 200;

// 给 tag 分配颜色类名
const TAG_CLASSES = [
  "tag-1", "tag-2", "tag-3", "tag-4",
  "tag-5", "tag-6", "tag-7", "tag-8",
];

function tagClass(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  return TAG_CLASSES[Math.abs(hash) % TAG_CLASSES.length];
}

export default function NoteCard({ note }: { note: Note }) {
  const [expanded, setExpanded] = useState(false);
  const { t, lang } = useI18n();
  const long = note.content.length > COLLAPSE_LENGTH;
  const text =
    long && !expanded
      ? note.content.slice(0, COLLAPSE_LENGTH) + "..."
      : note.content;

  return (
    <article className="rounded-xl border border-line bg-white/60 p-5 shadow-sm">
      <h3 className="font-serif text-lg font-bold">{note.title}</h3>

      {note.image_url && (
        <img
          src={note.image_url}
          alt={note.title}
          className="mt-3 w-full max-h-72 object-cover rounded-lg"
          loading="lazy"
        />
      )}

      <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/90">{text}</p>

      {long && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm text-accent hover:underline"
        >
          {expanded ? t("collapse") : t("expand")}
        </button>
      )}

      {note.audio_url && (
        <div className="mt-3">
          <audio controls className="w-full">
            <source src={note.audio_url} />
          </audio>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass(tag)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
        <time className="text-xs text-ink/50">
          {formatDateTime(note.created_at, lang)}
        </time>
      </div>
    </article>
  );
}
