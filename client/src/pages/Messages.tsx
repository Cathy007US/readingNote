import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, formatDateTime } from "../api";
import { useI18n } from "../i18n";
import type { Message } from "../types";

const inputClass =
  "w-full rounded-lg border border-line bg-white/70 px-3 py-2 text-sm outline-none focus:border-accent";

export default function Messages() {
  const { t, tf, lang } = useI18n();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msgError, setMsgError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError("");
    api
      .listMessages()
      .then((d) => setMessages(d.items))
      .catch((e: Error) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsgError("");
    setSubmitting(true);
    try {
      await api.createMessage({ nickname, content });
      setContent("");
      load();
    } catch (err) {
      setMsgError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold">{t("messagesTitle")}</h2>
        <p className="mt-1 text-sm text-ink/60">{t("messagesSubtitle")}</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="mb-10 space-y-4 rounded-xl border border-line bg-white/60 p-5 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm text-ink/70">
            {t("nickname")} *
          </label>
          <input
            className={inputClass}
            value={nickname}
            maxLength={50}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t("nicknamePlaceholder")}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">
            {t("messageContent")} *
          </label>
          <textarea
            className={`${inputClass} min-h-28 leading-7`}
            value={content}
            maxLength={1000}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("messagePlaceholder")}
          />
        </div>

        {msgError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {msgError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-5 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? t("submitting") : t("submitMessage")}
        </button>
      </form>

      <h3 className="mb-4 font-serif text-lg font-bold">
        {tf("allMessages", messages.length)}
      </h3>

      {loadError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {loading ? (
        <p className="py-8 text-center text-ink/50">{t("loading")}</p>
      ) : messages.length === 0 ? (
        <p className="py-8 text-center text-ink/50">{t("noMessages")}</p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-line bg-white/60 p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-accent">{m.nickname}</span>
                <time className="text-xs text-ink/50">
                  {formatDateTime(m.created_at, lang)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap leading-7 text-ink/90">
                {m.content}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
