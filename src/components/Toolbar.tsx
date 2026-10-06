import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { EXAMPLES, LEVELS } from '../examples.ts'
import type { Level } from '../engine/model.ts'
import { useCascade } from '../store.ts'
import { CheatSheet } from './CheatSheet.tsx'
import { Select } from './Select.tsx'

const LOGO_FROM = '#5eead4'
const LOGO_TO = '#7dd3fc'
const levelOptions = LEVELS.map((item) => ({ value: item.id, label: item.label }))
const levelName = Object.fromEntries(LEVELS.map((item) => [item.id, item.label]))

const LOGO_BARS = ['is-short', 'is-mid', 'is-long']
const LOGO_SHUFFLE_MS = 460

function shuffleSlots(current: number[]) {
  const next = [0, 1, 2]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    const held = next[index]
    next[index] = next[swap]
    next[swap] = held
  }
  if (next.every((slot, index) => slot === current[index])) {
    const held = next[0]
    next[0] = next[1]
    next[1] = held
  }
  return next
}

function Logo() {
  const [order, setOrder] = useState([0, 1, 2])
  const [from, setFrom] = useState(LOGO_FROM)
  const [to, setTo] = useState(LOGO_TO)
  const shuffleTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(shuffleTimer.current), [])

  function onEnter() {
    const hue = Math.floor(Math.random() * 360)
    setFrom(`hsl(${hue} 82% 64%)`)
    setTo(`hsl(${(hue + 36) % 360} 88% 72%)`)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    window.clearTimeout(shuffleTimer.current)
    setOrder((current) => shuffleSlots(current))
    shuffleTimer.current = window.setTimeout(() => setOrder((current) => shuffleSlots(current)), LOGO_SHUFFLE_MS)
  }

  return (
    <span className="logo" onMouseEnter={onEnter}>
      <span className="logo-mark" style={{ '--logo-from': from, '--logo-to': to } as CSSProperties} aria-hidden="true">
        {LOGO_BARS.map((name, index) => (
          <span key={name} className={`logo-bar ${name}`} style={{ '--slot': order[index] } as CSSProperties} />
        ))}
      </span>
      <h1>Grasp Cascade</h1>
    </span>
  )
}

export function Toolbar() {
  const [level, setLevel] = useState<Level | 'all'>('all')
  const [menu, setMenu] = useState(false)
  const [help, setHelp] = useState(false)
  const [sheet, setSheet] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const exampleId = useCascade((state) => state.exampleId)
  const speed = useCascade((state) => state.speed)
  const setExample = useCascade((state) => state.setExample)
  const setSpeed = useCascade((state) => state.setSpeed)
  const matched = useMemo(() => EXAMPLES.find((example) => example.id === exampleId), [exampleId])
  const onLevel = useCallback((value: string) => setLevel(value as Level | 'all'), [])
  const onExample = useCallback(
    (value: string) => {
      if (value !== 'custom') setExample(value)
    },
    [setExample],
  )
  const exampleValue = matched?.id ?? 'custom'
  const exampleOptions = useMemo(() => {
    const visible = EXAMPLES.filter((example) => example.id === matched?.id || level === 'all' || example.level === level)
    return [
      ...(matched ? [] : [{ value: 'custom', label: 'Свой код' }]),
      ...visible.map((example) => ({ value: example.id, label: example.title, group: levelName[example.level] })),
    ]
  }, [matched, level])
  useEffect(() => {
    if (!menu) return
    function onPointer(event: PointerEvent) {
      const node = event.target
      if (!(node instanceof Node)) return
      if (menuRef.current?.contains(node) || burgerRef.current?.contains(node)) return
      if (node instanceof Element && node.closest('.ui-select, .ui-select-menu')) return
      setMenu(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenu(false)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])
  useEffect(() => {
    if (!sheet) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setSheet(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [sheet])

  return (
    <header className="app-header">
      <div className="header-bar">
        <div className="header-brand">
          <Logo />
          <button
            type="button"
            className="header-help"
            aria-expanded={help}
            aria-label="Что это за сервис"
            onClick={() => {
              setMenu(false)
              setSheet(false)
              setHelp((open) => !open)
            }}
          >
            ?
          </button>
        </div>
        <button
          type="button"
          className={`toolbar-btn header-sheet-btn ${sheet ? 'is-open' : ''}`}
          aria-expanded={sheet}
          onClick={() => {
            setHelp(false)
            setMenu(false)
            setSheet((open) => !open)
          }}
        >
          Шпаргалка
        </button>
        <a className="toolbar-btn header-thanks" href="https://pay.cloudtips.ru/p/02f62c5c" target="_blank" rel="noopener noreferrer">
          Сказать спасибо
        </a>
        <button
          ref={burgerRef}
          type="button"
          className={`header-burger ${menu ? 'is-open' : ''}`}
          aria-label="Пример, уровень и интервал"
          aria-expanded={menu}
          onClick={() => {
            setHelp(false)
            setSheet(false)
            setMenu((open) => !open)
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>
        <div className="header-controls">
          <div ref={menuRef} className={`header-menu ${menu ? 'is-open' : ''}`}>
            <div className="header-field header-field-level">
              Уровень
              <Select
                ariaLabel="Уровень"
                className="ui-select-level"
                value={level}
                options={levelOptions}
                onChange={onLevel}
              />
            </div>
            <div className="header-field header-field-example">
              Пример
              <Select
                ariaLabel="Пример"
                className="ui-select-example"
                value={exampleValue}
                options={exampleOptions}
                onChange={onExample}
              />
            </div>
            <label className="header-field header-field-speed">
              Интервал
              <span className="header-speed-control">
                <input
                  type="range"
                  min={200}
                  max={1400}
                  step={100}
                  value={speed}
                  aria-label="Интервал между шагами"
                  onChange={(event) => setSpeed(Number(event.target.value))}
                />
                <span className="header-speed">{speed} мс</span>
              </span>
            </label>
          </div>
        </div>
      </div>
      {sheet ? <CheatSheet onClose={() => setSheet(false)} /> : null}
      {help ? (
        <>
          <button type="button" className="header-help-backdrop" aria-label="Закрыть справку" onClick={() => setHelp(false)} />
          <div className="header-help-pop">
            <p>
              <strong>Что это.</strong> Grasp Cascade — пошаговый разбор CSS-каскада. Сервис показывает, почему у элемента победило именно это значение свойства.
            </p>
            <p>
              <strong>Что делает.</strong> Берёт HTML и CSS, собирает объявления, которые попали в элемент, и проводит их по шагам: вес селектора, слой, !important и порядок в исходнике. Код можно менять и смотреть расчёт заново.
            </p>
          </div>
        </>
      ) : null}
    </header>
  )
}
