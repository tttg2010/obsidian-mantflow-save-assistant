import { App, normalizePath, TFile } from "obsidian";
import { AiNoteSettings, NoteObject } from "./types";

/** 把一个 NoteObject 写成 .md 文件（含 frontmatter），返回 Vault 相对路径。 */
export class NoteWriter {
  constructor(
    private app: App,
    private settings: AiNoteSettings,
  ) {}

  async write(note: NoteObject): Promise<string> {
    const dir = this.targetDir(note);
    await this.ensureDir(dir);

    const fileName = this.safeFileName(note.title, note.note_id);
    const path = normalizePath(`${dir}/${fileName}.md`);
    const content = this.render(note);

    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(path, content);
    }
    return path;
  }

  private targetDir(note: NoteObject): string {
    const root = this.settings.vaultDir.replace(/\/$/, "");
    if (!this.settings.dateSubfolder) return root;
    const day = note.created_at.slice(0, 10); // YYYY-MM-DD
    return `${root}/${day}`;
  }

  private async ensureDir(dir: string): Promise<void> {
    const normalized = normalizePath(dir);
    if (!this.app.vault.getAbstractFileByPath(normalized)) {
      await this.app.vault.createFolder(normalized).catch(() => {
        /* 已存在则忽略 */
      });
    }
  }

  /** 文件名安全化：去掉非法字符，限长，附短 id 防重名。 */
  private safeFileName(title: string, noteId: string): string {
    const cleaned = title.replace(/[\\/:*?"<>|#^[\]]/g, "").trim().slice(0, 40);
    const shortId = noteId.slice(0, 8);
    return `${cleaned || "未命名"}-${shortId}`;
  }

  private render(note: NoteObject): string {
    const fm = [
      "---",
      `note_id: ${note.note_id}`,
      `source_type: ${note.source_type}`,
      note.source_url ? `source_url: ${note.source_url}` : null,
      note.source_author ? `source_author: ${note.source_author}` : null,
      `tags: [${note.tags.join(", ")}]`,
      `created_at: ${note.created_at}`,
      `ai_fallback: ${note.ai_fallback}`,
      "---",
      "",
    ]
      .filter((l) => l !== null)
      .join("\n");

    return `${fm}# ${note.title}\n\n${note.content_md}\n`;
  }
}
