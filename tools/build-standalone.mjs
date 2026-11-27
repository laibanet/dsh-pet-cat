/**
 * Build the standalone (non-DSH) copy of the cat page.
 *
 * Unlike the DSH window this keeps the page's own toolbar (cat picker, size,
 * sound, fullscreen) and a paper background, because there is no DSH overlay to
 * host those controls. The room and shadow are still removed.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(here, '..')
const source = readFileSync(path.join(root, 'site', 'page.html'), 'utf8')
const app = readFileSync(path.join(root, 'site', 'app.js'), 'utf8')
const directory = JSON.parse(readFileSync(path.join(root, 'site', 'directory.json'), 'utf8'))
const photos = readFileSync(path.join(root, 'site', 'photos.bin'))
const base64 = photos.toString('base64')

const styleEnd = source.indexOf('</style>') + 8
const headStyles = source.slice(0, styleEnd)
const body = source.slice(styleEnd)

const standaloneCss = `<style id="dsh-standalone">
html,body{background:#fbf5ec!important}
#stage{background:transparent!important}
footer.profile{display:none!important}
</style>`

const guard = `<script>
window.addEventListener('error', function (event) {
  var box = document.createElement('pre')
  box.id = 'dsh-error'
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9;background:#fff;color:#900;font:11px monospace;padding:8px;max-width:90%;white-space:pre-wrap'
  box.textContent = 'ERROR: ' + (event.message || event.error)
  document.body.appendChild(box)
})
</script>`

const data =
  '<script>window.__PET_CAT__={photos:(function(){var s=atob("' +
  base64 +
  '");var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u})(),directory:' +
  JSON.stringify(directory) +
  '}</script>'

const page =
  '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>猫猫</title>\n' +
  guard +
  '\n' +
  headStyles +
  '\n' +
  standaloneCss +
  '\n</head>\n<body>\n' +
  body +
  '\n' +
  data +
  '\n<script>\n' +
  app +
  '\n</script>\n</body>\n</html>\n'

mkdirSync(path.join(root, 'standalone'), { recursive: true })
writeFileSync(path.join(root, 'standalone', 'pet-cat.html'), page)
console.log('wrote standalone/pet-cat.html', page.length, 'bytes')
