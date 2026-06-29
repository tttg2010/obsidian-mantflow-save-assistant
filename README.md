# 曼塔收藏转存助手

MantFlow Save Assistant syncs notes from the MantFlow AI note service into an Obsidian vault.

The plugin polls the configured MantFlow backend for pending notes, writes them as Markdown files, and marks them as synced after a successful write.

## Features

- Sync saved WeChat, WeCom, and link notes into Obsidian.
- Write notes into date-based folders.
- Include frontmatter, source URL, source author, tags, AI summary, screenshots, and original text.
- Manual sync command and ribbon icon.
- Configurable server URL, API key, sync interval, and target folder.

## Setup

1. Install and enable the plugin in Obsidian.
2. Open the plugin settings.
3. Set the server URL. The default is `https://ainote.salpx.com`.
4. Paste your API key from the MantFlow service.
5. Click **测试连接**.
6. Click **立即同步** or wait for the polling interval.

By default, notes are written to:

```text
ainote/曼塔收藏转存助手/YYYY-MM-DD/
```

## Privacy

This plugin connects only to the server URL configured in the plugin settings. It sends your API key to that server for authentication and downloads your pending notes. It does not send vault file contents to the server.

## Development

```bash
npm install
npm run build
```

The built plugin files are:

- `main.js`
- `manifest.json`
- `versions.json`
