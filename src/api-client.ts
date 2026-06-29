import { requestUrl } from "obsidian";
import { NoteObject, PendingResponse } from "./types";

/** 后端 API 封装。使用 Obsidian 的 requestUrl 以绕过 CORS。 */
export class ApiClient {
  constructor(
    private serverUrl: string,
    private apiKey: string,
  ) {}

  private base(): string {
    return this.serverUrl.replace(/\/$/, "");
  }

  /** 拉取所有 pending 笔记。 */
  async fetchPending(limit = 50): Promise<NoteObject[]> {
    const res = await requestUrl({
      url: `${this.base()}/v1/notes/pending?limit=${limit}`,
      method: "GET",
      headers: { "X-API-Key": this.apiKey },
      throw: false,
    });
    if (res.status === 401) {
      throw new Error("API Key 无效，请检查插件设置");
    }
    if (res.status !== 200) {
      throw new Error(`拉取失败：HTTP ${res.status}`);
    }
    const body = res.json as PendingResponse;
    return body.notes;
  }

  /** 批量标记已同步，回传写入路径。 */
  async markSynced(
    noteIds: string[],
    pathMap: Record<string, string>,
  ): Promise<void> {
    if (noteIds.length === 0) return;
    const res = await requestUrl({
      url: `${this.base()}/v1/notes/synced`,
      method: "PATCH",
      headers: {
        "X-API-Key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note_ids: noteIds, obsidian_path_map: pathMap }),
      throw: false,
    });
    if (res.status !== 200) {
      throw new Error(`标记同步失败：HTTP ${res.status}`);
    }
  }

  /** 校验 API Key（设置页测试用）。 */
  async checkAuth(): Promise<boolean> {
    const res = await requestUrl({
      url: `${this.base()}/v1/users/me`,
      method: "GET",
      headers: { "X-API-Key": this.apiKey },
      throw: false,
    });
    return res.status === 200;
  }
}
