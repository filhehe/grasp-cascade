import { ZERO, formatSpec, isElement, type Compound, type Decl, type ElementNode, type Node, type Notice, type Selector, type Simple, type Specificity } from './model.ts'

const INHERITED = new Set([
  'color',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-align',
  'visibility',
  'cursor',
  'white-space',
])

const NAMED_COLORS = new Set(
  `transparent currentcolor black white gray grey silver red blue green teal navy coral tomato royalblue gold orange purple pink brown beige yellow lime cyan magenta white smokewhite rebeccapurple hotpink powderblue lightgreen goldenrod darkgreen`.split(
    ' ',
  ),
)

export function inherits(property: string) {
  return INHERITED.has(property)
}

export function initialValue(property: string) {
  if (property === 'color') return 'CanvasText'
  if (property === 'margin' || property.startsWith('margin-')) return '0'
  if (property === 'padding' || property.startsWith('padding-')) return '0'
  if (property === 'background-color' || property === 'background') return 'transparent'
  if (property === 'display') return 'inline'
  if (property === 'font-size') return 'medium'
  if (property === 'font-weight') return '400'
  return 'initial'
}

export function validate(property: string, value: string): string | null {
  const raw = value.trim()
  if (!raw) return 'пустое значение'
  if (property === 'color' || property === 'background-color') {
    if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return null
    if (/^(?:rgb|rgba|hsl|hsla)\([^)]+\)$/i.test(raw)) return null
    if (NAMED_COLORS.has(raw.toLowerCase())) return null
    return 'это не цвет'
  }
  if (property === 'margin' || property === 'padding' || property.startsWith('margin-') || property.startsWith('padding-')) {
    const parts = raw.split(/\s+/)
    if (parts.length < 1 || parts.length > 4) return 'нужно от 1 до 4 значений'
    if (parts.every((part) => part === 'auto' || part === '0' || /^-?\d+(\.\d+)?(px|em|rem|%)$/.test(part))) return null
    return 'нужна длина, 0 или auto'
  }
  if (property === 'display') {
    if (['block', 'inline', 'inline-block', 'flex', 'grid', 'none', 'contents'].includes(raw)) return null
    return 'неизвестное значение display'
  }
  if (property === 'font-size') {
    if (/^-?\d+(\.\d+)?(px|em|rem|%)$/.test(raw)) return null
    if (['small', 'medium', 'large', 'smaller', 'larger'].includes(raw)) return null
    return 'нужна длина или ключевое слово'
  }
  return null
}

type RuleBlock = {
  start: number
  end: number
  selectors: Selector[]
}

export type PropertyHit = { start: number; end: number; property: string; selectors: string[] }

type Sheet = {
  decls: Omit<Decl, 'id' | 'invalid'>[]
  layers: string[]
  notices: Notice[]
  blocks: RuleBlock[]
  propertyHits: PropertyHit[]
}

export type SourceSpan = { start: number; end: number; reason: string }

export function parseDocument(html: string, css: string) {
  const root = parseHtml(html)
  const sheet = parseCss(css)
  const elements = walk(root)
  return { root, elements, ...sheet }
}

export function findTarget(elements: ElementNode[], target: string) {
  const selector = parseSelector(target)
  if (!selector) return { element: null as ElementNode | null, notice: `Селектор цели «${target}» не разобран` }
  return { element: elements.find((element) => matches(selector, element)) ?? null, notice: null }
}

export function resolveElement(elements: ElementNode[], target: string) {
  const found = findTarget(elements, target).element
  if (found) return found
  let best: ElementNode | null = null
  let depth = -1
  for (const element of elements) {
    let current = 0
    let parent = element.parent
    while (parent && parent.tag !== '#root') {
      current += 1
      parent = parent.parent
    }
    if (current >= depth) {
      depth = current
      best = element
    }
  }
  return best
}

export function sourceUsage(html: string, css: string, target: string) {
  return usageFor(parseDocument(html, css), html, css, target)
}

export function usageFor(doc: ReturnType<typeof parseDocument>, html: string, css: string, target: string) {
  const cssUnused = unusedCssSelectors(css, doc.elements, doc.blocks)
  const targetSelector = parseSelector(target)
  const names = selectorNames([
    ...doc.blocks.flatMap((block) => block.selectors),
    ...(targetSelector ? [targetSelector] : []),
  ])
  return { cssUnused, htmlUnused: unusedHtmlSpans(html, names) }
}

