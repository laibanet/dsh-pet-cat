/**
 * Build the standalone (non-DSH) copy of the cat page.
 *
 * It is the same self-contained page as site/index.html, with a paper
 * background instead of transparency, and is meant to be opened by
 * standalone/start.cmd in a Chrome/Edge app window (a separate process from
 * DSH, so it survives DSH being minimized, moved or closed).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const page = readFileSync(path.join(root, 'site', 'index.html'), 'utf8')
const withBackground = page.replace(
  '</head>',
  '<style>html,body{background:#fbf5ec!important}</style>\n</head>',
)
mkdirSync(path.join(root, 'standalone'), { recursive: true })
writeFileSync(path.join(root, 'standalone', 'pet-cat.html'), withBackground)
console.log('wrote standalone/pet-cat.html', withBackground.length, 'bytes')
