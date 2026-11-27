/**
 * Client half of the pet-cat decoration.
 *
 * A frameless, transparent cat window on the click-through `shell.overlay` slot.
 * The iframe is cropped to the cat's idle bounding box (no empty window around
 * it). There are no visible controls: press and hold the cat briefly, then move,
 * to drag the window; keep holding without moving to open the cat picker. A
 * quick stroke still pets the cat. The bundled page reports those gestures over
 * postMessage.
 */
window.__ModuleLoader__.load({
  id: 'dsh-pet-cat',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React

    const STORAGE_POS = 'dsh-pet-cat:pos'
    const STORAGE_OPEN = 'dsh-pet-cat:open'
    const STORAGE_CAT = 'dsh-pet-cat:catsize'
    const PAGE = { width: 360, height: 420 }
    // Crop of PAGE that contains the cat (measured from the rendered page).
    const CROP = { x: 2, y: 90, width: 322, height: 180 }
    const LOCAL = '/api/pet-cat/site'
    const MENU_WIDTH = 250
    const MENU_MAX = 300

    const CAT_LABELS = {
      kuro: '黑猫',
      mugi: '茶虎',
      hana: '三花',
      shiro: '白猫',
      saba: '鲭虎',
      sabi: '玳瑁',
      hachi: '八割',
      gray: '灰猫',
      kiji: '狸花',
      siam: '暹罗',
      ragdoll: '布偶',
      siberian: '西伯利亚',
      norwegian: '挪威森林',
      sphynx: '无毛猫',
    }

    const STYLE = `
      .dsh-pet-cat{position:fixed;z-index:60;pointer-events:auto;background:transparent;border:0;box-shadow:none}
      .dsh-pet-cat-clip{position:absolute;inset:0;overflow:hidden;border-radius:12px;pointer-events:auto}
      .dsh-pet-cat-frame{position:absolute;border:0;display:block;background:transparent}
      .dsh-pet-cat-menu{position:fixed;z-index:61;width:250px;max-height:300px;overflow-y:auto;overflow-x:hidden;display:grid;grid-template-columns:1fr 1fr;gap:2px;padding:2px;background:transparent;border:0;box-shadow:none;pointer-events:auto;scrollbar-width:thin;scrollbar-color:rgba(69,51,39,.35) transparent}
      .dsh-pet-cat-menu::-webkit-scrollbar{width:6px}
      .dsh-pet-cat-menu::-webkit-scrollbar-thumb{background:rgba(69,51,39,.35);border-radius:3px}
      .dsh-pet-cat-item{display:flex;align-items:center;gap:4px;padding:2px 4px;border-radius:7px;border:1px solid rgba(69,51,39,.12);background:rgba(251,245,236,.86);backdrop-filter:blur(4px);cursor:pointer;font-size:10px;line-height:1.2;color:#413024;text-align:left;white-space:nowrap;overflow:hidden}
      .dsh-pet-cat-item:hover{background:rgba(255,255,255,.96)}
      .dsh-pet-cat-item[data-active=true]{border-color:#925b36;background:rgba(146,91,54,.16)}
      .dsh-pet-cat-swatch{width:14px;height:14px;border-radius:50%;flex:none;background-color:#e3d9ca;background-repeat:no-repeat;border:1px solid rgba(69,51,39,.15)}
      .dsh-pet-cat-foot{grid-column:1 / -1;display:flex;gap:4px;padding-top:2px}
      .dsh-pet-cat-foot button{flex:1;border:0;border-radius:7px;padding:3px;background:rgba(251,245,236,.86);color:#413024;font-size:10px;cursor:pointer;backdrop-filter:blur(4px)}
      .dsh-pet-cat-foot button:hover{background:rgba(255,255,255,.98)}
      .dsh-pet-cat-launch{position:fixed;z-index:60;right:14px;bottom:14px;width:42px;height:42px;border-radius:50%;border:1px solid rgba(69,51,39,.25);background:#fbf5ec;font-size:21px;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.25);pointer-events:auto}
      .dsh-pet-cat-launch:hover{transform:scale(1.06)}
    `

    function readJson(key, fallback) {
      try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : fallback
      } catch {
        return fallback
      }
    }

    function readNumber(key, fallback) {
      try {
        const raw = localStorage.getItem(key)
        const value = raw === null ? NaN : Number(raw)
        return Number.isFinite(value) ? value : fallback
      } catch {
        return fallback
      }
    }

    function readBool(key, fallback) {
      try {
        const raw = localStorage.getItem(key)
        return raw === null ? fallback : raw === '1'
      } catch {
        return fallback
      }
    }

    function defaultPos() {
      return {
        x: Math.max(8, window.innerWidth - CROP.width - 18),
        y: Math.max(8, window.innerHeight - CROP.height - 18),
      }
    }

    function clampPos(pos) {
      return {
        x: Math.min(Math.max(4, pos.x), Math.max(4, window.innerWidth - CROP.width - 4)),
        y: Math.min(Math.max(4, pos.y), Math.max(4, window.innerHeight - CROP.height - 4)),
      }
    }

    function PetCat() {
      const [open, setOpen] = useState(() => readBool(STORAGE_OPEN, true))
      const [pos, setPos] = useState(() => {
        const stored = readJson(STORAGE_POS, null)
        return clampPos(stored && Number.isFinite(stored.x) && Number.isFinite(stored.y) ? stored : defaultPos())
      })
      const [menu, setMenu] = useState(false)
      const [cats, setCats] = useState([])
      const [current, setCurrent] = useState('')
      const [catSize] = useState(() => readNumber(STORAGE_CAT, 4))
      const frameRef = useRef(null)

      useEffect(() => {
        const onResize = () => setPos((currentPos) => clampPos(currentPos))
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
      }, [])

      useEffect(() => {
        try {
          localStorage.setItem(STORAGE_OPEN, open ? '1' : '0')
        } catch {
          /* ignore */
        }
      }, [open])

      const readCats = useCallback(() => {
        const frame = frameRef.current
        const doc = frame && frame.contentDocument
        if (!doc) return
        const next = []
        for (const button of doc.querySelectorAll('.choices button[data-cat]')) {
          const coat = button.querySelector('.coat')
          const style = coat ? getComputedStyle(coat) : null
          next.push({
            key: button.getAttribute('data-cat'),
            label:
              CAT_LABELS[button.getAttribute('data-cat')] ||
              button.getAttribute('aria-label') ||
              button.getAttribute('data-cat'),
            swatch: style
              ? {
                  image: style.backgroundImage,
                  size: style.backgroundSize,
                  position: style.backgroundPosition,
                }
              : null,
          })
          if (button.getAttribute('aria-pressed') === 'true') setCurrent(button.getAttribute('data-cat'))
        }
        if (next.length) setCats(next)
      }, [])

      const applyCatSize = useCallback((value) => {
        const frame = frameRef.current
        const doc = frame && frame.contentDocument
        const input = doc && doc.getElementById('cat-size')
        if (!input) return
        input.value = String(value)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      }, [])

      useEffect(() => {
        const onMessage = (event) => {
          const frame = frameRef.current
          if (!frame || event.source !== frame.contentWindow) return
          const data = event.data || {}
          if (data.type === 'pet-cat-drag' && Number.isFinite(data.dx) && Number.isFinite(data.dy)) {
            setPos((currentPos) => clampPos({ x: currentPos.x + data.dx, y: currentPos.y + data.dy }))
          } else if (data.type === 'pet-cat-menu') {
            readCats()
            setMenu((value) => !value)
          }
        }
        window.addEventListener('message', onMessage)
        return () => window.removeEventListener('message', onMessage)
      }, [readCats])

      useEffect(() => {
        if (!menu) return undefined
        const onKey = (event) => {
          if (event.key === 'Escape') setMenu(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [menu])

      const chooseCat = (key) => {
        const frame = frameRef.current
        const doc = frame && frame.contentDocument
        const button = doc && doc.querySelector(`.choices button[data-cat="${key}"]`)
        if (button) {
          button.click()
          setCurrent(key)
        }
        setMenu(false)
      }

      const panel = h(
        'div',
        {
          className: 'dsh-pet-cat',
          style: { left: pos.x, top: pos.y, width: CROP.width, height: CROP.height },
          'data-dsh-pet-cat': 'panel',
        },
        h(
          'div',
          { className: 'dsh-pet-cat-clip' },
          h('iframe', {
            ref: frameRef,
            className: 'dsh-pet-cat-frame',
            src: LOCAL,
            title: 'pet the cat',
            allow: 'autoplay',
            style: { width: PAGE.width, height: PAGE.height, left: -CROP.x, top: -CROP.y },
            onLoad: () => {
              readCats()
              applyCatSize(catSize)
            },
          }),
        ),
      )

      const menuHeight = Math.min(MENU_MAX, Math.max(120, window.innerHeight - 16))
      const menuLeft = Math.min(Math.max(8, pos.x), Math.max(8, window.innerWidth - MENU_WIDTH - 8))
      let menuTop = pos.y + CROP.height + 8
      if (menuTop + menuHeight > window.innerHeight - 8) {
        menuTop = Math.max(8, pos.y - menuHeight - 8)
      }

      const menuPanel =
        open && menu && cats.length
          ? h(
              'div',
              {
                className: 'dsh-pet-cat-menu',
                style: { left: menuLeft, top: menuTop, maxHeight: menuHeight },
              },
              cats.map((cat) =>
                h(
                  'button',
                  {
                    key: cat.key,
                    className: 'dsh-pet-cat-item',
                    'data-active': cat.key === current ? 'true' : 'false',
                    onClick: () => chooseCat(cat.key),
                  },
                  h('span', {
                    className: 'dsh-pet-cat-swatch',
                    style: cat.swatch
                      ? {
                          backgroundImage: cat.swatch.image,
                          backgroundSize: cat.swatch.size,
                          backgroundPosition: cat.swatch.position,
                        }
                      : undefined,
                  }),
                  h('span', null, cat.label),
                ),
              ),
              h(
                'div',
                { className: 'dsh-pet-cat-foot' },
                h(
                  'button',
                  {
                    onClick: () => {
                      if (frameRef.current) frameRef.current.src = LOCAL
                      setMenu(false)
                    },
                  },
                  '重载',
                ),
                h('button', { onClick: () => { setOpen(false); setMenu(false) } }, '收起'),
              ),
            )
          : null

      const launcher = h(
        'button',
        {
          className: 'dsh-pet-cat-launch',
          title: '猫猫',
          onClick: () => setOpen(true),
          'data-dsh-pet-cat': 'launcher',
        },
        '🐱',
      )

      return h(
        React.Fragment,
        null,
        h('style', null, STYLE),
        open ? panel : launcher,
        menuPanel,
      )
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.effect(
          () => ctx.slots.register({ name: 'shell.overlay', id: 'dsh-pet-cat:overlay' }, PetCat),
          'pet-cat: floating cat',
        )
      },
    }
  },
})
