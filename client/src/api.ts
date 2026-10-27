import type {
  Message,
  MessageStatus,
  MessagesPage,
  Note,
  NoteInput,
  NotesPage,
} from "./types";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Request failed");
  }
  return data as T;
}

// ---------- 前台 ----------
export const api = {
  listNotes(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    tag?: string;
  }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.tag) qs.set("tag", params.tag);
    qs.set("lang", "zh");
    return request<NotesPage>(`/api/notes?${qs.toString()}`);
  },

  listMessages() {
    return request<MessagesPage>("/api/messages");
  },

  createMessage(body: { nickname: string; content: string }) {
    return request<Message>("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

// ---------- 后台 ----------
function getToken() {
  return localStorage.getItem("token");
}

async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    if (location.pathname !== "/admin/login") location.href = "/admin/login";
    throw new Error("未登录或登录已过期");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "请求失败");
  }
  return data as T;
}

export const adminApi = {
  login(body: { username: string; password: string }) {
    return adminRequest<{ token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  listNotes(params: { page?: number; pageSize?: number; q?: string } = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.q) qs.set("q", params.q);
    return adminRequest<NotesPage>(`/api/notes?${qs.toString()}`);
  },

  getNote(id: number | string) {
    return adminRequest<Note>(`/api/notes/${id}`);
  },

  createNote(body: NoteInput) {
    return adminRequest<Note>("/api/notes", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  updateNote(id: number | string, body: NoteInput) {
    return adminRequest<Note>(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },

  deleteNote(id: number | string) {
    return adminRequest<{ ok: boolean }>(`/api/notes/${id}`, { method: "DELETE" });
  },

  listMessages(
    params: {
      page?: number;
      pageSize?: number;
      q?: string;
      status?: MessageStatus | "all";
    } = {}
  ) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.q) qs.set("q", params.q);
    if (params.status) qs.set("status", params.status);
    return adminRequest<MessagesPage>(`/api/admin/messages?${qs.toString()}`);
  },

  updateMessageStatus(id: number | string, status: MessageStatus) {
    return adminRequest<Message>(`/api/admin/messages/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  deleteMessage(id: number | string) {
    return adminRequest<{ ok: boolean }>(`/api/admin/messages/${id}`, {
      method: "DELETE",
    });
  },
};

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
