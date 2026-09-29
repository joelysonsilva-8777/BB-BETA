const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Keep local package caches and test artifacts outside Metro's file crawl.
const existing = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  /[/\\]\.cache[/\\].*/,
  /[/\\]test-results[/\\].*/,
  /[/\\]playwright-report[/\\].*/,
];

module.exports = config;
