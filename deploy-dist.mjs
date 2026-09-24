// Deploy a built folder to a Parse app's web hosting through the Back4app MCP
// server, driven over stdio — the same transport an AI editor uses.
//
//   export BACK4APP_ACCOUNT_KEY=...      # Account Settings → Account Keys
//   node deploy-dist.mjs <appName> <dir> # e.g. node deploy-dist.mjs my-app dist
//
// Files are passed by path, not by content, so a large bundle never travels
// through the conversation.
import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const [appName, dir] = process.argv.slice(2);
if (!appName || !dir) {
  console.error('usage: node deploy-dist.mjs <appName> <dir>');
  process.exit(1);
}
if (!process.env.BACK4APP_ACCOUNT_KEY) {
  console.error('set BACK4APP_ACCOUNT_KEY first');
  process.exit(1);
}

const walk = (root, base = root) =>
  readdirSync(root).flatMap((entry) => {
    const full = join(root, entry);
    return statSync(full).isDirectory() ? walk(full, base) : [full];
  });

const srv = spawn('npx', ['-y', '@back4app/mcp-server-back4app@latest',
  '--account-key', process.env.BACK4APP_ACCOUNT_KEY], { stdio: ['pipe', 'pipe', 'pipe'] });

let buf = '';
const pending = new Map();
srv.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  }
});
srv.stderr.on('data', (d) => {
  const s = d.toString();
  if (!/Amplitude/.test(s)) process.stderr.write(s);
});

let id = 0;
const send = (method, params) => new Promise((r) => {
  const n = ++id;
  pending.set(n, r);
  srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: n, method, params }) + '\n');
});
const call = async (name, args) => {
  const t = Date.now();
  const res = await send('tools/call', { name, arguments: args });
  return { ms: Date.now() - t, text: res.result?.content?.[0]?.text ?? JSON.stringify(res.error) };
};

await send('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'deploy-dist', version: '1.0.0' },
});
srv.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} }) + '\n');

const apps = JSON.parse((await call('get_parse_apps', {})).text);
const app = apps.find((a) => a.appName === appName);
if (!app) {
  console.error(`app "${appName}" not found on this account`);
  process.exit(1);
}

const root = resolve(dir);
const files = walk(root).map((f) => ({ path: relative(root, f), localPath: f }));
console.log(`deploying ${files.length} file(s) from ${dir} to ${appName}`);

const deploy = await call('deploy_web_hosting_files', {
  applicationId: app.applicationId,
  files,
  description: `deploy-dist: ${dir}`,
});
console.log(`deploy_web_hosting_files -> ${deploy.ms}ms`);
console.log(deploy.text);

const activate = await call('activate_web_hosting', {
  applicationId: app.applicationId,
  masterKey: app.masterKey,
});
console.log(`activate_web_hosting -> ${activate.ms}ms`);
console.log(activate.text);

srv.kill();
process.exit(0);
