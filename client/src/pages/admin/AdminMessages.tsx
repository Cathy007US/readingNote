import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi, formatDateTime } from "../../api";
import type { Message, MessageCounts, MessageStatus } from "../../types";

const PAGE_SIZE = 10;

type Filter = MessageStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "待审核" },
  { key: "approved", label: "已通过" },
  { key: "rejected", label: "已拒绝" },
  { key: "all", label: "全部" },
];

const EMPTY_COUNTS: MessageCounts = {
  pending: 0,
  approved: 0,
  rejected: 0,
  all: 0,
};

const STATUS_META: Record<
  MessageStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "待审核",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  approved: {
    label: "已通过",
    className: "border-green-200 bg-green-50 text-green-700",
  },
  rejected: {
    label: "已拒绝",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default function AdminMessages() {
  const [list, setList] = useState<Message[]>([]);
  const [counts, setCounts] = useState<MessageCounts>(EMPTY_COUNTS);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("pending");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actingId, setActingId] = useState<number | null>(null);
  const requestRef = useRef(0);

  const load = useCallback(
    async (targetPage: number, mode: "replace" | "append") => {
      const reqId = ++requestRef.current;
      setLoading(true);
      setError("");
      try {
        const data = await adminApi.listMessages({
          page: targetPage,
          pageSize: PAGE_SIZE,
          q,
          status: filter,
        });
        if (reqId !== requestRef.current) return;
        setList((prev) =>
          mode === "replace" ? data.items : [...prev, ...data.items]
        );
        setCounts(data.counts ?? EMPTY_COUNTS);
        setPage(targetPage + 1);
        setHasMore(targetPage * PAGE_SIZE < data.total);
      } catch (e) {
        if (reqId === requestRef.current) setError((e as Error).message);
      } finally {
        if (reqId === requestRef.current) setLoading(false);
      }
    },
    [q, filter]
  );

  useEffect(() => {
    setList([]);
    setPage(1);
    setHasMore(false);
    void load(1, "replace");
  }, [load]);

  const refresh = async () => {
    setPage(1);
    setHasMore(false);
    await load(1, "replace");
  };

  const changeStatus = async (id: number, status: MessageStatus) => {
    if (status === "rejected" && !confirm("确定拒绝这条留言？")) return;
    setActingId(id);
    setError("");
    try {
      await adminApi.updateMessageStatus(id, status);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("确定删除？")) return;
    setActingId(id);
    setError("");
    try {
      await adminApi.deleteMessage(id);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">留言审核</h1>
        <p className="mt-1 text-sm text-gray-500">
          留言需审核通过后才会在前台展示。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              filter === f.key
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {f.label}（{counts[f.key]}）
          </button>
        ))}
      </div>

      <input
        className="w-full border p-2"
        placeholder="搜索昵称或内容"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && list.length === 0 ? (
        <p className="py-8 text-center text-gray-400">加载中...</p>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-gray-400">
          {q ? "没有找到相关留言" : "暂无留言"}
        </p>
      ) : (
        <ul className="divide-y">
          {list.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-3 py-4 sm:flex-row sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-xs ${STATUS_META[m.status].className}`}
                  >
                    {STATUS_META[m.status].label}
                  </span>
                  <p className="font-semibold">{m.nickname}</p>
                  <span className="text-xs text-gray-400">#{m.id}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
                  {m.content}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  提交于 {formatDateTime(m.created_at)}
                  {m.reviewed_at &&
                    ` · 审核于 ${formatDateTime(m.reviewed_at)}`}
                </p>
              </div>

              <div className="flex shrink-0 items-start gap-3">
                {m.status !== "approved" && (
                  <button
                    type="button"
                    disabled={actingId !== null || loading}
                    onClick={() => changeStatus(m.id, "approved")}
                    className="text-green-600 disabled:opacity-50"
                  >
                    通过
                  </button>
                )}
                {m.status !== "rejected" && (
                  <button
                    type="button"
                    disabled={actingId !== null || loading}
                    onClick={() => changeStatus(m.id, "rejected")}
                    className="text-amber-600 disabled:opacity-50"
                  >
                    拒绝
                  </button>
                )}
                {m.status !== "pending" && (
                  <button
                    type="button"
                    disabled={actingId !== null || loading}
                    onClick={() => changeStatus(m.id, "pending")}
                    className="text-gray-500 disabled:opacity-50"
                  >
                    撤回
                  </button>
                )}
                <button
                  type="button"
                  disabled={actingId !== null || loading}
                  onClick={() => remove(m.id)}
                  className="text-red-600 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => load(page, "append")}
            disabled={loading}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "加载中..." : "加载更多"}
          </button>
        </div>
      )}
      {!hasMore && !loading && list.length > 0 && (
        <p className="text-center text-xs text-gray-400">没有更多了</p>
      )}
    </div>
  );
}
