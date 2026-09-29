/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

// Keep this project's temporary files on its own disk, without changing the OS.
const temporaryDirectory = path.resolve(__dirname, '../.cache/tmp');
fs.mkdirSync(temporaryDirectory, { recursive: true });
process.env.TEMP = temporaryDirectory;
process.env.TMP = temporaryDirectory;
process.env.TMPDIR = temporaryDirectory;

require(path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli'));
