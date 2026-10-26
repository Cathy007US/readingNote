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
        {notes.map((n) => (
          <li key={n.id} className="py-3 flex justify-between gap-4">
            <div>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{n.content}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to={`/admin/notes/${n.id}/edit`} className="text-blue-600">修改</Link>
              <button onClick={() => remove(n.id)} className="text-red-600">删除</button>
            </div>
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="h-10" />
      {loading && <p>加载中...</p>}
      {!hasMore && notes.length > 0 && <p className="text-gray-400">没有更多了</p>}
    </div>
  );
}