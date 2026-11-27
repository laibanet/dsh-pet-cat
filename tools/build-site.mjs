/**
 * Rebuild site/index.html from the unpacked pet-the-cat sources.
 *
 * Sources (all in site/):
 *   page.html       – the original HTML markup + styles (no scripts)
 *   app.js          – the original app, patched for the DSH window
 *   photos.bin      – the concatenated AVIF photo buffer
 *   directory.json  – [offset, length, x, y, w, h, W, H] per asset
 *
 * The build inlines the photo buffer as base64 and appends the app script so
 * the page is one self-contained file (no fetch), which starts synchronously
 * like the original packed page.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const site = path.join(here, '..', 'site')

const source = readFileSync(path.join(site, 'page.html'), 'utf8')
const app = readFileSync(path.join(site, 'app.js'), 'utf8')
const directory = JSON.parse(readFileSync(path.join(site, 'directory.json'), 'utf8'))
const photos = readFileSync(path.join(site, 'photos.bin'))
const base64 = photos.toString('base64')

const styleEnd = source.indexOf('</style>') + 8
const headStyles = source.slice(0, styleEnd)
const body = source.slice(styleEnd)

const embed = `<style id="dsh-embed">
html,body{height:100%!important;width:100%!important;margin:0!important;padding:0!important;overflow:hidden!important;background:transparent!important}
main{display:block!important;height:100%!important;width:100%!important;padding:0!important;margin:0!important;max-width:none!important}
#viewer{height:100%!important;width:100%!important;max-width:none!important;margin:0!important;padding:0!important}
.playfield{display:block!important;height:100%!important}
#stage{width:100%!important;height:100%!important;min-height:0!important;max-height:none!important;aspect-ratio:auto!important;border-radius:0!important;background:transparent!important}
#theme,.toolbar,footer.profile,#retry,.sr{display:none!important}
#notice,#gesture{display:none!important}
</style>`

const guard = `<script>
window.addEventListener('error', (event) => {
  const box = document.createElement('pre')
  box.id = 'dsh-error'
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9;background:#fff;color:#900;font:11px monospace;padding:8px;max-width:90%;white-space:pre-wrap'
  box.textContent = 'ERROR: ' + (event.message || event.error)
  document.body.append(box)
})
window.addEventListener('unhandledrejection', (event) => {
  const box = document.createElement('pre')
  box.id = 'dsh-error'
  box.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9;background:#fff;color:#900;font:11px monospace;padding:8px;max-width:90%;white-space:pre-wrap'
  box.textContent = 'REJECTION: ' + (event.reason && event.reason.stack ? event.reason.stack : event.reason)
  document.body.append(box)
})
if (window.parent !== window) {
  // Tell the DSH half about drags and long-presses. Quick strokes stay with the
  // page (petting); a short hold then move drags; holding still opens the menu.
  const post = (message) => {
    try {
      window.parent.postMessage(message, '*')
    } catch {
      /* ignore */
    }
  }
  let start = null
  let holdTimer = 0
  let menuTimer = 0
  let dragging = false
  let last = null
  const cleanup = () => {
    clearTimeout(holdTimer)
    clearTimeout(menuTimer)
    window.removeEventListener('pointermove', onMove, true)
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onUp, true)
  }
  function onMove(event) {
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (!dragging && Math.hypot(dx, dy) > 6) {
      if (performance.now() - start.t < 300) {
        start = null
        cleanup()
        return
      }
      dragging = true
      last = { x: event.clientX, y: event.clientY }
      clearTimeout(menuTimer)
    }
    if (dragging) {
      event.stopImmediatePropagation()
      event.preventDefault()
      post({ type: 'pet-cat-drag', dx: event.clientX - last.x, dy: event.clientY - last.y })
      last = { x: event.clientX, y: event.clientY }
    }
  }
  function onUp() {
    start = null
    dragging = false
    cleanup()
  }
  window.addEventListener(
    'pointerdown',
    (event) => {
      if (event.button !== 0) return
      start = { x: event.clientX, y: event.clientY, t: performance.now() }
      dragging = false
      holdTimer = setTimeout(() => {
        if (!start || dragging) return
        menuTimer = setTimeout(() => {
          if (start && !dragging) {
            post({ type: 'pet-cat-menu' })
            start = null
            cleanup()
          }
        }, 520)
      }, 320)
      window.addEventListener('pointermove', onMove, true)
      window.addEventListener('pointerup', onUp, true)
      window.addEventListener('pointercancel', onUp, true)
    },
    true,
  )
}
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
  embed +
  '\n</head>\n<body>\n' +
  body +
  '\n' +
  data +
  '\n<script>\n' +
  app +
  '\n</script>\n</body>\n</html>\n'

writeFileSync(path.join(site, 'index.html'), page)
console.log('wrote site/index.html', page.length, 'bytes')
