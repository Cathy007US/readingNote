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
  tags_en: [],
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

  useEffect(() => {
    if (!id) return;
    adminApi.getNote(id).then((n) => {
      setForm({
        title: n.title,
        content: n.content,
        tags: n.tags,
        title_en: n.title_en,
        content_en: n.content_en,
        tags_en: n.tags_en,
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
    <form onSubmit={submit} className="max-w-2xl grid gap-3">
      <h1 className="text-xl font-bold">{isEdit ? "编辑笔记" : "发布笔记"}</h1>
      <input className="border p-2" placeholder="中文标题" value={form.title} onChange={set("title")} required />
      <textarea className="border p-2" rows={5} placeholder="中文内容" value={form.content} onChange={set("content")} required />
      <input className="border p-2" placeholder="中文标签，逗号分隔" value={tagsText} onChange={(e) => setTagsText(e.target.value)} />
      <input className="border p-2" placeholder="英文标题" value={form.title_en} onChange={set("title_en")} />
      <textarea className="border p-2" rows={3} placeholder="英文内容" value={form.content_en} onChange={set("content_en")} />
      <input className="border p-2" placeholder="英文标签，逗号分隔" value={tagsEnText} onChange={(e) => setTagsEnText(e.target.value)} />
      <input className="border p-2" placeholder="图片 URL" value={form.image_url} onChange={set("image_url")} />
      <input className="border p-2" placeholder="音频 URL" value={form.audio_url} onChange={set("audio_url")} />
      <button className="bg-blue-600 text-white p-2">{isEdit ? "保存修改" : "发布"}</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}