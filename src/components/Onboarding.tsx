import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useCascade } from '../store.ts'

const NARROW = '(max-width: 639px)'

type TourStep = {
  id: string
  title: string
  body: string
  target?: string
  wide?: string
  menu?: boolean
  action?: 'step' | 'menu'
}

const STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Каскад по шагам',
    body: 'Здесь видно, почему у элемента победило именно это значение. Сейчас пройдём по экрану и сделаем один шаг руками.',
  },
  {
    id: 'example',
    title: 'Пример',
    target: '.header-field-example',
    menu: true,
    body: 'Сто готовых ситуаций, от новичка до собеседования. Уровень сужает список. Код можно поменять — разбор пересчитается.',
  },
  {
    id: 'editor',
    title: 'Редактор',
    target: '.zone-editor',
    body: 'Слева HTML, справа CSS. Над селектором его вес: id, классы, теги.',
  },
  {
    id: 'check',
    title: 'Галочка свойства',
    target: '.editor-block-css .prop-check',
    body: 'Включённое свойство идёт в прогон. Снятое в шаги не входит, но его значение сразу видно на элементе.',
  },
  {
    id: 'step',
    title: 'Сделайте шаг',
    target: '.run-controls .toolbar-btn-run',
    action: 'step',
    body: 'Нажмите «Шаг». Каскад покажет первое сравнение. «Запуск» пройдёт остальные сам, «Сброс» вернёт к началу.',
  },
  {
    id: 'tape',
    title: 'Шаг каскада',
    target: '.zone-tape',
    body: 'Текст объясняет, что сравнивается и кто выбыл. Нажмите любой пункт, чтобы перейти к нему.',
  },
  {
    id: 'element',
    title: 'Элемент',
    target: '.zone-element',
    body: 'Это узел, для которого считается каскад. Пока свойство в прогоне, его значение появляется здесь по шагам.',
  },
  {
    id: 'candidates',
    title: 'Претенденты',
    target: '.zone-candidates',
    body: 'Объявления, которые попали в элемент и спорят за одно свойство. У каждого вес и причина, если оно уже выбыло.',
  },
  {
    id: 'sheet',
    title: 'Шпаргалка',
    target: '.header-menu .header-sheet-btn',
    wide: '.header-bar-action.header-sheet-btn',
    menu: true,
    body: 'Вес селектора, !important и слои @layer лежат здесь, если правило нужно вспомнить.',
  },
]

function buildSteps(narrow: boolean) {
  const steps: TourStep[] = []
  for (const step of STEPS) {
    if (narrow && step.menu) {
      steps.push({
        id: `${step.id}-menu`,
        title: 'Откройте меню',
        body: 'На телефоне эта кнопка спрятана под бургером. Нажмите его.',
        target: '.header-burger',
        action: 'menu',
      })
    }
    steps.push(!narrow && step.wide ? { ...step, target: step.wide } : step)
  }
  return steps
}

type Box = { top: number; left: number; width: number; height: number }

function targetSelector(step: TourStep) {
  return step.target
}

function measure(selector: string | undefined): Box | null {
  if (!selector) return null
  const node = document.querySelector(selector)
  if (!(node instanceof HTMLElement)) return null
  const rect = node.getBoundingClientRect()
  if (rect.width < 2 || rect.height < 2) return null
  const pad = 6
  return {
    top: Math.max(0, rect.top - pad),
    left: Math.max(0, rect.left - pad),
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
  }
}

function sameBox(left: Box | null, right: Box | null) {
  if (left === right) return true
  if (!left || !right) return false
  return left.top === right.top && left.left === right.left && left.width === right.width && left.height === right.height
}

function placeCard(hole: Box | null, card: { width: number; height: number }) {
  const margin = 12
  const width = Math.min(360, window.innerWidth - margin * 2)
  if (!hole) {
    return {
      top: Math.max(margin, (window.innerHeight - card.height) / 2),
      left: Math.max(margin, (window.innerWidth - width) / 2),
      width,
    }
  }
  const gap = 14
  let left = hole.left
  if (left + width > window.innerWidth - margin) left = window.innerWidth - width - margin
  if (left < margin) left = margin
  let top = hole.top + hole.height + gap
  if (top + card.height > window.innerHeight - margin) top = hole.top - gap - card.height
  const overlaps = top < hole.top + hole.height && top + card.height > hole.top && left < hole.left + hole.width && left + width > hole.left
  if (overlaps || top < margin) {
    const side = hole.left - gap - width
    if (side >= margin) left = side
    else left = Math.min(window.innerWidth - width - margin, hole.left + hole.width + gap)
    top = Math.min(Math.max(margin, hole.top), Math.max(margin, window.innerHeight - card.height - margin))
  }
  return { top, left, width }
}