export function declarationsFor(element: ElementNode, sheet: Sheet): Decl[] {
  let id = 0
  const found: Decl[] = []
  for (const decl of sheet.decls) {
    if (!decl.selector || !matches(decl.selector, element)) continue
    const problem = validate(decl.property, decl.value)
    found.push({ ...decl, id: `d${++id}`, invalid: problem })
  }
  for (const inline of element.inline) {
    const problem = validate(inline.property, inline.value)
    found.push({
      id: `d${++id}`,
      property: inline.property,
      value: inline.value,
      important: inline.important,
      selectorText: 'style',
      selector: null,
      origin: 'author',
      layer: null,
      specificity: ZERO,
      inline: true,
      order: 100000 + inline.line,
      line: inline.line,
      invalid: problem,
    })
  }
  return found
}

export function matches(selector: Selector, element: ElementNode) {
  let node: ElementNode | null = element
  const last = selector.compounds.length - 1
  if (!node || !compoundMatches(selector.compounds[last], node)) return false
  for (let index = last - 1; index >= 0; index -= 1) {
    const combinator = selector.combinators[index]
    if (combinator === '>') {
      node = parentElement(node)
      if (!node || !compoundMatches(selector.compounds[index], node)) return false
    } else {
      node = ancestor(node!, selector.compounds[index])
      if (!node) return false
    }
  }
  return true
}

function ancestor(element: ElementNode, compound: Compound) {
  let parent = parentElement(element)
  while (parent) {
    if (compoundMatches(compound, parent)) return parent
    parent = parentElement(parent)
  }
  return null
}

function parentElement(element: ElementNode) {
  return element.parent && element.parent.tag !== '#root' ? element.parent : null
}

function compoundMatches(compound: Compound, element: ElementNode) {
  return compound.every((simple) => simpleMatches(simple, element))
}

function simpleMatches(simple: Simple, element: ElementNode): boolean {
  if (simple.kind === 'type') return element.tag === simple.name
  if (simple.kind === 'class') return element.classes.includes(simple.name)
  if (simple.kind === 'id') return element.id === simple.name
  if (simple.kind === 'attr') {
    if (!(simple.name in element.attrs)) return false
    return simple.value == null || element.attrs[simple.name] === simple.value
  }
  if (simple.name === 'hover') return false
  if (simple.name === 'not') return !simple.args.some((arg) => matches(arg, element))
  return simple.args.some((arg) => matches(arg, element))
}

export function specificityOf(selector: Selector): Specificity {
  return selector.compounds.reduce((total, compound) => addSpec(total, compoundSpec(compound)), ZERO)
}

export type SelectorNote = { label: string; indent: number }

export function selectorNotes(css: string, blocks: { start: number; end: number }[]) {
  const lines = css.split('\n').map(() => null as SelectorNote | null)
  let lead: SelectorNote | null = null
  const put = (line: number, note: SelectorNote) => {
    if (line < 0) {
      lead = lead ? { label: `${lead.label} ${note.label}`, indent: lead.indent } : note
      return
    }
    const prev = lines[line]
    lines[line] = prev ? { label: `${prev.label} ${note.label}`, indent: prev.indent } : note
  }
  for (const block of blocks) {
    const brace = css.indexOf('{', block.start)
    if (brace < 0 || brace > block.end) continue
    for (const piece of splitTopOffsets(css.slice(block.start, brace))) {
      const selector = parseSelector(piece.text)
      if (!selector) continue
      const at = block.start + piece.start
      const line = lineOf(css, at) - 1
      const lineStart = css.lastIndexOf('\n', at - 1) + 1
      put(line - 1, { label: formatSpec(specificityOf(selector)), indent: Math.max(0, at - lineStart) })
    }
  }
  return { lead, lines }
}

export function spaceSelectors(css: string) {
  const blocks = parseCss(css).blocks
  const starts: { at: number; blanks: number }[] = layerStarts(css).map((at) => ({ at, blanks: 1 }))
  for (const block of blocks) {
    const brace = css.indexOf('{', block.start)
    if (brace < 0 || brace > block.end) continue
    for (const piece of splitTopOffsets(css.slice(block.start, brace))) starts.push({ at: block.start + piece.start, blanks: 2 })
  }
  starts.sort((left, right) => right.at - left.at)
  return starts.reduce((text, start) => blankLineBefore(text, start.at, start.blanks), css)
}

