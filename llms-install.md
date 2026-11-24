# Installing the TOWeb MCP server (instructions for AI agents such as Cline)

TOWeb is a desktop website builder. Its MCP server is built into the TOWeb 15 application. This repository only contains a small launcher (`server/index.js`, plain Node.js, **no dependencies**) that finds the installed TOWeb and starts its MCP server over stdio.

## Prerequisites (check them with the user)

1. **TOWeb 15 is installed** on this computer (download: https://www.lauyan.com).
   - macOS: `/Applications/TOWeb V15.app` (or `~/Applications/TOWeb V15.app`)
   - Windows: `C:\Program Files\Lauyan\TOWeb V15\TOWeb V15.exe`
2. **AI access is turned on in TOWeb**: in TOWeb, open **Settings › AI** and turn on **Allow AI assistants**. Full AI piloting comes with the Studio edition; every edition includes a trial.
3. **Node.js 18 or later** is available as `node`.

## Steps

1. Clone this repository into the MCP servers folder (for Cline, usually `~/Documents/Cline/MCP`):

   ```bash
   git clone https://github.com/lauyan-software/toweb-mcp.git
   ```

   There is nothing to install or build: do **not** run `npm install`.

2. Add the server to the MCP settings file (for Cline: `cline_mcp_settings.json`), using the **absolute** path of `server/index.js` in the clone:

   ```json
   {
     "mcpServers": {
       "toweb": {
         "command": "node",
         "args": ["/ABSOLUTE/PATH/TO/toweb-mcp/server/index.js"],
         "disabled": false
       }
     }
   }
   ```

   On Windows, write the path with double backslashes, for example `"C:\\Users\\name\\Documents\\Cline\\MCP\\toweb-mcp\\server\\index.js"`.

   Only if TOWeb is installed in a **non-standard folder**, add its location:

   ```json
   "env": { "TOWEB_APP_PATH": "/path/to/TOWeb V15.app" }
   ```

   (on Windows, the TOWeb installation folder).

3. Check the connection: call the tool `toweb_current_project`, then `toweb_guide` to read the site-building guide. From there, follow the server's own instructions.

## Troubleshooting

- **Every tool call answers "TOWeb 15 is not installed on this computer"** (the server starts and lists its tools, but TOWeb was not found): install TOWeb 15, or, if it is installed in another folder, set `TOWEB_APP_PATH` as shown above, then restart the MCP server.
- **"TOWeb is not available to AI assistants on this computer"**: turn on **Settings › AI › Allow AI assistants** in TOWeb, then restart the MCP server.
- **"TOWeb is installing an update"**: wait for TOWeb to restart after its update, then restart the MCP server.