export function Onboarding({ onClose }: { onClose: () => void }) {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches)
  const [menuOpen, setMenuOpen] = useState(false)
  const [at, setAt] = useState(0)
  const [hole, setHole] = useState<Box | null>(null)
  const [cardSize, setCardSize] = useState({ width: 360, height: 220 })
  const [armed, setArmed] = useState(false)
  const index = useCascade((state) => state.index)
  const baseline = useRef(0)
  const direction = useRef<'forward' | 'back'>('forward')
  const cardRef = useRef<HTMLDivElement>(null)
  const steps = useMemo(() => buildSteps(narrow), [narrow])
  const step = steps[Math.min(at, steps.length - 1)]
  const last = at >= steps.length - 1
  const stepped = armed && index > baseline.current
  const canNext = step.action === 'step' ? stepped : step.action === 'menu' ? menuOpen : true

  function go(next: number) {
    direction.current = next > at ? 'forward' : 'back'
    setAt(next)
  }

  useEffect(() => {
    if (step.action !== 'step') {
      setArmed(false)
      return
    }
    const state = useCascade.getState()
    if (state.steps.length > 0 && state.index >= state.steps.length - 1) {
      state.reset()
      baseline.current = -1
    } else {
      baseline.current = state.index
    }
    setArmed(true)
  }, [step.id, step.action])

  useEffect(() => {
    const media = window.matchMedia(NARROW)
    const onChange = () => setNarrow(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const node = document.querySelector('.header-menu')
    if (!node) return
    const sync = () => setMenuOpen(node.classList.contains('is-open'))
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(node, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (step.action !== 'menu' || !menuOpen || direction.current === 'back') return
    go(Math.min(at + 1, steps.length - 1))
  }, [menuOpen, step.action, step.id, at, steps.length])

  useLayoutEffect(() => {
    const selector = targetSelector(step)
    const node = selector ? document.querySelector(selector) : null
    if (node instanceof HTMLElement) node.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    let frame = 0
    const place = () => {
      const next = measure(targetSelector(step))
      setHole((current) => (sameBox(current, next) ? current : next))
      const card = cardRef.current
      if (!card) return
      const box = card.getBoundingClientRect()
      const width = Math.round(box.width)
      const height = Math.round(box.height)
      setCardSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    }
    place()
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        place()
      })
    }
    window.addEventListener('resize', place)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [step])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const spot = placeCard(hole, cardSize)
  const cardStyle = { top: spot.top, left: spot.left, width: spot.width } as CSSProperties

  return (
    <div className="tour">
      {hole ? (
        <>
          <div className="tour-shade" style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div className="tour-shade" style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className="tour-shade" style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div className="tour-shade" style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div className="tour-ring" style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }} />
        </>
      ) : (
        <div className="tour-shade" style={{ inset: 0 }} />
      )}
      <div
        ref={cardRef}
        className="tour-card"
        role="dialog"
        aria-labelledby="tour-title"
        style={cardStyle}
      >
        <p className="tour-progress">
          {Math.min(at, steps.length - 1) + 1} из {steps.length}
        </p>
        <h2 id="tour-title">{step.title}</h2>
        <p>{step.action === 'step' && stepped ? 'Первый шаг на ленте. Можно идти дальше.' : step.body}</p>
        <div className="tour-actions">
          <button type="button" className="tour-skip" onClick={onClose}>
            Пропустить
          </button>
          <span className="tour-nav">
            {at > 0 ? (
              <button type="button" className="toolbar-btn" onClick={() => go(at - 1)}>
                Назад
              </button>
            ) : null}
            <button
              type="button"
              className="toolbar-btn toolbar-btn-run"
              disabled={!canNext}
              onClick={() => (last ? onClose() : go(at + 1))}
            >
              {step.action === 'menu' && !menuOpen ? 'Откройте меню' : step.action === 'step' && !stepped ? 'Нажмите Шаг' : last ? 'Понятно' : 'Дальше'}
            </button>
          </span>
        </div>
      </div>
    </div>
  )
}

export const ONBOARDING_KEY = 'grasp-cascade-onboarding'
