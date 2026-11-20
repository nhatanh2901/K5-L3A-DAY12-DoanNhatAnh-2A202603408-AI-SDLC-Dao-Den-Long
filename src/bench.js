// Kept as a public package entry; actual frame timing happens in Chromium/WebGL.
process.argv.splice(2,0,'--mode','bench');
await import('../scripts/browser.mjs');
