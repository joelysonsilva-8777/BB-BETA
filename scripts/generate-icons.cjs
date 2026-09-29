/* global __dirname */
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const root = path.resolve(__dirname, '..');
  const component = fs.readFileSync(path.join(root, 'src/components/Brand.tsx'), 'utf8');
  const symbol = component.match(/export const BB_SYMBOL = '([^']+)'/)[1];
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  for (const [name, size, transparent, monochrome] of [
    ['icon.png', 1024, false, false], ['favicon.png', 64, false, false],
    ['android-icon-foreground.png', 1024, true, false],
    ['android-icon-monochrome.png', 1024, true, true],
  ]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<body style="margin:0;background:transparent"><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="-7 -7 36.553 36.551">${transparent ? '' : '<path d="M-7-7h36.553v36.551H-7z" fill="#FCFC30"/>'}<path d="${symbol}" transform="translate(0 19.418) scale(1 -1)" fill="${monochrome ? '#FFFFFF' : '#465EFF'}"/></svg></body>`);
    await page.screenshot({ path: path.join(root, 'assets', name), omitBackground: transparent });
  }
  await browser.close();
  console.log('BB icons generated from the vector symbol.');
})().catch(error => { console.error(error); process.exitCode = 1; });