function layerStarts(css: string) {
  const starts: number[] = []
  const walk = (text: string, base: number) => {
    let index = 0
    while (index < text.length) {
      index = skipNoise(text, index)
      if (index >= text.length) break
      if (text.startsWith('@', index)) {
        const headEnd = findAtHead(text, index)
        const name = text.slice(index + 1, headEnd).trim()
        if (/^layer\b/i.test(name)) starts.push(base + index)
        if (text[headEnd] === '{') {
          const body = balanced(text, headEnd)
          if (/^layer\b/i.test(name)) walk(text.slice(headEnd + 1, body.end), base + headEnd + 1)
          index = body.end + 1
          continue
        }
        index = headEnd + 1
        continue
      }
      const brace = text.indexOf('{', index)
      if (brace < 0) break
      index = balanced(text, brace).end + 1
    }
  }
  walk(css, 0)
  return starts
}

function blankLineBefore(css: string, index: number, blanks: number) {
  const gap = '\n'.repeat(blanks + 1)
  let cursor = index
  while (cursor > 0 && (css[cursor - 1] === ' ' || css[cursor - 1] === '\t')) cursor -= 1
  const indent = css.slice(cursor, index)
  if (cursor > 0 && css[cursor - 1] === ',') {
    const head = css.slice(0, cursor).replace(/\n+$/, '')
    return `${head}${gap}${css.slice(index)}`
  }
  if (cursor === 0) return css
  const head = css.slice(0, cursor).replace(/\n+$/, '')
  if (!head.trim()) return `${indent}${css.slice(index)}`
  return `${head}${gap}${indent}${css.slice(index)}`
}

function compoundSpec(compound: Compound): Specificity {
  return compound.reduce((total, simple) => addSpec(total, simpleSpec(simple)), ZERO)
}

function simpleSpec(simple: Simple): Specificity {
  if (simple.kind === 'id') return { a: 1, b: 0, c: 0 }
  if (simple.kind === 'class' || simple.kind === 'attr') return { a: 0, b: 1, c: 0 }
  if (simple.kind === 'type') return { a: 0, b: 0, c: 1 }
  if (simple.name === 'hover') return { a: 0, b: 1, c: 0 }
  if (simple.name === 'where') return ZERO
  return simple.args.reduce((max, arg) => (heavier(specificityOf(arg), max) ? specificityOf(arg) : max), ZERO)
}

function heavier(next: Specificity, current: Specificity) {
  if (next.a !== current.a) return next.a > current.a
  if (next.b !== current.b) return next.b > current.b
  return next.c > current.c
}

function addSpec(left: Specificity, right: Specificity): Specificity {
  return { a: left.a + right.a, b: left.b + right.b, c: left.c + right.c }
}

function walk(root: ElementNode) {
  const list: ElementNode[] = []
  const visit = (node: Node) => {
    if (!isElement(node)) return
    if (node.tag !== '#root') list.push(node)
    node.children.forEach(visit)
  }
  visit(root)
  return list
}

function parseHtml(source: string): ElementNode {
  const root: ElementNode = { tag: '#root', id: '', classes: [], attrs: {}, inline: [], children: [], parent: null }
  let index = 0
  const stack = [root]
  while (index < source.length) {
    if (source.startsWith('<!--', index)) {
      const end = source.indexOf('-->', index + 4)
      index = end < 0 ? source.length : end + 3
      continue
    }
    if (source[index] !== '<') {
      const next = source.indexOf('<', index)
      const text = source.slice(index, next < 0 ? source.length : next)
      if (text.trim()) stack.at(-1)?.children.push({ text, parent: stack.at(-1) ?? null })
      index = next < 0 ? source.length : next
      continue
    }
    if (source.startsWith('</', index)) {
      const end = source.indexOf('>', index)
      if (stack.length > 1) stack.pop()
      index = end < 0 ? source.length : end + 1
      continue
    }
    const end = source.indexOf('>', index)
    if (end < 0) break
    const raw = source.slice(index + 1, end).replace(/\/$/, '').trim()
    const selfClose = source[end - 1] === '/'
    const token = readTag(raw, lineOf(source, index))
    token.parent = stack.at(-1) ?? null
    stack.at(-1)?.children.push(token)
    if (!selfClose && !['br', 'img', 'input', 'hr', 'meta', 'link'].includes(token.tag)) stack.push(token)
    index = end + 1
  }
  return root
}

