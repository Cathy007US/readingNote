import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../../api";
import type { NoteInput } from "../../types";

const empty: NoteInput = {
  title: "",
  content: "",
  tags: [],
  title_en: "",
  content_en: "",
  transcript: "",
  tags_en: [],
  source_lang: "zh",
  image_url: "",
  audio_url: "",
};

export default function NoteForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState<NoteInput>(empty);
  const [tagsText, setTagsText] = useState("");
  const [tagsEnText, setTagsEnText] = useState("");
  const [msg, setMsg] = useState("");
  const nav = useNavigate();

  const isZhOriginal = form.source_lang === "zh";
  const isEnOriginal = form.source_lang === "en";
  const hasAudio = form.audio_url.trim() !== "";
  const isAudioOnly =
    hasAudio && !form.content.trim() && !form.content_en.trim();

  useEffect(() => {
    if (!id) return;
    adminApi.getNote(id).then((n) => {
      setForm({
        title: n.title,
        content: n.content,
        tags: n.tags,
        title_en: n.title_en,
        content_en: n.content_en,
        transcript: n.transcript ?? "",
        tags_en: n.tags_en,
        source_lang: n.source_lang === "en" ? "en" : "zh",
        image_url: n.image_url,
        audio_url: n.audio_url,
      });
      setTagsText(n.tags.join(", "));
      setTagsEnText(n.tags_en.join(", "));
    });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("提交中...");
    const body: NoteInput = {
      ...form,
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
      tags_en: tagsEnText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    try {
      if (isEdit) await adminApi.updateNote(id!, body);
      else await adminApi.createNote(body);
      setMsg(isEdit ? "已更新" : "已发布");
      setTimeout(() => nav("/admin/notes"), 600);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const set = (k: keyof NoteInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} className="max-w-2xl grid gap-4">
      <h1 className="text-xl font-bold">{isEdit ? "编辑笔记" : "发布笔记"}</h1>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-800">原文语言</p>
        <p className="mt-1 text-xs text-gray-500">
          前台默认展示原文；有译文时，笔记右上角显示「→ EN」/「→ 中文」，点击后显示「→ 原文」可切回；没有译文时显示灰色「原文」且不可点击。另一种语言作为译文，可以留空。
        </p>
        <div className="mt-3 flex flex-wrap gap-5 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="source_lang"
              value="zh"
              checked={isZhOriginal}
              onChange={() => setForm({ ...form, source_lang: "zh" })}
            />
            中文
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="source_lang"
              value="en"
              checked={isEnOriginal}
              onChange={() => setForm({ ...form, source_lang: "en" })}
            />
            English
          </label>
        </div>
      </div>

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">
          中文
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              isZhOriginal
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isZhOriginal ? "原文" : "译文（可选）"}
          </span>
        </legend>
        <div className="grid gap-3">
          <input
            className="border p-2"
            placeholder={isZhOriginal ? "中文标题（必填）" : "中文标题（译文）"}
            value={form.title}
            onChange={set("title")}
            required={isZhOriginal}
          />
          <textarea
            className="border p-2"
            rows={5}
            placeholder={
              isZhOriginal
                ? hasAudio
                  ? "中文内容（有音频时可留空）"
                  : "中文内容（必填）"
                : "中文内容（译文）"
            }
            value={form.content}
            onChange={set("content")}
            required={isZhOriginal && !hasAudio}
          />
          <input
            className="border p-2"
            placeholder="中文标签，逗号分隔"
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-gray-200 p-4">
        <legend className="px-1 text-sm font-medium">
          English
          <span
            className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              isEnOriginal
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {isEnOriginal ? "原文" : "译文（可选）"}
          </span>
        </legend>
        <div className="grid gap-3">
          <input
            className="border p-2"
            placeholder={isEnOriginal ? "English title (required)" : "English title (translation)"}
            value={form.title_en}
            onChange={set("title_en")}
            required={isEnOriginal}
          />
          <textarea
            className="border p-2"
            rows={5}
            placeholder={
              isEnOriginal
                ? hasAudio
                  ? "English content (optional with audio)"
                  : "English content (required)"
                : "English content (translation)"
            }
            value={form.content_en}
            onChange={set("content_en")}
            required={isEnOriginal && !hasAudio}
          />
          <input
            className="border p-2"
            placeholder="English tags, comma separated"
            value={tagsEnText}
            onChange={(e) => setTagsEnText(e.target.value)}
          />
        </div>
      </fieldset>

      <div className="grid gap-3 rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium">媒体</p>
        <input
          className="border p-2"
          placeholder="图片 URL"
          value={form.image_url}
          onChange={set("image_url")}
        />
        <input
          className="border p-2"
          placeholder="音频 URL"
          value={form.audio_url}
          onChange={set("audio_url")}
        />
        {isAudioOnly && (
          <textarea
            className="border p-2"
            rows={4}
            placeholder="文字稿（可选，纯音频笔记点击「Show txt」时显示）"
            value={form.transcript}
            onChange={set("transcript")}
          />
        )}
        <p className="text-xs text-gray-500">
          填写音频后，原文内容可以留空；纯音频笔记可以额外填写文字稿，前台点击「Show txt」时会显示在音频上方。
        </p>
      </div>

      <button className="bg-blue-600 p-2 text-white">{isEdit ? "保存修改" : "发布"}</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
