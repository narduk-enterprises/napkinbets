#!/usr/bin/env node
/**
 * Generates a static HTML gallery of all Playwright snapshot images under
 * apps/web/tests/e2e/playwright-snapshots/. Run and open the output file to
 * browse baseline screenshots by feature.
 *
 * Usage: node tools/playwright-snapshot-gallery.mjs
 * Output: apps/web/tests/e2e/playwright-snapshots/gallery.html
 */

import { readdirSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(import.meta.url), '../..')
const SNAPSHOTS_DIR = join(ROOT, 'apps/web/tests/e2e/playwright-snapshots')
const OUT_FILE = join(SNAPSHOTS_DIR, 'gallery.html')

function* walkPng(dir, base = dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory() && e.name !== 'snapshots' && !e.name.startsWith('.')) {
      yield* walkPng(full, base)
    } else if (e.isFile() && e.name.endsWith('.png')) {
      yield relative(base, full)
    }
  }
}

function groupByFeature(paths) {
  const groups = new Map()
  for (const p of paths) {
    const segment = p.split('/')[0]
    if (!groups.has(segment)) groups.set(segment, [])
    groups.get(segment).push(p)
  }
  for (const arr of groups.values()) arr.sort()
  return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]))
}

const paths = [...walkPng(SNAPSHOTS_DIR)].filter((p) => !p.includes('gallery'))
const groups = groupByFeature(paths)

const sections = groups
  .map(
    ([feature, files]) => `
    <section class="feature" id="feature-${feature}">
      <h2>${feature}</h2>
      <div class="grid">
        ${files
          .map(
            (p) => `
          <figure>
            <a href="${p}" target="_blank" rel="noopener">
              <img src="${p}" alt="${p}" loading="lazy" />
            </a>
            <figcaption>${p.split('/').pop()}</figcaption>
          </figure>`,
          )
          .join('')}
      </div>
    </section>`,
  )
  .join('')

const nav = groups.map(([feature]) => ` <a href="#feature-${feature}">${feature}</a>`).join('')

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Playwright snapshot gallery</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem 2rem 2rem; background: #1a1a1a; color: #e5e5e5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .nav { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-bottom: 2rem; }
    .nav a { color: #7dd3fc; text-decoration: none; }
    .nav a:hover { text-decoration: underline; }
    .feature { margin-bottom: 3rem; }
    .feature h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #fbbf24; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }
    figure { margin: 0; }
    figure img { width: 100%; height: auto; display: block; border-radius: 6px; border: 1px solid #404040; }
    figure a { display: block; }
    figcaption { font-size: 0.75rem; color: #a3a3a3; margin-top: 0.25rem; word-break: break-all; }
  </style>
</head>
<body>
  <h1>Playwright snapshot gallery</h1>
  <p class="nav">${nav}</p>
  ${sections}
</body>
</html>
`

writeFileSync(OUT_FILE, html, 'utf8')
console.log('Wrote', OUT_FILE)