function readTag(raw: string, line: number): ElementNode {
  const match = /^([a-zA-Z][\w-]*)/.exec(raw)
  const tag = match?.[1].toLowerCase() ?? 'div'
  const attrs: Record<string, string> = {}
  const attr = /([:@\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g
  attr.lastIndex = match?.[0].length ?? 0
  let found: RegExpExecArray | null
  while ((found = attr.exec(raw))) {
    if (found[0].length === 0) {
      attr.lastIndex += 1
      continue
    }
    attrs[found[1].toLowerCase()] = found[2] ?? found[3] ?? found[4] ?? ''
  }
  const classes = (attrs.class ?? '').split(/\s+/).filter(Boolean)
  return {
    tag,
    id: attrs.id ?? '',
    classes,
    attrs,
    inline: parseInline(attrs.style ?? '', line),
    children: [],
    parent: null,
  }
}

function parseInline(style: string, line: number) {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const split = part.indexOf(':')
      if (split < 0) return null
      const property = part.slice(0, split).trim().toLowerCase()
      const raw = part.slice(split + 1).trim()
      const important = /!important\s*$/i.test(raw)
      const value = raw.replace(/!important\s*$/i, '').trim()
      return { property, value, important, line }
    })
    .filter((item): item is NonNullable<typeof item> => item != null && item.property !== '' && item.value !== '')
}

