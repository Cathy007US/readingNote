export type NoteSourceLang = "zh" | "en";

export type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  title_en: string;
  content_en: string;
  transcript: string;
  tags_en: string[];
  source_lang: NoteSourceLang;
  image_url: string;
  audio_url: string;
  created_at: string;
};

export interface NotesPage {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
  tags: string[];
  tagsEn?: string[];
}

export type MessageStatus = "pending" | "approved" | "rejected";

export interface Message {
  id: number;
  nickname: string;
  content: string;
  status: MessageStatus;
  reviewed_at: string | null;
  created_at: string;
}

export interface MessageCounts {
  pending: number;
  approved: number;
  rejected: number;
  all: number;
}

export interface MessagesPage {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
  counts?: MessageCounts;
}

export type NoteInput = Omit<Note, "id" | "created_at">;