import { keepSelectorNotes, parseDocument, selectorIdentity, usageFor, type PropertyHit, type SelectorNote, type SourceSpan } from '../engine/css.ts'

type Doc = Parameters<typeof usageFor>[0]

export type PaneState = {
  html: string
  css: string
  target: string
  properties: string[]
  doc: Doc
  parsedHtml: string
  parsedCss: string
}

export type HtmlPane = { html: string; unused: SourceSpan[] }

export type CssPane = {
  css: string
  unused: SourceSpan[]
  hits: PropertyHit[]
  picked: string[]
  notes: { lead: SelectorNote | null; lines: (SelectorNote | null)[] }
}

export function elementSketch(html: string) {
  const parts: string[] = []
  for (const match of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const bits = [match[1].toLowerCase()]
    for (const attr of match[2].matchAll(/([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|(\S+)))?/g)) {
      const name = attr[1].toLowerCase()
      if (name === 'style') continue
      bits.push(`${name}=${attr[2] ?? attr[3] ?? attr[4] ?? ''}`)
    }
    parts.push(bits.join(' '))
  }
  return parts.join('\n')
}

function sameSpans(left: SourceSpan[], right: SourceSpan[]) {
  if (left.length !== right.length) return false
  return left.every((span, index) => {
    const other = right[index]
    return span.start === other.start && span.end === other.end && span.reason === other.reason
  })
}

export function createEditorPanes() {
  let htmlCache: { html: string; selectors: string; settled: boolean; pane: HtmlPane } | null = null
  let cssCache: { css: string; pickedKey: string; elements: string; settled: boolean; pane: CssPane } | null = null
  let notesHeld: { sketch: string; notes: CssPane['notes'] } | null = null
  let identityHeld: { css: string; sketch: string } | null = null

  function selectorsOf(css: string) {
    if (identityHeld?.css === css) return identityHeld.sketch
    const sketch = selectorIdentity(css)
    identityHeld = { css, sketch }
    return sketch
  }

  function html(state: PaneState): HtmlPane {
    const dirty = state.parsedHtml !== state.html
    const selectors = selectorsOf(state.css)
    if (htmlCache && htmlCache.html === state.html && (dirty || (htmlCache.settled && htmlCache.selectors === selectors))) {
      return htmlCache.pane
    }
    if (htmlCache && htmlCache.html === state.html && htmlCache.settled) {
      const unused = usageFor(parseDocument(state.html, state.css), state.html, state.css, state.target).htmlUnused
      if (sameSpans(unused, htmlCache.pane.unused)) {
        htmlCache.selectors = selectors
        return htmlCache.pane
      }
      const pane = { ...htmlCache.pane, unused }
      htmlCache = { html: state.html, selectors, settled: true, pane }
      return pane
    }
    const unused = dirty ? (htmlCache?.pane.unused ?? []) : usageFor(state.doc, state.html, state.css, state.target).htmlUnused
    const pane = { html: state.html, unused }
    htmlCache = { html: state.html, selectors, settled: !dirty, pane }
    return pane
  }

  function css(state: PaneState): CssPane {
    const pickedKey = state.properties.join('\n')
    const dirty = state.parsedCss !== state.css
    const elements = elementSketch(state.html)
    if (cssCache && cssCache.css === state.css && cssCache.pickedKey === pickedKey && (dirty || (cssCache.settled && cssCache.elements === elements))) {
      return cssCache.pane
    }
    if (cssCache && cssCache.css === state.css && cssCache.pickedKey === pickedKey && cssCache.settled) {
      const unused = usageFor(parseDocument(state.html, state.css), state.html, state.css, state.target).cssUnused
      if (sameSpans(unused, cssCache.pane.unused)) {
        cssCache.elements = elements
        return cssCache.pane
      }
      const pane = { ...cssCache.pane, unused }
      cssCache = { css: state.css, pickedKey, elements, settled: true, pane }
      return pane
    }
    const kept = keepSelectorNotes(notesHeld, state.css)
    notesHeld = kept
    const live = !dirty
    const pane: CssPane = {
      css: state.css,
      unused: live ? usageFor(state.doc, state.html, state.css, state.target).cssUnused : (cssCache?.pane.unused ?? []),
      hits: live ? state.doc.propertyHits : (cssCache?.pane.hits ?? []),
      picked: state.properties,
      notes: kept.notes,
    }
    cssCache = { css: state.css, pickedKey, elements, settled: live, pane }
    return pane
  }

  return { html, css }
}

export const editorPanes = createEditorPanes()
