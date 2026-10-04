/**
 * Rebuilds the Material Symbols Rounded subset font.
 *
 * Scans src/ for MdIcon usages (static name="..." plus dynamic
 * `icon: '...'` literals), then downloads a ligature-accurate subset
 * from the Google Fonts css2 API and overwrites the vendored font at
 * src/assets/fonts/material-symbols-rounded.subset.woff2.
 *
 * Run manually whenever icons are added or removed:  npm run build:icons
 * Requires network access. Behind the mainland-China firewall set the
 * mirror base, e.g.:
 *   ICON_FONT_CSS_BASE=https://fonts.googleapis.cn npm run build:icons
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = join(root, 'src')
const outPath = join(srcDir, 'assets', 'fonts', 'material-symbols-rounded.subset.woff2')
const cssBase = process.env.ICON_FONT_CSS_BASE || 'https://fonts.googleapis.com'

// Modern Chromium UA so the API serves a variable woff2
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

function collectFiles(dir, ext, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) collectFiles(full, ext, acc)
    else if (entry.name.endsWith(ext)) acc.push(full)
  }
  return acc
}

const names = new Set()
for (const file of collectFiles(srcDir, '.vue')) {
  const text = readFileSync(file, 'utf8')
  // Static usage: <MdIcon name="folder_open"> — skip the <slot name="icon"> in MdButton
  for (const m of text.matchAll(/\bname="([a-z_]+)"/g)) {
    if (m[1] !== 'icon') names.add(m[1])
  }
  // Dynamic usage: icon: 'light_mode' in option arrays
  for (const m of text.matchAll(/\bicon:\s*'([a-z_]+)'/g)) {
    names.add(m[1])
  }
}

if (names.size === 0) {
  console.error('No icon names found under src/ — nothing to do.')
  process.exit(1)
}

const iconNames = [...names].sort()
console.log(`Found ${iconNames.length} icons: ${iconNames.join(', ')}`)

const family = 'Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200'
const cssUrl = `${cssBase}/css2?family=${family}&icon_names=${iconNames.join(',')}&display=block`

const cssRes = await fetch(cssUrl, { headers: { 'User-Agent': UA } })
if (!cssRes.ok) {
  console.error(`Font CSS request failed: ${cssRes.status} ${cssRes.statusText}`)
  process.exit(1)
}
const css = await cssRes.text()
const fontUrl = css.match(/url\((https:[^)]+)\)/)?.[1]
if (!fontUrl) {
  console.error('No font URL found in the returned CSS.')
  process.exit(1)
}

const fontRes = await fetch(fontUrl, { headers: { 'User-Agent': UA } })
if (!fontRes.ok) {
  console.error(`Font download failed: ${fontRes.status} ${fontRes.statusText}`)
  process.exit(1)
}
const font = Buffer.from(await fontRes.arrayBuffer())
writeFileSync(outPath, font)
console.log(`Wrote ${outPath} (${(font.length / 1024).toFixed(1)} KB)`)
