import { useEffect, useRef, useState } from "react";
import { adminApi, formatDateTime } from "../../api";
import type { Message } from "../../types";

const PAGE_SIZE = 10;

export default function AdminMessages() {
  const [list, setList] = useState<Message[]>([]);
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
      const data = await adminApi.listMessages({ page: next, pageSize: PAGE_SIZE, q });
      setList((prev) => (reset ? data.items : [...prev, ...data.items]));
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
    await adminApi.deleteMessage(id);
    setList((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-4">
      <input className="border p-2 w-full" placeholder="搜索昵称或内容" value={q} onChange={(e) => setQ(e.target.value)} />
      <ul className="divide-y">
        {list.map((m) => (
          <li key={m.id} className="py-3 flex justify-between gap-4">
            <div>
              <p className="font-semibold">{m.nickname}</p>
              <p className="text-sm text-gray-600">{m.content}</p>
              <p className="text-xs text-gray-400">{formatDateTime(m.created_at)}</p>
            </div>
            <button onClick={() => remove(m.id)} className="text-red-600 shrink-0">删除</button>
          </li>
        ))}
      </ul>
      <div ref={sentinel} className="h-10" />
      {loading && <p>加载中...</p>}
      {!hasMore && list.length > 0 && <p className="text-gray-400">没有更多了</p>}
    </div>
  );
}