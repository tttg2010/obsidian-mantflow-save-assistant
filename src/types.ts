export interface NoteObject {
  note_id: string;
  title: string;
  content_md: string;
  content_plain: string;
  source_type: string;
  source_url: string | null;
  source_author: string | null;
  tags: string[];
  assets: unknown[];
  obsidian_status: string;
  obsidian_path: string | null;
  ai_fallback: boolean;
  created_at: string;
}

export interface PendingResponse {
  notes: NoteObject[];
  count: number;
}

export interface AiNoteSettings {
  apiKey: string;
  serverUrl: string;
  pollIntervalMinutes: number;
  vaultDir: string;
  dateSubfolder: boolean;
}

export const DEFAULT_SETTINGS: AiNoteSettings = {
  apiKey: "",
  serverUrl: "https://ainote.salpx.com",
  pollIntervalMinutes: 5,
  vaultDir: "ainote/曼塔收藏转存助手",
  dateSubfolder: true,
};
