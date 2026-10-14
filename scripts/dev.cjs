/* global __dirname */
const { spawn } = require('node:child_process');
const path = require('node:path');
const children = [
  spawn(process.execPath, ['--experimental-strip-types', '--env-file-if-exists=.env.local', path.join(__dirname, '../server/index.ts')], { stdio: 'inherit', windowsHide: true }),
  spawn(process.execPath, [path.join(__dirname, 'expo.cjs'), 'start', ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true }),
];
let stopped = false;
function stop(code = 0) { if (stopped) return; stopped = true; for (const child of children) child.kill(); process.exitCode = code; }
for (const child of children) { child.on('exit', code => stop(code ?? 0)); child.on('error', error => { console.error(error.message); stop(1); }); }
process.on('SIGINT', () => stop()); process.on('SIGTERM', () => stop());
