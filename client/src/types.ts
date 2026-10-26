export type Note = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  title_en: string;
  content_en: string;
  tags_en: string[];
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
}

export interface Message {
  id: number;
  nickname: string;
  content: string;
  created_at: string;
}

export interface MessagesPage {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
}

export type NoteInput = Omit<Note, "id" | "created_at">;