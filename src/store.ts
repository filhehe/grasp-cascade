import { create } from 'zustand'
import { EXAMPLES } from './examples.ts'
import { buildRun } from './engine/cascade.ts'
import { focusProperty, parseDocument } from './engine/css.ts'
import { syncProperties, toggleGroup } from './engine/shorthand.ts'
import type { Notice, Scenario, Step } from './engine/model.ts'

export type Status = 'idle' | 'playing' | 'paused' | 'done'

type Fields = {
  html: string
  css: string
  target: string
  properties: string[]
}

type Document = ReturnType<typeof parseDocument>

type State = Fields & {
  doc: Document
  parsedHtml: string
  parsedCss: string
  exampleId: string | null
  steps: Step[]
  notices: Notice[]
  error: string | null
  index: number
  status: Status
  speed: number
  setExample: (id: string) => void
  setHtml: (html: string) => void
  setCss: (css: string) => void
  pickProperty: (property: string, selectors: string[], on: boolean) => void
  togglePlay: () => void
  step: () => void
  tick: () => void
  reset: () => void
  seek: (index: number) => void
  setSpeed: (speed: number) => void
}

function same(left: Fields, right: Fields) {
  return left.html === right.html && left.css === right.css && left.target === right.target && left.properties.join('\n') === right.properties.join('\n')
}

function matchExample(fields: Fields) {
  return EXAMPLES.find((example) => same(example, fields))
}

function writeExampleParam(id: string | null) {
  if (typeof history === 'undefined' || typeof location === 'undefined') return
  const url = new URL(location.href)
  if (id) url.searchParams.set('example', id)
  else url.searchParams.delete('example')
  const next = `${url.pathname}${url.search}${url.hash}`
  const current = `${location.pathname}${location.search}${location.hash}`
  if (next !== current) history.replaceState(null, '', next)
}

function syncUrl(fields: Fields) {
  writeExampleParam(matchExample(fields)?.id ?? null)
}

function opening(): Scenario {
  if (typeof location !== 'undefined') {
    const id = new URLSearchParams(location.search).get('example')
    const fromUrl = EXAMPLES.find((example) => example.id === id)
    if (fromUrl) return fromUrl
  }
  return EXAMPLES[0]
}

function propertyNames(doc: Document) {
  const names = new Set<string>()
  for (const decl of doc.decls) names.add(decl.property)
  for (const element of doc.elements) for (const item of element.inline) names.add(item.property)
  return [...names]
}

function compile(fields: Fields, doc = parseDocument(fields.html, fields.css)) {
  const run = buildRun(fields, doc)
  return { doc, steps: run.steps, notices: run.notices, error: run.error }
}

const COMPILE_DELAY = 250
let compileToken = 0
let compileTimer = 0

const start = opening()
syncUrl(start)
const first = compile(start)

export const useCascade = create<State>((set, get) => {
  function publish(fields: Fields, doc: Document) {
    syncUrl(fields)
    set({
      ...fields,
      ...compile(fields, doc),
      parsedHtml: fields.html,
      parsedCss: fields.css,
      exampleId: matchExample(fields)?.id ?? null,
      index: -1,
      status: 'idle',
    })
  }

  function runCompile() {
    const state = get()
    if (state.parsedHtml === state.html && state.parsedCss === state.css) return
    const doc = parseDocument(state.html, state.css)
    const fields = {
      html: state.html,
      css: state.css,
      target: state.target,
      properties: syncProperties(state.properties, propertyNames(doc)),
    }
    publish(fields, doc)
  }

  function cancelCompile() {
    compileToken += 1
    if (typeof window !== 'undefined') window.clearTimeout(compileTimer)
    compileTimer = 0
  }

  function scheduleCompile() {
    if (typeof window === 'undefined') {
      runCompile()
      return
    }
    if (compileTimer !== 0) return
    const token = ++compileToken
    compileTimer = window.setTimeout(() => {
      compileTimer = 0
      if (token !== compileToken) return
      runCompile()
    }, COMPILE_DELAY)
  }

  return {
  ...start,
  ...first,
  parsedHtml: start.html,
  parsedCss: start.css,
  exampleId: start.id,
  index: -1,
  status: 'idle',
  speed: 700,

  setExample: (id) => {
    const example = EXAMPLES.find((item) => item.id === id)
    if (!example) return
    cancelCompile()
    const fields = { html: example.html, css: example.css, target: example.target, properties: example.properties }
    publish(fields, parseDocument(fields.html, fields.css))
  },

  setHtml: (html) => {
    if (html === get().html) return
    set({ html, exampleId: null, index: -1, status: 'idle' })
    writeExampleParam(null)
    scheduleCompile()
  },

  setCss: (css) => {
    if (css === get().css) return
    set({ css, exampleId: null, index: -1, status: 'idle' })
    writeExampleParam(null)
    scheduleCompile()
  },

  pickProperty: (property, selectors, on) => {
    cancelCompile()
    runCompile()
    const state = get()
    const present = propertyNames(state.doc)
    if (!on) {
      const properties = toggleGroup(state.properties, property, false, present)
      if (properties.length === state.properties.length) return
      publish({ html: state.html, css: state.css, target: state.target, properties }, state.doc)
      return
    }
    const next = focusProperty(state.html, state.css, state.target, property, selectors, state.doc)
    const base = next.target === state.target ? state.properties : []
    const properties = toggleGroup(base, property, true, present)
    if (next.target === state.target && properties.join('\n') === state.properties.join('\n')) return
    publish({ html: state.html, css: state.css, target: next.target, properties }, state.doc)
  },

  setSpeed: (speed) => set({ speed: Math.min(1400, Math.max(200, speed)) }),

  togglePlay: () => {
    const state = get()
    if (state.status === 'playing') {
      set({ status: 'paused' })
      return
    }
    if (state.error || state.steps.length === 0) return
    if (state.status === 'done' || state.index >= state.steps.length - 1) {
      set({ index: 0, status: state.steps.length === 1 ? 'done' : 'playing' })
      return
    }
    set({ index: state.index < 0 ? 0 : state.index, status: 'playing' })
  },

  step: () => {
    const state = get()
    if (state.error || state.steps.length === 0) return
    const next = state.index + 1
    if (next >= state.steps.length) {
      set({ status: 'done' })
      return
    }
    set({ index: next, status: next >= state.steps.length - 1 ? 'done' : 'paused' })
  },

  tick: () => {
    const state = get()
    if (state.status !== 'playing') return
    const next = state.index + 1
    if (next >= state.steps.length) {
      set({ status: 'done' })
      return
    }
    set({ index: next, status: next >= state.steps.length - 1 ? 'done' : 'playing' })
  },

  reset: () => set({ index: -1, status: 'idle' }),

  seek: (index) => {
    const state = get()
    if (index < 0 || index >= state.steps.length) return
    set({ index, status: index >= state.steps.length - 1 ? 'done' : 'paused' })
  },
}
})