function parseCss(css: string): Sheet {
  const decls: Sheet['decls'] = []
  const layers: string[] = []
  const notices: Notice[] = []
  const blocks: RuleBlock[] = []
  const propertyHits: PropertyHit[] = []
  let order = 0
  const scan = (text: string, base: number, layer: string | null) => {
    let index = 0
    while (index < text.length) {
      index = skipNoise(text, index)
      if (index >= text.length) break
      if (text.startsWith('@', index)) {
        const headEnd = findAtHead(text, index)
        const head = text.slice(index, headEnd).trim()
        const name = head.slice(1).trim()
        if (text[headEnd] === '{') {
          const body = balanced(text, headEnd)
          if (/^layer\b/i.test(name)) {
            const layerName = name.replace(/^layer/i, '').trim()
            if (!layerName) notices.push({ line: lineOf(text, index) + lineOfOffset(css, base), message: '@layer без имени не разобран' })
            else {
              rememberLayer(layers, layerName)
              scan(text.slice(headEnd + 1, body.end), base + headEnd + 1, layerName)
            }
          } else {
            notices.push({ line: lineOf(text, index) + lineOfOffset(css, base) - 1 + 1, message: `@${name.split(/\s/)[0]} не разобрано` })
          }
          index = body.end + 1
          continue
        }
        if (/^layer\b/i.test(name)) {
          name
            .replace(/^layer/i, '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .forEach((item) => rememberLayer(layers, item))
        } else notices.push({ line: lineOf(css, base + index), message: `@${name.split(/\s/)[0]} не разобрано` })
        index = headEnd + 1
        continue
      }
      const brace = text.indexOf('{', index)
      if (brace < 0) {
        notices.push({ line: lineOf(css, base + index), message: 'хвост стилей не разобран' })
        break
      }
      const selectorText = text.slice(index, brace).trim()
      const body = balanced(text, brace)
      const selectors = splitTop(selectorText)
      const parsed = selectors.map((item) => ({ text: item, selector: parseSelector(item) }))
      blocks.push({
        start: base + index,
        end: base + body.end + 1,
        selectors: parsed.flatMap((item) => (item.selector ? [item.selector] : [])),
      })
      if (parsed.some((item) => !item.selector)) {
        notices.push({ line: lineOf(css, base + index), message: `селектор «${selectorText}» не разобран` })
      }
      const bodyText = text.slice(brace + 1, body.end)
      for (const part of bodyText.split(';')) {
        const piece = part.trim()
        if (!piece || piece.startsWith('@')) continue
        const colon = piece.indexOf(':')
        if (colon < 0) {
          notices.push({ line: lineOf(css, base + brace), message: `объявление «${piece}» не разобрано` })
          continue
        }
        const rawName = piece.slice(0, colon)
        const property = rawName.trim().toLowerCase()
        const raw = piece.slice(colon + 1).trim()
        if (!property || !raw) continue
        const important = /!important\s*$/i.test(raw)
        const value = raw.replace(/!important\s*$/i, '').trim()
        const rel = bodyText.indexOf(part)
        const lead = part.length - part.trimStart().length
        const nameLead = rawName.length - rawName.trimStart().length
        const nameAt = base + brace + 1 + rel + lead + nameLead
        propertyHits.push({ start: nameAt, end: nameAt + rawName.trim().length, property, selectors })
        const line = lineOf(css, base + brace + 1 + rel + lead)
        for (const item of parsed) {
          if (!item.selector) continue
          order += 1
          decls.push({
            property,
            value,
            important,
            selectorText: item.text,
            selector: item.selector,
            origin: 'author',
            layer,
            specificity: specificityOf(item.selector),
            inline: false,
            order,
            line,
          })
        }
      }
      index = body.end + 1
    }
  }
  scan(css, 0, null)
  return { decls, layers, notices, blocks, propertyHits }
}

export function propertyHits(css: string) {
  return parseCss(css).propertyHits
}

export function focusProperty(html: string, css: string, target: string, property: string, selectors: string[], doc = parseDocument(html, css)) {
  const current = resolveElement(doc.elements, target)
  const usable = selectors.flatMap((text) => {
    const selector = parseSelector(text)
    return selector ? [{ text, selector }] : []
  })
  if (current && usable.some((item) => matches(item.selector, current))) return { target, properties: [property] }
  const found = usable.find((item) => doc.elements.some((element) => matches(item.selector, element)))
  return { target: found?.text ?? target, properties: [property] }
}

function selectorNames(selectors: Selector[]) {
  const classes = new Set<string>()
  const ids = new Set<string>()
  const visit = (selector: Selector) => {
    for (const compound of selector.compounds) {
      for (const simple of compound) {
        if (simple.kind === 'class') classes.add(simple.name)
        else if (simple.kind === 'id') ids.add(simple.name)
        else if (simple.kind === 'pseudo') simple.args.forEach(visit)
      }
    }
  }
  selectors.forEach(visit)
  return { classes, ids }
}

function unusedCssSelectors(css: string, elements: ElementNode[], blocks: RuleBlock[]): SourceSpan[] {
  const spans: SourceSpan[] = []
  for (const block of blocks) {
    const brace = css.indexOf('{', block.start)
    if (brace < 0 || brace > block.end) continue
    for (const piece of splitTopOffsets(css.slice(block.start, brace))) {
      const start = block.start + piece.start
      const end = block.start + piece.end
      const selector = parseSelector(piece.text)
      const used = selector != null && elements.some((element) => matches(selector, element))
      if (used) continue
      const reason = selector
        ? `Селектор ${piece.text} не совпадает ни с одним элементом.`
        : `Селектор ${piece.text} не разобран.`
      spans.push({ start, end, reason })
    }
  }
  return spans
}

function unusedHtmlSpans(html: string, names: { classes: Set<string>; ids: Set<string> }): SourceSpan[] {
  const spans: SourceSpan[] = []
  const tags = /<\/?([a-zA-Z][\w-]*)\b([^>]*)>/g
  for (const match of html.matchAll(tags)) {
    if (match[0].startsWith('</')) continue
    const nameAt = (match.index ?? 0) + 1
    const attrs = match[2] ?? ''
    const attrAt = nameAt + match[1].length
    markList(spans, attrs, attrAt, 'class', names.classes)
    markList(spans, attrs, attrAt, 'id', names.ids)
  }
  return spans
}

function markList(spans: SourceSpan[], attrs: string, attrAt: number, attr: 'class' | 'id', used: Set<string>) {
  const pattern = new RegExp(`\\b${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'gi')
  for (const match of attrs.matchAll(pattern)) {
    const value = match[1] ?? match[2] ?? match[3] ?? ''
    const quoted = match[1] != null || match[2] != null
    const valueAt = attrAt + (match.index ?? 0) + match[0].length - value.length - (quoted ? 1 : 0)
    for (const piece of value.matchAll(/\S+/g)) {
      if (used.has(piece[0])) continue
      const start = valueAt + (piece.index ?? 0)
      const token = attr === 'class' ? `.${piece[0]}` : `#${piece[0]}`
      const reason = attr === 'class' ? `Класс ${token} не встречается в селекторах.` : `Идентификатор ${token} не встречается в селекторах.`
      spans.push({ start, end: start + piece[0].length, reason })
    }
  }
}

function rememberLayer(layers: string[], name: string) {
  if (!layers.includes(name)) layers.push(name)
}

function splitTop(text: string) {
  return splitTopOffsets(text).map((piece) => piece.text)
}

function splitTopOffsets(text: string) {
  const parts: { text: string; start: number; end: number }[] = []
  let start = 0
  let depth = 0
  const push = (from: number, to: number) => {
    const raw = text.slice(from, to)
    const lead = raw.search(/\S/)
    if (lead < 0) return
    const trail = raw.trimEnd().length
    parts.push({ text: raw.slice(lead, trail), start: from + lead, end: from + trail })
  }
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    else if (char === ',' && depth === 0) {
      push(start, index)
      start = index + 1
    }
  }
  push(start, text.length)
  return parts
}

