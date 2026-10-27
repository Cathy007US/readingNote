import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../../api";
import type { Note } from "../../types";

const PAGE_SIZE = 10;

export default function AdminNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  const load = async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const next = reset ? 1 : page;
      const data = await adminApi.listNotes({ page: next, pageSize: PAGE_SIZE, q });
      setNotes((prev) => (reset ? data.items : [...prev, ...data.items]));
      setPage(next + 1);
      setHasMore(next * PAGE_SIZE < data.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) load();
    });
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loading, page, q]);

  const remove = async (id: number) => {
    if (!confirm("确定删除？")) return;
    await adminApi.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="border p-2 flex-1" placeholder="搜索标题或内容" value={q} onChange={(e) => setQ(e.target.value)} />
        <Link to="/admin/notes/new" className="bg-blue-600 text-white px-4 py-2">发布笔记</Link>
      </div>
      <ul className="divide-y">
        {notes.map((n) => {
          const isEnglishOriginal = n.source_lang === "en";
          const title = isEnglishOriginal
            ? n.title_en || n.title
            : n.title || n.title_en;
          const content = isEnglishOriginal
            ? n.content_en || n.content
            : n.content || n.content_en;

          return (
            <li key={n.id} className="py-3 flex justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{title || "（无标题）"}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isEnglishOriginal
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isEnglishOriginal ? "英文原文" : "中文原文"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {content ||
                    (n.audio_url
                      ? n.transcript?.trim()
                        ? `文字稿：${n.transcript}`
                        : "音频笔记（无文字稿）"
                      : "")}
                </p>
                {n.audio_url && (
                  <audio
                    controls
                    preload="metadata"
                    className="mt-2 w-full max-w-md"
                  >
                    <source src={n.audio_url} />
                  </audio>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to={`/admin/notes/${n.id}/edit`} className="text-blue-600">修改</Link>
                <button onClick={() => remove(n.id)} className="text-red-600">删除</button>
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={sentinel} className="h-10" />
      {loading && <p>加载中...</p>}
      {!hasMore && notes.length > 0 && <p className="text-gray-400">没有更多了</p>}
    </div>
  );
}