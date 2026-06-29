import { addIcon, Notice, Plugin } from "obsidian";
import { ApiClient } from "./api-client";
import { NoteWriter } from "./note-writer";
import { AiNoteSettingTab } from "./settings";
import { AiNoteSettings, DEFAULT_SETTINGS } from "./types";

const MANTA_ICON_ID = "mantflow-m-full";

export default class AiNotePlugin extends Plugin {
  settings: AiNoteSettings = DEFAULT_SETTINGS;
  private timer: number | null = null;
  private syncing = false;

  async onload(): Promise<void> {
    await this.loadSettings();
    addIcon(
      MANTA_ICON_ID,
      '<path d="M6 94V6h18l26 39L76 6h18v88H77V37L56 71H44L23 37v57H6Z" fill="currentColor"/>',
    );
    this.addSettingTab(new AiNoteSettingTab(this.app, this));

    this.addCommand({
      id: "ainote-sync-now",
      name: "立即同步曼塔收藏",
      callback: () => this.syncNow(),
    });

    this.addRibbonIcon(MANTA_ICON_ID, "同步曼塔收藏", () => this.syncNow());

    // 启动后稍等再首次同步，避免和 Vault 加载抢资源
    this.app.workspace.onLayoutReady(() => {
      window.setTimeout(() => this.syncNow(), 3000);
      this.restartTimer();
    });
  }

  onunload(): void {
    this.clearTimer();
  }

  restartTimer(): void {
    this.clearTimer();
    const ms = Math.max(1, this.settings.pollIntervalMinutes) * 60 * 1000;
    this.timer = window.setInterval(() => this.syncNow(), ms);
    this.registerInterval(this.timer);
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** 拉取 pending 笔记 → 写 Vault → 回传已同步。 */
  async syncNow(): Promise<void> {
    if (this.syncing) return;
    if (!this.settings.apiKey) {
      new Notice("请先在设置里填写 API Key");
      return;
    }
    this.syncing = true;
    const client = new ApiClient(this.settings.serverUrl, this.settings.apiKey);
    const writer = new NoteWriter(this.app, this.settings);

    try {
      const notes = await client.fetchPending();
      if (notes.length === 0) {
        this.syncing = false;
        return;
      }
      const pathMap: Record<string, string> = {};
      const done: string[] = [];
      for (const note of notes) {
        try {
          pathMap[note.note_id] = await writer.write(note);
          done.push(note.note_id);
        } catch (e) {
          console.error("写入笔记失败", note.note_id, e);
        }
      }
      await client.markSynced(done, pathMap);
      new Notice(`✅ 已同步 ${done.length} 条笔记`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`同步失败：${msg}`);
      console.error("同步失败", e);
    } finally {
      this.syncing = false;
    }
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
