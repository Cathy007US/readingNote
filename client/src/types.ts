export interface Note {
  id: number;
  title: string;
  content: string;
  tags: string[];
  image_url: string;
  audio_url: string;
  created_at: string;
}

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
