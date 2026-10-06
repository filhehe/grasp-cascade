import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { indentCssKey } from '../cssIndent.ts'
import { type PropertyHit, type SelectorNote, type SourceSpan } from '../engine/css.ts'
import { linkLabel } from '../engine/shorthand.ts'
import { editorPanes } from './editorPanes.ts'

const NO_NOTES = { lead: null as SelectorNote | null, lines: [] as (SelectorNote | null)[] }
import { highlight } from '../highlight.ts'
import type { Step } from '../engine/model.ts'
import { useCascade } from '../store.ts'

function lineOf(steps: Step[], index: number, source: 'css' | 'html') {
  const step = steps[index]
  if (!step?.focusId) return null
  const focused = step.candidates.find((item) => item.id === step.focusId)
  if (!focused) return null
  if (source === 'html') return focused.inline ? focused.line : null
  return focused.inline ? null : focused.line
}

function stepForLine(steps: Step[], source: 'css' | 'html', line: number) {
  return steps.findIndex((step) => {
    const focused = step.candidates.find((item) => item.id === step.focusId)
    if (!focused || focused.line !== line) return false
    return source === 'html' ? focused.inline : !focused.inline
  })
}

function lineStarts(value: string) {
  const starts = [0]
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '\n') starts.push(index + 1)
  }
  return starts
}

function spanAt<T extends { start: number; end: number }>(ranges: T[], offset: number) {
  return ranges.find((range) => offset >= range.start && offset < range.end) ?? ranges.find((range) => offset === range.end)
}

function splitMarks(text: string, start: number, groups: { ranges: { start: number; end: number }[]; className: string }[]) {
  const cuts = new Set([0, text.length])
  for (const group of groups) {
    for (const range of group.ranges) {
      const from = Math.max(0, range.start - start)
      const to = Math.min(text.length, range.end - start)
      if (from < to) {
        cuts.add(from)
        cuts.add(to)
      }
    }
  }
  const points = [...cuts].sort((left, right) => left - right)
  const parts: { text: string; className: string }[] = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    if (from === to) continue
    const at = start + from
    const className = groups
      .filter((group) => group.ranges.some((range) => at >= range.start && at < range.end))
      .map((group) => group.className)
      .join(' ')
    parts.push({ text: text.slice(from, to), className })
  }
  return parts.length ? parts : [{ text, className: '' }]
}

