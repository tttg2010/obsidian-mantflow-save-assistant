"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => AiNotePlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/api-client.ts
var import_obsidian = require("obsidian");
var ApiClient = class {
  constructor(serverUrl, apiKey) {
    this.serverUrl = serverUrl;
    this.apiKey = apiKey;
  }
  base() {
    return this.serverUrl.replace(/\/$/, "");
  }
  /** 拉取所有 pending 笔记。 */
  async fetchPending(limit = 50) {
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.base()}/v1/notes/pending?limit=${limit}`,
      method: "GET",
      headers: { "X-API-Key": this.apiKey },
      throw: false
    });
    if (res.status === 401) {
      throw new Error("API Key \u65E0\u6548\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u8BBE\u7F6E");
    }
    if (res.status !== 200) {
      throw new Error(`\u62C9\u53D6\u5931\u8D25\uFF1AHTTP ${res.status}`);
    }
    const body = res.json;
    return body.notes;
  }
  /** 批量标记已同步，回传写入路径。 */
  async markSynced(noteIds, pathMap) {
    if (noteIds.length === 0)
      return;
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.base()}/v1/notes/synced`,
      method: "PATCH",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ note_ids: noteIds, obsidian_path_map: pathMap }),
      throw: false
    });
    if (res.status !== 200) {
      throw new Error(`\u6807\u8BB0\u540C\u6B65\u5931\u8D25\uFF1AHTTP ${res.status}`);
    }
  }
  /** 校验 API Key（设置页测试用）。 */
  async checkAuth() {
    const res = await (0, import_obsidian.requestUrl)({
      url: `${this.base()}/v1/users/me`,
      method: "GET",
      headers: { "X-API-Key": this.apiKey },
      throw: false
    });
    return res.status === 200;
  }
};

// src/note-writer.ts
var import_obsidian2 = require("obsidian");
var NoteWriter = class {
  constructor(app, settings) {
    this.app = app;
    this.settings = settings;
  }
  async write(note) {
    const dir = this.targetDir(note);
    await this.ensureDir(dir);
    const fileName = this.safeFileName(note.title, note.note_id);
    const path = (0, import_obsidian2.normalizePath)(`${dir}/${fileName}.md`);
    const content = this.render(note);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian2.TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      await this.app.vault.create(path, content);
    }
    return path;
  }
  targetDir(note) {
    const root = this.settings.vaultDir.replace(/\/$/, "");
    if (!this.settings.dateSubfolder)
      return root;
    const day = note.created_at.slice(0, 10);
    return `${root}/${day}`;
  }
  async ensureDir(dir) {
    const normalized = (0, import_obsidian2.normalizePath)(dir);
    if (!this.app.vault.getAbstractFileByPath(normalized)) {
      await this.app.vault.createFolder(normalized).catch(() => {
      });
    }
  }
  /** 文件名安全化：去掉非法字符，限长，附短 id 防重名。 */
  safeFileName(title, noteId) {
    const cleaned = title.replace(/[\\/:*?"<>|#^[\]]/g, "").trim().slice(0, 40);
    const shortId = noteId.slice(0, 8);
    return `${cleaned || "\u672A\u547D\u540D"}-${shortId}`;
  }
  render(note) {
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
      ""
    ].filter((l) => l !== null).join("\n");
    return `${fm}# ${note.title}

${note.content_md}
`;
  }
};

