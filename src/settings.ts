import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { ApiClient } from "./api-client";
import type AiNotePlugin from "./main";

export class AiNoteSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: AiNotePlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("在微信助手绑定成功后获得的 obsidian_api_key")
      .addText((t) =>
        t
          .setPlaceholder("粘贴 API Key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("服务器地址")
      .setDesc("后端服务地址，默认本地开发地址")
      .addText((t) =>
        t
          .setPlaceholder("https://your-server.com")
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (v) => {
            this.plugin.settings.serverUrl = v.trim();
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("同步频率（分钟）")
      .setDesc("多久自动拉取一次新笔记")
      .addDropdown((d) =>
        d
          .addOptions({ "1": "1", "5": "5", "15": "15", "30": "30", "60": "60" })
          .setValue(String(this.plugin.settings.pollIntervalMinutes))
          .onChange(async (v) => {
            this.plugin.settings.pollIntervalMinutes = Number(v);
            await this.plugin.saveSettings();
            this.plugin.restartTimer();
          }),
      );

    new Setting(containerEl)
      .setName("笔记目录")
      .setDesc("笔记写入 Vault 的相对目录")
      .addText((t) =>
        t
          .setValue(this.plugin.settings.vaultDir)
          .onChange(async (v) => {
            this.plugin.settings.vaultDir = v.trim() || "ainote/曼塔收藏转存助手";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("按日期分子目录")
      .setDesc("开启后笔记按 YYYY-MM-DD 分组存放")
      .addToggle((t) =>
        t.setValue(this.plugin.settings.dateSubfolder).onChange(async (v) => {
          this.plugin.settings.dateSubfolder = v;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("测试连接")
      .addButton((b) =>
        b.setButtonText("测试").onClick(async () => {
          const client = new ApiClient(
            this.plugin.settings.serverUrl,
            this.plugin.settings.apiKey,
          );
          const ok = await client.checkAuth().catch(() => false);
          new Notice(ok ? "✅ 连接成功" : "❌ 连接失败，请检查地址与 API Key");
        }),
      )
      .addButton((b) =>
        b.setButtonText("立即同步").setCta().onClick(() => this.plugin.syncNow()),
      );
  }
}
