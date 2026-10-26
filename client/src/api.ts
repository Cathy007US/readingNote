import type { Message, NotesPage } from "./types";
import type { Lang } from "./i18n/translations";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? "Request failed"
    );
  }
  return data as T;
}

export const api = {
  listNotes(params: {
    search?: string;
    page?: number;
    pageSize?: number;
    tag?: string;
    lang?: Lang;
  }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    if (params.tag) qs.set("tag", params.tag);
    qs.set("lang", params.lang ?? "zh");
    return request<NotesPage>(`/api/notes?${qs.toString()}`);
  },

  listMessages() {
    return request<{ items: Message[] }>("/api/messages");
  },

  createMessage(body: { nickname: string; content: string }) {
    return request<Message>("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  },
};

export function formatDateTime(iso: string, lang: Lang = "zh"): string {
  const locale = lang === "en" ? "en-US" : "zh-CN";
  return new Date(iso).toLocaleString(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