// src/settings.ts
var import_obsidian3 = require("obsidian");
var AiNoteSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian3.Setting(containerEl).setName("API Key").setDesc("\u5728\u5FAE\u4FE1\u52A9\u624B\u7ED1\u5B9A\u6210\u529F\u540E\u83B7\u5F97\u7684 obsidian_api_key").addText(
      (t) => t.setPlaceholder("\u7C98\u8D34 API Key").setValue(this.plugin.settings.apiKey).onChange(async (v) => {
        this.plugin.settings.apiKey = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("\u670D\u52A1\u5668\u5730\u5740").setDesc("\u540E\u7AEF\u670D\u52A1\u5730\u5740\uFF0C\u9ED8\u8BA4\u672C\u5730\u5F00\u53D1\u5730\u5740").addText(
      (t) => t.setPlaceholder("https://your-server.com").setValue(this.plugin.settings.serverUrl).onChange(async (v) => {
        this.plugin.settings.serverUrl = v.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("\u540C\u6B65\u9891\u7387\uFF08\u5206\u949F\uFF09").setDesc("\u591A\u4E45\u81EA\u52A8\u62C9\u53D6\u4E00\u6B21\u65B0\u7B14\u8BB0").addDropdown(
      (d) => d.addOptions({ "1": "1", "5": "5", "15": "15", "30": "30", "60": "60" }).setValue(String(this.plugin.settings.pollIntervalMinutes)).onChange(async (v) => {
        this.plugin.settings.pollIntervalMinutes = Number(v);
        await this.plugin.saveSettings();
        this.plugin.restartTimer();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("\u7B14\u8BB0\u76EE\u5F55").setDesc("\u7B14\u8BB0\u5199\u5165 Vault \u7684\u76F8\u5BF9\u76EE\u5F55").addText(
      (t) => t.setValue(this.plugin.settings.vaultDir).onChange(async (v) => {
        this.plugin.settings.vaultDir = v.trim() || "ainote/\u66FC\u5854\u6536\u85CF\u8F6C\u5B58\u52A9\u624B";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("\u6309\u65E5\u671F\u5206\u5B50\u76EE\u5F55").setDesc("\u5F00\u542F\u540E\u7B14\u8BB0\u6309 YYYY-MM-DD \u5206\u7EC4\u5B58\u653E").addToggle(
      (t) => t.setValue(this.plugin.settings.dateSubfolder).onChange(async (v) => {
        this.plugin.settings.dateSubfolder = v;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian3.Setting(containerEl).setName("\u6D4B\u8BD5\u8FDE\u63A5").addButton(
      (b) => b.setButtonText("\u6D4B\u8BD5").onClick(async () => {
        const client = new ApiClient(
          this.plugin.settings.serverUrl,
          this.plugin.settings.apiKey
        );
        const ok = await client.checkAuth().catch(() => false);
        new import_obsidian3.Notice(ok ? "\u2705 \u8FDE\u63A5\u6210\u529F" : "\u274C \u8FDE\u63A5\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5730\u5740\u4E0E API Key");
      })
    ).addButton(
      (b) => b.setButtonText("\u7ACB\u5373\u540C\u6B65").setCta().onClick(() => this.plugin.syncNow())
    );
  }
};

// src/types.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  serverUrl: "https://ainote.salpx.com",
  pollIntervalMinutes: 5,
  vaultDir: "ainote/\u66FC\u5854\u6536\u85CF\u8F6C\u5B58\u52A9\u624B",
  dateSubfolder: true
};

// src/main.ts
var MANTA_ICON_ID = "mantflow-m-full";
var AiNotePlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.timer = null;
    this.syncing = false;
  }
  async onload() {
    await this.loadSettings();
    (0, import_obsidian4.addIcon)(
      MANTA_ICON_ID,
      '<path d="M6 94V6h18l26 39L76 6h18v88H77V37L56 71H44L23 37v57H6Z" fill="currentColor"/>'
    );
    this.addSettingTab(new AiNoteSettingTab(this.app, this));
    this.addCommand({
      id: "ainote-sync-now",
      name: "\u7ACB\u5373\u540C\u6B65\u66FC\u5854\u6536\u85CF",
      callback: () => this.syncNow()
    });
    this.addRibbonIcon(MANTA_ICON_ID, "\u540C\u6B65\u66FC\u5854\u6536\u85CF", () => this.syncNow());
    this.app.workspace.onLayoutReady(() => {
      window.setTimeout(() => this.syncNow(), 3e3);
      this.restartTimer();
    });
  }
  onunload() {
    this.clearTimer();
  }
  restartTimer() {
    this.clearTimer();
    const ms = Math.max(1, this.settings.pollIntervalMinutes) * 60 * 1e3;
    this.timer = window.setInterval(() => this.syncNow(), ms);
    this.registerInterval(this.timer);
  }
  clearTimer() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
  /** 拉取 pending 笔记 → 写 Vault → 回传已同步。 */
  async syncNow() {
    if (this.syncing)
      return;
    if (!this.settings.apiKey) {
      new import_obsidian4.Notice("\u8BF7\u5148\u5728\u8BBE\u7F6E\u91CC\u586B\u5199 API Key");
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
      const pathMap = {};
      const done = [];
      for (const note of notes) {
        try {
          pathMap[note.note_id] = await writer.write(note);
          done.push(note.note_id);
        } catch (e) {
          console.error("\u5199\u5165\u7B14\u8BB0\u5931\u8D25", note.note_id, e);
        }
      }
      await client.markSynced(done, pathMap);
      new import_obsidian4.Notice(`\u2705 \u5DF2\u540C\u6B65 ${done.length} \u6761\u7B14\u8BB0`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      new import_obsidian4.Notice(`\u540C\u6B65\u5931\u8D25\uFF1A${msg}`);
      console.error("\u540C\u6B65\u5931\u8D25", e);
    } finally {
      this.syncing = false;
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
