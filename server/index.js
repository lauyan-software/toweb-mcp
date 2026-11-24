#!/usr/bin/env node
/**
 * TOWeb MCP launcher (MCPB bundle).
 *
 * The TOWeb MCP server is built into the TOWeb application installed on this
 * computer. This launcher contains no TOWeb code: it finds the installed app and
 * starts its MCP server over stdio (the app binary run as Node, with
 * ELECTRON_RUN_AS_NODE=1). Licensing and access rights are enforced by TOWeb.
 *
 * If TOWeb is not installed, it says so on stderr and exits: nothing is
 * downloaded or installed on the user's behalf.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

const NOM = 'TOWeb V15';

/** The TOWeb location set in the extension settings, if any. */
function choixDeLUtilisateur() {
  const v = (process.env.TOWEB_APP_PATH || '').trim();
  return v && !v.startsWith('${') ? v : '';
}

/** Binary and resources folder of a TOWeb installation, or null. */
function depuis(cheminApp) {
  if (!cheminApp) return null;
  if (process.platform === 'darwin') {
    const app = cheminApp.endsWith('.app') ? cheminApp : path.join(cheminApp, `${NOM}.app`);
    const bin = path.join(app, 'Contents', 'MacOS', NOM);
    const res = path.join(app, 'Contents', 'Resources');
    return fs.existsSync(bin) && fs.existsSync(path.join(res, 'app.asar')) ? { bin, res } : null;
  }
  if (process.platform === 'win32') {
    const dossier = cheminApp.toLowerCase().endsWith('.exe') ? path.dirname(cheminApp) : cheminApp;
    const bin = path.join(dossier, `${NOM}.exe`);
    const res = path.join(dossier, 'resources');
    return fs.existsSync(bin) && fs.existsSync(path.join(res, 'app.asar')) ? { bin, res } : null;
  }
  return null;
}

function candidats() {
  const liste = [choixDeLUtilisateur()];
  if (process.platform === 'darwin') {
    liste.push(`/Applications/${NOM}.app`, path.join(os.homedir(), 'Applications', `${NOM}.app`));
  } else if (process.platform === 'win32') {
    for (const racine of [process.env.ProgramW6432, process.env.ProgramFiles, process.env['ProgramFiles(x86)']]) {
      if (racine) liste.push(path.join(racine, 'Lauyan', NOM));
    }
    if (process.env.LOCALAPPDATA) liste.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Lauyan', NOM));
  }
  return liste.filter(Boolean);
}

const trouve = candidats().map(depuis).find(Boolean);
if (!trouve) {
  process.stderr.write(
    `${NOM} was not found on this computer. Install TOWeb 15 from https://www.lauyan.com, open it once, `
    + 'then restart Claude. If TOWeb is installed in another folder, set its location in this extension\'s settings.\n',
  );
  process.exit(1);
}

const enfant = spawn(trouve.bin, [path.join(trouve.res, 'app.asar', 'dist', 'mcp', 'lanceur.cjs')], {
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  stdio: 'inherit',
  windowsHide: true,
});
enfant.on('error', (err) => {
  process.stderr.write(`Could not start ${NOM}: ${err.message}\n`);
  process.exit(1);
});
enfant.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const s of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(s, () => { try { enfant.kill(s); } catch { /* already gone */ } });
}
