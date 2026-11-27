#!/bin/sh
# Builds a single self-contained HTML file (dist-artifact/index.html) that runs in
# preview/fallback mode: no Supabase keys, localStorage + local passcode.
# Usage: npm run build:artifact
set -e
cd "$(dirname "$0")/.."
mkdir -p dist-artifact
npx esbuild src/main.jsx --bundle --minify --format=iife --jsx=automatic \
  --define:process.env.NODE_ENV='"production"' --define:import.meta.env='{}' \
  --alias:@supabase/supabase-js=./src/supabase-stub.js \
  --loader:.css=empty --outfile=dist-artifact/app.js --log-level=warning
npx tailwindcss -i src/index.css -o dist-artifact/app.css --minify 2>/dev/null
node -e '
const fs=require("fs");
const css=fs.readFileSync("dist-artifact/app.css","utf8");
const js=fs.readFileSync("dist-artifact/app.js","utf8").replace(/<\/script/gi,"<\\/script");
const html=`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfolio Studio</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap">
<style>${css}</style></head><body><div id="root"></div><script>${js}</script></body></html>`;
fs.writeFileSync("dist-artifact/index.html",html);
console.log("artifact bytes",html.length);'
