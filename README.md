# TOWeb MCP server

Connect Claude (and other MCP clients) to **TOWeb 15**, the desktop website builder for Mac and Windows: pages, blog, online shop, bookings, documentation and multilingual sites, published to your own hosting by FTP or SFTP.

With this extension, your AI assistant can create a complete site, write and lay out pages, add products and posts, translate, check and publish, while you watch every change live in TOWeb and can undo any of them.

## Requirements

- **TOWeb 15** installed on this computer: <https://www.lauyan.com>
- In TOWeb: **Settings › AI › Allow AI assistants**
- Full AI piloting comes with the **Studio** edition. Every edition includes a trial on sites created by the assistant.

## Install

- **Claude Desktop**: download `toweb-mcp-<version>.mcpb` from the [releases](../../releases) and open it (double-click), then **Install**.
- **Other MCP clients** (Claude Code, Cursor, ChatGPT, Gemini, Mistral Vibe…): TOWeb adds itself from **Settings › AI**, or copy the configuration it shows there.
- **Cline, or any client that installs servers from a repository**: follow [llms-install.md](llms-install.md) (clone this repository, then point the client to `node server/index.js`, no dependencies).

If TOWeb is installed in a non-standard folder, set **TOWeb location** in the extension's settings.

## How it works

This package contains no TOWeb code. Its small launcher (`server/index.js`) finds the TOWeb application installed on your computer and starts the MCP server built into it (stdio). Your sites stay on your computer.

## Support

<https://www.lauyan.com/support/> · Documentation: <https://www.lauyan.com/en/documentation/>

This launcher is released under the MIT licence (see LICENSE). TOWeb itself is commercial software by Lauyan Software.