function Field({
  label,
  value,
  source,
  unused,
  hits,
  picked,
  notes,
  onChange,
  onPick,
}: {
  label: string
  value: string
  source: 'css' | 'html'
  unused: SourceSpan[]
  hits: PropertyHit[]
  picked: string[]
  notes: { lead: SelectorNote | null; lines: (SelectorNote | null)[] }
  onChange: (value: string) => void
  onPick: (property: string, selectors: string[], on: boolean) => void
}) {
  const lines = useMemo(() => highlight(value, source), [value, source])
  const starts = useMemo(() => lineStarts(value), [value])
  const pickedHits = useMemo(() => hits.filter((hit) => picked.includes(hit.property)), [hits, picked])
  const propertyNames = useMemo(() => [...new Set(hits.map((hit) => hit.property))], [hits])
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const caretRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const node = inputRef.current
    const at = caretRef.current
    if (!node || at == null) return
    caretRef.current = null
    node.setSelectionRange(at, at)
  }, [value])

  useLayoutEffect(() => {
    const node = tipRef.current
    if (!tip || !node) return
    const width = Math.min(320, window.innerWidth - 16)
    node.style.width = `${width}px`
    const height = node.offsetHeight
    let left = tip.x
    let top = tip.y + 14
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
    if (left < 8) left = 8
    if (top + height > window.innerHeight - 8) top = Math.max(8, tip.y - height - 12)
    node.style.left = `${left}px`
    node.style.top = `${top}px`
  }, [tip])

  useEffect(() => {
    if (!tip) return
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (tipRef.current?.contains(target)) return
      if (target instanceof HTMLTextAreaElement && target.getAttribute('aria-label') === label) return
      setTip(null)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setTip(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [tip])

  function seekLine(line: number) {
    const state = useCascade.getState()
    const found = stepForLine(state.steps, source, line)
    if (found >= 0) state.seek(found)
  }

  return (
    <div className={`editor-block editor-block-${source}${notes.lead ? ' has-lead-note' : ''}`}>
      <div className="editor-caption">{label}</div>
      <div className="editor-scroll">
        <div className="editor-sheet">
          <Gutter value={value} source={source} unused={unused} starts={starts} onSeek={seekLine} />
          <div className="editor-code">
            {notes.lead ? (
              <span className="selector-note is-lead" style={{ '--note-indent': notes.lead.indent } as CSSProperties}>
                {notes.lead.label}
              </span>
            ) : null}
            <LineCursor source={source} />
            <pre className="editor-text editor-paint" aria-hidden="true">
              {lines.map((tokens, line) => {
                let column = starts[line] ?? 0
                return (
                  <span key={line} className="editor-row">
                    {notes.lines[line] ? (
                      <span className="selector-note" style={{ '--note-indent': notes.lines[line].indent } as CSSProperties}>
                        {notes.lines[line].label}
                      </span>
                    ) : null}
                    {tokens.map((token, tokenIndex) => {
                      const parts = splitMarks(token.text, column, [
                        { ranges: unused, className: 'is-unused' },
                        { ranges: pickedHits, className: 'is-picked' },
                      ])
                      column += token.text.length
                      return parts.map((part, partIndex) => (
                        <span key={`${tokenIndex}-${partIndex}`} className={`tok-${token.kind}${part.className ? ` ${part.className}` : ''}`}>
                          {part.text}
                        </span>
                      ))
                    })}
                    {line < lines.length - 1 ? '\n' : null}
                  </span>
                )
              })}
            </pre>
            <textarea
              ref={inputRef}
              className="editor-text editor-input"
              value={value}
              spellCheck={false}
              aria-label={label}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (source !== 'css' || event.metaKey || event.ctrlKey || event.altKey) return
                const key = event.key === 'Tab' && event.shiftKey ? 'ShiftTab' : event.key
                const field = event.currentTarget
                const next = indentCssKey(field.value, field.selectionStart, field.selectionEnd, key)
                if (!next) return
                event.preventDefault()
                caretRef.current = next.caret
                onChange(next.value)
              }}
              onClick={(event) => {
                const field = event.currentTarget
                const property = spanAt(hits, field.selectionStart)
                if (property) {
                  onPick(property.property, property.selectors, true)
                  setTip(null)
                  return
                }
                const hit = spanAt(unused, field.selectionStart)
                if (hit) {
                  setTip((currentTip) =>
                    currentTip?.text === hit.reason ? null : { text: hit.reason, x: event.clientX, y: event.clientY },
                  )
                  return
                }
                setTip(null)
                const line = field.value.slice(0, field.selectionStart).split('\n').length
                seekLine(line)
              }}
            />
            {hits.map((hit) => {
              let line = 0
              for (let index = 0; index < starts.length; index += 1) {
                if (starts[index] <= hit.start) line = index
              }
              const column = hit.start - starts[line]
              const checked = picked.includes(hit.property)
              const link = linkLabel(hit.property, propertyNames)
              return (
                <input
                  key={`${hit.start}-${hit.property}`}
                  className="prop-check"
                  type="checkbox"
                  checked={checked}
                  aria-label={link ? `Разбирать ${hit.property}: ${link}` : `Разбирать ${hit.property}`}
                  title={link ?? undefined}
                  style={{ '--check-line': line, '--check-col': column } as CSSProperties}
                  onChange={(event) => onPick(hit.property, hit.selectors, event.target.checked)}
                />
              )
            })}
          </div>
        </div>
      </div>
      {tip
        ? createPortal(
            <div ref={tipRef} className="unused-tip" role="tooltip">
              {tip.text}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function Gutter({
  value,
  source,
  unused,
  starts,
  onSeek,
}: {
  value: string
  source: 'css' | 'html'
  unused: SourceSpan[]
  starts: number[]
  onSeek: (line: number) => void
}) {
  const current = useCascade((state) => lineOf(state.steps, state.index, source))
  return (
    <div className="editor-gutter" aria-hidden="true">
      {starts.map((start, line) => {
        const end = line + 1 < starts.length ? starts[line + 1] - 1 : value.length
        const quiet = end > start && unused.some((range) => start >= range.start && end <= range.end)
        const tone = [current === line + 1 ? 'is-current' : '', quiet ? 'is-unused' : ''].filter(Boolean).join(' ')
        return (
          <span key={line} className={tone || undefined} onClick={() => onSeek(line + 1)}>
            {line + 1}
          </span>
        )
      })}
    </div>
  )
}

function LineCursor({ source }: { source: 'css' | 'html' }) {
  const current = useCascade((state) => lineOf(state.steps, state.index, source))
  if (current == null) return null
  return <div className="editor-line" style={{ top: `calc(var(--editor-pad-y) + ${current - 1} * var(--editor-line))` }} />
}

const HtmlEditor = memo(function HtmlEditor() {
  const pane = useCascade(editorPanes.html)
  const setHtml = useCascade((state) => state.setHtml)
  const pickProperty = useCascade((state) => state.pickProperty)
  return <Field label="HTML" source="html" value={pane.html} unused={pane.unused} hits={[]} picked={[]} notes={NO_NOTES} onChange={setHtml} onPick={pickProperty} />
})

const CssEditor = memo(function CssEditor() {
  const pane = useCascade(editorPanes.css)
  const setCss = useCascade((state) => state.setCss)
  const pickProperty = useCascade((state) => state.pickProperty)
  return (
    <Field
      label="CSS"
      source="css"
      value={pane.css}
      unused={pane.unused}
      hits={pane.hits}
      picked={pane.picked}
      notes={pane.notes}
      onChange={setCss}
      onPick={pickProperty}
    />
  )
})

const SPLIT_KEY = 'grasp-cascade-editor-split'
const SPLIT_MIN = 18
const SPLIT_MAX = 82

function clampSplit(value: number) {
  return Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, value))
}

function readSplit() {
  try {
    const raw = localStorage.getItem(SPLIT_KEY)
    if (raw == null) return 50
    const value = Number(raw)
    return Number.isFinite(value) ? clampSplit(value) : 50
  } catch {
    return 50
  }
}

export function Editor() {
  const splitRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef(false)
  const [htmlShare, setHtmlShare] = useState(readSplit)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    try {
      localStorage.setItem(SPLIT_KEY, String(htmlShare))
    } catch {
      // приватный режим может запретить запись
    }
  }, [htmlShare])

  function moveSplit(clientX: number, handleWidth: number) {
    const rect = splitRef.current?.getBoundingClientRect()
    if (!rect || rect.width <= 0) return
    const next = ((clientX - rect.left - handleWidth / 2) / rect.width) * 100
    setHtmlShare(clampSplit(Math.round(next * 10) / 10))
  }

  return (
    <div
      ref={splitRef}
      className={`editor-split ${dragging ? 'is-dragging' : ''}`}
      style={{ '--editor-html': `${htmlShare}%` } as CSSProperties}
    >
      <HtmlEditor />
      <button
        type="button"
        className={`editor-split-handle ${dragging ? 'is-dragging' : ''}`}
        role="separator"
        aria-orientation="vertical"
        aria-label="Ширина редакторов HTML и CSS"
        aria-valuemin={SPLIT_MIN}
        aria-valuemax={SPLIT_MAX}
        aria-valuenow={Math.round(htmlShare)}
        onPointerDown={(event) => {
          event.preventDefault()
          dragRef.current = true
          try {
            event.currentTarget.setPointerCapture(event.pointerId)
          } catch {
            // захват указателя есть только у настоящего нажатия
          }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          moveSplit(event.clientX, event.currentTarget.offsetWidth)
        }}
        onPointerUp={(event) => {
          dragRef.current = false
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
          setDragging(false)
        }}
        onPointerCancel={() => {
          dragRef.current = false
          setDragging(false)
        }}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
          event.preventDefault()
          const delta = event.key === 'ArrowLeft' ? -2 : 2
          setHtmlShare((share) => clampSplit(Math.round((share + delta) * 10) / 10))
        }}
      />
      <CssEditor />
    </div>
  )
}