export function parseSelector(text: string): Selector | null {
  const compounds: Compound[] = []
  const combinators: (' ' | '>')[] = []
  let index = 0
  let compound: Compound = []
  const pushCompound = () => {
    if (compound.length) compounds.push(compound)
    compound = []
  }
  while (index < text.length) {
    const char = text[index]
    if (char === ' ' || char === '\n' || char === '\t' || char === '>') {
      let combinator: ' ' | '>' = '>'
      const had = compound.length > 0
      pushCompound()
      if (char !== '>') {
        combinator = ' '
        while (index < text.length && /\s/.test(text[index])) index += 1
      }
      if (text[index] === '>') {
        combinator = '>'
        index += 1
        while (index < text.length && /\s/.test(text[index])) index += 1
      }
      if (had) combinators.push(combinator)
      continue
    }
    if (char === '*') {
      index += 1
      continue
    }
    if (char === '.') {
      const name = ident(text, index + 1)
      if (!name) return null
      compound.push({ kind: 'class', name: name.value })
      index = name.end
      continue
    }
    if (char === '#') {
      const name = ident(text, index + 1)
      if (!name) return null
      compound.push({ kind: 'id', name: name.value })
      index = name.end
      continue
    }
    if (char === '[') {
      const end = text.indexOf(']', index)
      if (end < 0) return null
      const body = text.slice(index + 1, end).trim()
      const eq = body.indexOf('=')
      const name = (eq < 0 ? body : body.slice(0, eq)).trim().toLowerCase()
      const value = eq < 0 ? undefined : body.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '')
      if (!name) return null
      compound.push({ kind: 'attr', name, value })
      index = end + 1
      continue
    }
    if (char === ':') {
      const name = ident(text, index + 1)
      if (!name) return null
      const pseudo = name.value.toLowerCase()
      index = name.end
      if (pseudo === 'hover') {
        compound.push({ kind: 'pseudo', name: 'hover', args: [] })
        continue
      }
      if (pseudo === 'is' || pseudo === 'where' || pseudo === 'not') {
        if (text[index] !== '(') return null
        const body = balanced(text, index, '(', ')')
        const args = body.text
          .slice(1, -1)
          .split(',')
          .map((item) => parseSelector(item.trim()))
        if (args.some((item) => !item)) return null
        compound.push({ kind: 'pseudo', name: pseudo, args: args as Selector[] })
        index = body.end + 1
        continue
      }
      return null
    }
    if (/[a-zA-Z]/.test(char)) {
      const name = ident(text, index)
      if (!name) return null
      compound.push({ kind: 'type', name: name.value.toLowerCase() })
      index = name.end
      continue
    }
    return null
  }
  pushCompound()
  if (!compounds.length || combinators.length !== compounds.length - 1) return null
  return { text, compounds, combinators }
}

function ident(text: string, index: number) {
  const match = /^[\w-]+/.exec(text.slice(index))
  if (!match) return null
  return { value: match[0], end: index + match[0].length }
}

function skipNoise(text: string, index: number) {
  while (index < text.length) {
    if (/\s/.test(text[index])) {
      index += 1
      continue
    }
    if (text.startsWith('/*', index)) {
      const end = text.indexOf('*/', index + 2)
      index = end < 0 ? text.length : end + 2
      continue
    }
    break
  }
  return index
}

function findAtHead(text: string, index: number) {
  let cursor = index
  while (cursor < text.length && text[cursor] !== '{' && text[cursor] !== ';') cursor += 1
  return cursor
}

function balanced(text: string, open: number, left = '{', right = '}') {
  let depth = 0
  for (let index = open; index < text.length; index += 1) {
    if (text.startsWith('/*', index)) {
      const end = text.indexOf('*/', index + 2)
      index = end < 0 ? text.length : end + 1
      continue
    }
    if (text[index] === left) depth += 1
    else if (text[index] === right) {
      depth -= 1
      if (depth === 0) return { text: text.slice(open, index + 1), end: index }
    }
  }
  return { text: text.slice(open), end: text.length - 1 }
}

function lineOf(text: string, offset: number) {
  let line = 1
  for (let index = 0; index < offset && index < text.length; index += 1) if (text[index] === '\n') line += 1
  return line
}

function lineOfOffset(text: string, offset: number) {
  return lineOf(text, offset) - 1
}
