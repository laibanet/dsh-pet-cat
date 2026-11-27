/**
 * Host half of the pet-cat bundle.
 *
 * Serves the bundled pet-the-cat page (one self-contained HTML file: the app,
 * its photo buffer and the cat picker) from this package, so the cat runs
 * offline. The page is loaded by the Client half in a transparent floating
 * window; the page itself has no room background and no page chrome.
 */
import { promises as fs } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'pet-cat'
export const inject = ['webServer']

const ROUTE = '/api/pet-cat'
const SITE = fileURLToPath(new URL('./site/index.html', import.meta.url))

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: 'prefix',
        path: ROUTE,
        handler: async (request, response) => {
          const url = new URL(request.url || '/', 'http://localhost')
          if (url.pathname !== '/api/pet-cat/site' && url.pathname !== '/api/pet-cat/') {
            response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
            response.end('not found')
            return
          }
          try {
            const body = await fs.readFile(SITE)
            response.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
            })
            response.end(body)
          } catch {
            response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
            response.end('pet-cat page is missing from the bundle')
          }
        },
      }),
    'pet-cat: local site',
  )
}
