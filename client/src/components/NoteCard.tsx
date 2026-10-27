import { useState } from "react";
import type { Note } from "../types";
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

function AudioPlayer({ src }: { src: string }) {
  return (
    <audio
      controls
      controlsList="nodownload"
      preload="metadata"
      onContextMenu={(event) => event.preventDefault()}
      className="w-full"
    >
      <source src={src} />
    </audio>
  );
}

export default function NoteCard({ note }: { note: Note }) {
  const [expanded, setExpanded] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // 以 source_lang 标记的原文为默认显示语言；数据异常时回退到中文。
  const isEnglishOriginal =
    note.source_lang === "en" &&
    Boolean((note.title_en ?? "").trim() && (note.content_en ?? "").trim());

  const original = isEnglishOriginal
    ? { title: note.title_en, content: note.content_en, tags: note.tags_en }
    : { title: note.title, content: note.content, tags: note.tags };

  const translation = isEnglishOriginal
    ? { title: note.title, content: note.content, tags: note.tags }
    : { title: note.title_en, content: note.content_en, tags: note.tags_en };

  // 标题和正文都齐备，才认为这篇笔记有可用译文。
  const hasTranslation = Boolean(
    (translation.title ?? "").trim() && (translation.content ?? "").trim()
  );

  const hasAudio = Boolean(note.audio_url);
  // 纯音频笔记：有音频，且中英文正文都没有填写
  const isAudioOnly =
    hasAudio &&
    !(note.content ?? "").trim() &&
    !(note.content_en ?? "").trim();

  const transcript = (note.transcript ?? "").trim();
  const hasTranscript = isAudioOnly && Boolean(transcript);
  const isTranscriptVisible = isAudioOnly && showTranscript && hasTranscript;

  const isShowingTranslation =
    !isAudioOnly && showTranslation && hasTranslation;
  const display = isShowingTranslation ? translation : original;

  const targetLang = isEnglishOriginal ? "中文" : "英文";
  const translationLabel = isEnglishOriginal ? "中文" : "EN";
  const actionEnabled = isAudioOnly ? hasTranscript : hasTranslation;

  const long = display.content.length > COLLAPSE_LENGTH;
  const text =
    long && !expanded
      ? display.content.slice(0, COLLAPSE_LENGTH) + "..."
      : display.content;

  const transcriptLong = transcript.length > COLLAPSE_LENGTH;
  const transcriptText =
    transcriptLong && !expanded
      ? transcript.slice(0, COLLAPSE_LENGTH) + "..."
      : transcript;

  function toggleTranslation() {
    setShowTranslation((value) => !value);
    setExpanded(false);
  }

  function toggleTranscript() {
    setShowTranscript((value) => !value);
    setExpanded(false);
  }

  function actionTitle() {
    if (isAudioOnly) {
      return hasTranscript
        ? isTranscriptVisible
          ? "Hide txt"
          : "Show txt"
        : "暂无文字稿";
    }
    return hasTranslation
      ? isShowingTranslation
        ? "显示原文"
        : `查看${targetLang}`
      : "暂无译文";
  }

  return (
    <article className="rounded-xl border border-line bg-white/60 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 font-serif text-lg font-bold">{display.title}</h3>
        <button
          type="button"
          onClick={isAudioOnly ? toggleTranscript : toggleTranslation}
          disabled={!actionEnabled}
          aria-pressed={isAudioOnly ? isTranscriptVisible : isShowingTranslation}
          title={actionTitle()}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs transition-colors ${
            actionEnabled
              ? "border-line bg-white/70 text-ink/60 hover:border-accent hover:text-accent"
              : "cursor-not-allowed border-line bg-gray-100 text-gray-400"
          }`}
        >
          {isAudioOnly ? (
            isTranscriptVisible ? (
              "Hide txt"
            ) : (
              "Show txt"
            )
          ) : hasTranslation ? (
            <>
              <span className="mr-0.5 text-[10px] leading-none" aria-hidden="true">
                →
              </span>
              {isShowingTranslation ? "原文" : translationLabel}
            </>
          ) : (
            "原文"
          )}
        </button>
      </div>

      {note.image_url && (
        <img
          src={note.image_url}
          alt={display.title}
          className="mt-3 w-full max-h-72 object-cover rounded-lg"
          loading="lazy"
        />
      )}

      {isAudioOnly ? (
        <div className="mt-3 space-y-3">
          {isTranscriptVisible && (
            <>
              <p className="whitespace-pre-wrap leading-7 text-ink/90">
                {transcriptText}
              </p>
              {transcriptLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="text-sm text-accent hover:underline"
                >
                  {expanded ? "收起" : "展开全文"}
                </button>
              )}
            </>
          )}
          <AudioPlayer src={note.audio_url} />
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-ink/90">{text}</p>

          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm text-accent hover:underline"
            >
              {expanded ? "收起" : "展开全文"}
            </button>
          )}

          {hasAudio && (
            <div className="mt-3">
              <AudioPlayer src={note.audio_url} />
            </div>
          )}
        </>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {display.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tagClass(tag)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
        <time className="text-xs text-ink/50">
          {formatDateTime(note.created_at)}
        </time>
      </div>
    </article>
  );
}
