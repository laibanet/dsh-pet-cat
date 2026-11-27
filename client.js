/**
 * Client half of the pet-cat decoration.
 *
 * A frameless, resizable window on the click-through `shell.overlay` slot that
 * shows only the cat: the room and contact shadow are removed inside the
 * bundled page, so the transparent canvas floats over DSH. A hover toolbar
 * drags the window, opens the cat picker and a cat-size slider; the bottom-right
 * corner resizes the window.
 */
window.__ModuleLoader__.load({
  id: 'dsh-pet-cat',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useRef, useState } = React

    const STORAGE_POS = 'dsh-pet-cat:pos'
    const STORAGE_SIZE = 'dsh-pet-cat:size'
    const STORAGE_OPEN = 'dsh-pet-cat:open'
    const STORAGE_CAT = 'dsh-pet-cat:catsize'
    const MIN = { width: 240, height: 200 }
    const MAX = { width: 720, height: 600 }
    const DEFAULT = { width: 360, height: 420 }
    const LOCAL = '/api/pet-cat/site'

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

    const GEAR = h(
      'svg',
      { viewBox: '0 0 24 24', width: 13, height: 13, 'aria-hidden': true, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 },
      h('circle', { cx: 12, cy: 12, r: 3.4 }),
      h('path', { d: 'M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1' }),
    )

    const STYLE = `
      .dsh-pet-cat{position:fixed;z-index:60;pointer-events:auto;border-radius:16px;overflow:hidden;background:transparent;border:0;box-shadow:none}
      .dsh-pet-cat-frame{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:transparent}
      .dsh-pet-cat-tools{position:absolute;top:6px;right:6px;display:flex;gap:4px;pointer-events:none;opacity:0;transition:opacity .15s}
      .dsh-pet-cat-grip{position:absolute;top:6px;left:6px;pointer-events:auto;cursor:grab;width:24px;height:16px;border-radius:9px;background:rgba(69,51,39,.18);display:flex;align-items:center;justify-content:center;color:rgba(69,51,39,.85);font-size:10px;line-height:1;user-select:none;opacity:0;transition:opacity .15s}
      .dsh-pet-cat:hover .dsh-pet-cat-tools,.dsh-pet-cat:hover .dsh-pet-cat-grip,.dsh-pet-cat:focus-within .dsh-pet-cat-tools,.dsh-pet-cat:focus-within .dsh-pet-cat-grip{opacity:1}
      .dsh-pet-cat-grip:active{cursor:grabbing}
      .dsh-pet-cat-btn{pointer-events:auto;border:0;width:26px;height:26px;border-radius:50%;background:rgba(69,51,39,.16);color:#413024;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:13px;line-height:1}
      .dsh-pet-cat-btn:hover{background:rgba(69,51,39,.3)}
      .dsh-pet-cat-resize{position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:nwse-resize;opacity:0;transition:opacity .15s;background:linear-gradient(135deg,transparent 50%,rgba(69,51,39,.35) 50%);border-bottom-right-radius:16px}
      .dsh-pet-cat:hover .dsh-pet-cat-resize{opacity:1}
      .dsh-pet-cat-menu{position:absolute;top:38px;right:6px;width:230px;max-height:280px;overflow:auto;border-radius:12px;background:rgba(251,245,236,.97);backdrop-filter:blur(8px);box-shadow:0 12px 32px rgba(0,0,0,.28);border:1px solid rgba(69,51,39,.12);padding:6px;display:grid;grid-template-columns:1fr 1fr;gap:4px;pointer-events:auto}
      .dsh-pet-cat-item{display:flex;align-items:center;gap:6px;padding:5px 6px;border-radius:8px;border:1px solid transparent;background:transparent;cursor:pointer;font-size:11px;color:#413024;text-align:left}
      .dsh-pet-cat-item:hover{background:rgba(69,51,39,.08)}
      .dsh-pet-cat-item[data-active=true]{border-color:#925b36;background:rgba(146,91,54,.1)}
      .dsh-pet-cat-swatch{width:18px;height:18px;border-radius:50%;flex:none;background-color:#e3d9ca;background-repeat:no-repeat;border:1px solid rgba(69,51,39,.15)}
      .dsh-pet-cat-range{grid-column:1 / -1;display:flex;align-items:center;gap:8px;padding:6px;font-size:11px;color:#413024}
      .dsh-pet-cat-range input{flex:1;accent-color:#925b36}
      .dsh-pet-cat-foot{grid-column:1 / -1;display:flex;gap:6px;padding-top:4px;border-top:1px solid rgba(69,51,39,.1);margin-top:4px}
      .dsh-pet-cat-foot button{flex:1;border:0;border-radius:8px;padding:5px;background:rgba(69,51,39,.08);color:#413024;font-size:11px;cursor:pointer}
      .dsh-pet-cat-foot button:hover{background:rgba(69,51,39,.16)}
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

    function clampSize(size) {
      return {
        width: Math.min(MAX.width, Math.max(MIN.width, size.width)),
        height: Math.min(MAX.height, Math.max(MIN.height, size.height)),
      }
    }

    function defaultPos(size) {
      return {
        x: Math.max(8, window.innerWidth - size.width - 18),
        y: Math.max(8, window.innerHeight - size.height - 18),
      }
    }

    function clampPos(pos, size) {
      return {
        x: Math.min(Math.max(4, pos.x), Math.max(4, window.innerWidth - size.width - 4)),
        y: Math.min(Math.max(4, pos.y), Math.max(4, window.innerHeight - size.height - 4)),
      }
    }

    function PetCat() {
      const [open, setOpen] = useState(() => readBool(STORAGE_OPEN, true))
      const [size, setSize] = useState(() => {
        const stored = readJson(STORAGE_SIZE, null)
        return stored && Number.isFinite(stored.width) && Number.isFinite(stored.height) ? clampSize(stored) : DEFAULT
      })
      const [pos, setPos] = useState(() => {
        const stored = readJson(STORAGE_POS, null)
        const initial = readJson(STORAGE_SIZE, null)
        const initialSize = initial && Number.isFinite(initial.width) ? clampSize(initial) : DEFAULT
        return clampPos(
          stored && Number.isFinite(stored.x) && Number.isFinite(stored.y) ? stored : defaultPos(initialSize),
          initialSize,
        )
      })
      const [menu, setMenu] = useState(false)
      const [cats, setCats] = useState([])
      const [current, setCurrent] = useState('')
      const [catSize, setCatSize] = useState(() => readNumber(STORAGE_CAT, 4))
      const frameRef = useRef(null)
      const posRef = useRef(pos)
      const sizeRef = useRef(size)
      const dragRef = useRef(null)
      const resizeRef = useRef(null)
      posRef.current = pos
      sizeRef.current = size

      useEffect(() => {
        const onResize = () => {
          setSize((currentSize) => {
            const next = clampSize(currentSize)
            setPos((currentPos) => clampPos(currentPos, next))
            return next
          })
        }
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

      useEffect(() => {
        const onMove = (event) => {
          const drag = dragRef.current
          if (drag && drag.active) {
            drag.latest = clampPos({ x: event.clientX - drag.offsetX, y: event.clientY - drag.offsetY }, sizeRef.current)
            setPos(drag.latest)
            return
          }
          const grip = resizeRef.current
          if (grip && grip.active) {
            const next = clampSize({
              width: grip.width + (event.clientX - grip.x),
              height: grip.height + (event.clientY - grip.y),
            })
            setSize(next)
          }
        }
        const onUp = () => {
          const drag = dragRef.current
          if (drag && drag.active) {
            drag.active = false
            try {
              localStorage.setItem(STORAGE_POS, JSON.stringify(drag.latest || posRef.current))
            } catch {
              /* ignore */
            }
          }
          const grip = resizeRef.current
          if (grip && grip.active) {
            grip.active = false
            try {
              localStorage.setItem(STORAGE_SIZE, JSON.stringify(sizeRef.current))
            } catch {
              /* ignore */
            }
          }
        }
        window.addEventListener('pointermove', onMove)
        window.addEventListener('pointerup', onUp)
        window.addEventListener('pointercancel', onUp)
        return () => {
          window.removeEventListener('pointermove', onMove)
          window.removeEventListener('pointerup', onUp)
          window.removeEventListener('pointercancel', onUp)
        }
      }, [])

      useEffect(() => {
        const frame = frameRef.current
        if (!frame || !frame.contentWindow) return undefined
        const timer = setTimeout(() => {
          try {
            frame.contentWindow.dispatchEvent(new Event('resize'))
          } catch {
            /* ignore */
          }
        }, 60)
        return () => clearTimeout(timer)
      }, [size.width, size.height])

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

      const onDragStart = (event) => {
        if (event.button !== 0) return
        const panel = event.currentTarget.closest('.dsh-pet-cat')
        if (!panel) return
        const rect = panel.getBoundingClientRect()
        dragRef.current = {
          active: true,
          offsetX: event.clientX - rect.left,
          offsetY: event.clientY - rect.top,
          latest: { x: rect.left, y: rect.top },
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      const onResizeStart = (event) => {
        if (event.button !== 0) return
        event.stopPropagation()
        resizeRef.current = {
          active: true,
          x: event.clientX,
          y: event.clientY,
          width: sizeRef.current.width,
          height: sizeRef.current.height,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
      }

      const panel = h(
        'div',
        {
          className: 'dsh-pet-cat',
          style: { left: pos.x, top: pos.y, width: size.width, height: size.height },
          'data-dsh-pet-cat': 'panel',
        },
        h('iframe', {
          ref: frameRef,
          className: 'dsh-pet-cat-frame',
          src: LOCAL,
          title: 'pet the cat',
          allow: 'autoplay',
          onLoad: () => {
            readCats()
            applyCatSize(catSize)
          },
        }),
        h('div', { className: 'dsh-pet-cat-grip', title: '拖动', onPointerDown: onDragStart }, '⠿'),
        h(
          'div',
          { className: 'dsh-pet-cat-tools' },
          h(
            'button',
            {
              className: 'dsh-pet-cat-btn',
              title: '收起',
              onClick: () => setOpen(false),
              onPointerDown: (event) => event.stopPropagation(),
            },
            '—',
          ),
          h(
            'button',
            {
              className: 'dsh-pet-cat-btn',
              title: '选择猫猫 / 大小',
              onClick: (event) => {
                event.stopPropagation()
                readCats()
                setMenu((value) => !value)
              },
              onPointerDown: (event) => event.stopPropagation(),
            },
            GEAR,
          ),
        ),
        menu
          ? h(
              'div',
              { className: 'dsh-pet-cat-menu' },
              cats.length ? cats.map((cat) =>
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
              ) : h('div', { className: 'dsh-pet-cat-range' }, '正在加载…'),
              h(
                'div',
                { className: 'dsh-pet-cat-range' },
                h('span', null, '大小'),
                h('input', {
                  type: 'range',
                  min: 0,
                  max: 10,
                  step: 1,
                  value: catSize,
                  onChange: (event) => {
                    const value = Number(event.target.value)
                    setCatSize(value)
                    applyCatSize(value)
                    try {
                      localStorage.setItem(STORAGE_CAT, String(value))
                    } catch {
                      /* ignore */
                    }
                  },
                }),
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
                h('button', { onClick: () => setOpen(false) }, '收起'),
              ),
            )
          : null,
        h('div', { className: 'dsh-pet-cat-resize', title: '调整大小', onPointerDown: onResizeStart }),
      )

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

      return h(React.Fragment, null, h('style', null, STYLE), open ? panel : launcher)
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
