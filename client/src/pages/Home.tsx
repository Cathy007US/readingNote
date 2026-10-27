import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import NoteCard from "../components/NoteCard";
import { useI18n } from "../i18n";
import type { Note } from "../types";

const PAGE_SIZE = 10;

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

export default function Home() {
  const { t, tf, lang } = useI18n();
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ✅ 用 ref 跟踪 loadingMore 和 page，避免 loadMore 依赖它们导致反复重建
  const loadingMoreRef = useRef(false);
  const pageRef = useRef(1);

  const hasMore = notes.length < total;

  // 首次加载或搜索/筛选/语言切换时重置列表
  const loadFirst = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    pageRef.current = 1; // ✅ 重置 ref 中的页码
    api
      .listNotes({ search, page: 1, pageSize: PAGE_SIZE, tag: activeTag, lang })
      .then((data) => {
        if (cancelled) return;
        setNotes(data.items);
        setTotal(data.total);
        setTags(data.tags);
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [search, activeTag, lang]);

  // ✅ 把 loadFirst 返回的清理函数交给 useEffect
  useEffect(() => {
    return loadFirst();
  }, [loadFirst]);

  // 加载更多
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    api
      .listNotes({ search, page: nextPage, pageSize: PAGE_SIZE, tag: activeTag, lang })
      .then((data) => {
        setNotes((prev) => [...prev, ...data.items]);
        pageRef.current = nextPage; // ✅ 只更新 ref，不再调用 setPage
      })
      .catch(() => {})
      .finally(() => {
        loadingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [hasMore, search, activeTag, lang]);

  // IntersectionObserver 自动触发加载更多
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMoreRef.current) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore]);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
  }

  function selectTag(tag: string) {
    setActiveTag(tag);
  }

  return (
    <section>
      {/* 标题区 */}
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold">{t("allNotes")}</h2>
        <div className="mt-1 flex items-baseline gap-3">
          <p className="text-sm text-ink/60">{tf("totalNotes", total)}</p>
          <p className="text-xs italic text-ink/40">{t("livingWords")}</p>
        </div>
      </div>

      {/* Tag 分类 */}
      {tags.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectTag("")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTag === ""
                ? "bg-accent text-white"
                : "bg-white/60 text-ink/70 border border-line hover:bg-accent-soft"
            }`}
          >
            {t("allTags")}
          </button>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => selectTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                activeTag === tag
                  ? "ring-2 ring-accent ring-offset-1"
                  : "opacity-80 hover:opacity-100"
              } ${tagClass(tag)}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* 搜索 */}
      <form onSubmit={onSearch} className="mb-6 flex gap-2">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 rounded-lg border border-line bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm text-white hover:opacity-90"
        >
          {t("search")}
        </button>
      </form>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* 笔记列表 */}
      {loading ? (
        <p className="py-10 text-center text-ink/50">{t("loading")}</p>
      ) : notes.length === 0 ? (
        <p className="py-10 text-center text-ink/50">
          {search || activeTag ? t("noSearchResult") : t("noNotes")}
        </p>
      ) : (
        <div className="space-y-4">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}

      {/* 下拉加载更多 */}
      {!loading && hasMore && (
        <div ref={sentinelRef} className="mt-8 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="rounded-lg border border-line bg-white/60 px-6 py-2.5 text-sm text-ink/70 transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-50"
          >
            {loadingMore ? t("loading") : t("loadMore")}
          </button>
          <p className="text-xs text-ink/40">
            {notes.length} / {total}
          </p>
        </div>
      )}

      {/* 全部加载完 */}
      {!loading && !hasMore && notes.length > 0 && (
        <p className="mt-8 text-center text-xs text-ink/40">
          {t("noMore")}
        </p>
      )}
    </section>
  );
}