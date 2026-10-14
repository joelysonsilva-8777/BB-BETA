/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');

// Scope test and browser caches to this project, as with the Expo launcher.
const temporaryDirectory = path.resolve(__dirname, '../.cache/tmp');
fs.mkdirSync(temporaryDirectory, { recursive: true });
process.env.TEMP = temporaryDirectory;
process.env.TMP = temporaryDirectory;
process.env.TMPDIR = temporaryDirectory;
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.resolve(__dirname, '../.cache/browsers');

require(path.join(path.dirname(require.resolve('@playwright/test/package.json')), 'cli.js'));
