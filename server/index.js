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
  process.stderr.write(`${NOM} was not found on this computer: answering with the tool list only.\n`);
  repli();
} else {
  lancer(trouve);
}

/**
 * Without TOWeb installed (a fresh computer, or a directory's automated check), the
 * launcher still answers as an MCP server: `initialize`, and `tools/list` with the
 * real tool list of the published version (tools.json, generated from TOWeb's own
 * MCP server). Every tool call returns an error that says how to install TOWeb.
 * No tool pretends to work.
 */
function repli() {
  const MESSAGE = 'TOWeb 15 is not installed on this computer. Download it from https://www.lauyan.com, '
    + 'then in TOWeb turn on Settings > AI > Allow AI assistants, and restart your AI assistant. '
    + 'If TOWeb is installed in another folder, set its location in the TOWEB_APP_PATH setting.';
  let liste = { tools: [], instructions: '' };
  try { liste = JSON.parse(fs.readFileSync(path.join(__dirname, 'tools.json'), 'utf8')); } catch { /* empty list */ }
  let version = '0.0.0';
  try { version = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8')).version || version; } catch { /* unknown */ }
  const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
  const envoyer = (m) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
  const traiter = (m) => {
    if (!m || typeof m !== 'object' || m.id === undefined || m.id === null) return; // notifications
    switch (m.method) {
      case 'initialize': {
        const demandee = m.params && m.params.protocolVersion;
        return envoyer({ id: m.id, result: {
          protocolVersion: VERSIONS.includes(demandee) ? demandee : VERSIONS[1],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'toweb', version },
          instructions: MESSAGE,
        } });
      }
      case 'ping': return envoyer({ id: m.id, result: {} });
      case 'tools/list': return envoyer({ id: m.id, result: { tools: liste.tools } });
      case 'tools/call': return envoyer({ id: m.id, result: { content: [{ type: 'text', text: MESSAGE }], isError: true } });
      case 'resources/list': return envoyer({ id: m.id, result: { resources: [] } });
      case 'prompts/list': return envoyer({ id: m.id, result: { prompts: [] } });
      default: return envoyer({ id: m.id, error: { code: -32601, message: `Method not found: ${m.method}` } });
    }
  };
  let tampon = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => {
    tampon += d;
    let i;
    while ((i = tampon.indexOf('\n')) >= 0) {
      const ligne = tampon.slice(0, i).trim(); tampon = tampon.slice(i + 1);
      if (!ligne) continue;
      let m;
      try { m = JSON.parse(ligne); } catch { envoyer({ id: null, error: { code: -32700, message: 'Parse error' } }); continue; }
      (Array.isArray(m) ? m : [m]).forEach(traiter);
    }
  });
  process.stdin.on('end', () => process.exit(0));
}

/** Hands over to the MCP server built into the installed TOWeb (stdio inherited). */
function lancer(trouve) {
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
}
