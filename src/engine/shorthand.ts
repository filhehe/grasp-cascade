const ALIAS: Record<string, string> = {
  'grid-gap': 'gap',
  'grid-row-gap': 'row-gap',
  'grid-column-gap': 'column-gap',
}

const DIRECT: Record<string, string[]> = {
  margin: ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
  'margin-block': ['margin-block-start', 'margin-block-end'],
  'margin-inline': ['margin-inline-start', 'margin-inline-end'],
  padding: ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
  'padding-block': ['padding-block-start', 'padding-block-end'],
  'padding-inline': ['padding-inline-start', 'padding-inline-end'],
  'scroll-margin': ['scroll-margin-top', 'scroll-margin-right', 'scroll-margin-bottom', 'scroll-margin-left'],
  'scroll-margin-block': ['scroll-margin-block-start', 'scroll-margin-block-end'],
  'scroll-margin-inline': ['scroll-margin-inline-start', 'scroll-margin-inline-end'],
  'scroll-padding': ['scroll-padding-top', 'scroll-padding-right', 'scroll-padding-bottom', 'scroll-padding-left'],
  'scroll-padding-block': ['scroll-padding-block-start', 'scroll-padding-block-end'],
  'scroll-padding-inline': ['scroll-padding-inline-start', 'scroll-padding-inline-end'],
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-block': ['inset-block-start', 'inset-block-end'],
  'inset-inline': ['inset-inline-start', 'inset-inline-end'],
  border: ['border-width', 'border-style', 'border-color'],
  'border-width': ['border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
  'border-style': ['border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style'],
  'border-color': ['border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'],
  'border-top': ['border-top-width', 'border-top-style', 'border-top-color'],
  'border-right': ['border-right-width', 'border-right-style', 'border-right-color'],
  'border-bottom': ['border-bottom-width', 'border-bottom-style', 'border-bottom-color'],
  'border-left': ['border-left-width', 'border-left-style', 'border-left-color'],
  'border-block': ['border-block-width', 'border-block-style', 'border-block-color'],
  'border-block-width': ['border-block-start-width', 'border-block-end-width'],
  'border-block-style': ['border-block-start-style', 'border-block-end-style'],
  'border-block-color': ['border-block-start-color', 'border-block-end-color'],
  'border-inline': ['border-inline-width', 'border-inline-style', 'border-inline-color'],
  'border-inline-width': ['border-inline-start-width', 'border-inline-end-width'],
  'border-inline-style': ['border-inline-start-style', 'border-inline-end-style'],
  'border-inline-color': ['border-inline-start-color', 'border-inline-end-color'],
  'border-block-start': ['border-block-start-width', 'border-block-start-style', 'border-block-start-color'],
  'border-block-end': ['border-block-end-width', 'border-block-end-style', 'border-block-end-color'],
  'border-inline-start': ['border-inline-start-width', 'border-inline-start-style', 'border-inline-start-color'],
  'border-inline-end': ['border-inline-end-width', 'border-inline-end-style', 'border-inline-end-color'],
  'border-radius': ['border-top-left-radius', 'border-top-right-radius', 'border-bottom-right-radius', 'border-bottom-left-radius'],
  'border-image': ['border-image-source', 'border-image-slice', 'border-image-width', 'border-image-outset', 'border-image-repeat'],
  outline: ['outline-width', 'outline-style', 'outline-color'],
  background: [
    'background-image',
    'background-position-x',
    'background-position-y',
    'background-size',
    'background-repeat',
    'background-attachment',
    'background-origin',
    'background-clip',
    'background-color',
  ],
  'background-position': ['background-position-x', 'background-position-y'],
  font: ['font-style', 'font-variant-caps', 'font-weight', 'font-stretch', 'font-size', 'line-height', 'font-family'],
  'font-variant': [
    'font-variant-ligatures',
    'font-variant-caps',
    'font-variant-numeric',
    'font-variant-east-asian',
    'font-variant-alternates',
    'font-variant-position',
    'font-variant-emoji',
  ],
  'font-synthesis': ['font-synthesis-weight', 'font-synthesis-style', 'font-synthesis-small-caps'],
  flex: ['flex-grow', 'flex-shrink', 'flex-basis'],
  'flex-flow': ['flex-direction', 'flex-wrap'],
  gap: ['row-gap', 'column-gap'],
  'place-items': ['align-items', 'justify-items'],
  'place-content': ['align-content', 'justify-content'],
  'place-self': ['align-self', 'justify-self'],
  overflow: ['overflow-x', 'overflow-y'],
  'overscroll-behavior': ['overscroll-behavior-x', 'overscroll-behavior-y'],
  columns: ['column-width', 'column-count'],
  'column-rule': ['column-rule-width', 'column-rule-style', 'column-rule-color'],
  'list-style': ['list-style-type', 'list-style-position', 'list-style-image'],
  animation: [
    'animation-name',
    'animation-duration',
    'animation-timing-function',
    'animation-delay',
    'animation-iteration-count',
    'animation-direction',
    'animation-fill-mode',
    'animation-play-state',
  ],
  transition: ['transition-property', 'transition-duration', 'transition-timing-function', 'transition-delay', 'transition-behavior'],
  'text-decoration': ['text-decoration-line', 'text-decoration-style', 'text-decoration-color', 'text-decoration-thickness'],
  'text-emphasis': ['text-emphasis-style', 'text-emphasis-color'],
  'text-wrap': ['text-wrap-mode', 'text-wrap-style'],
  'white-space': ['white-space-collapse', 'text-wrap-mode'],
  'grid-template': ['grid-template-rows', 'grid-template-columns', 'grid-template-areas'],
  'grid-area': ['grid-row-start', 'grid-column-start', 'grid-row-end', 'grid-column-end'],
  'grid-row': ['grid-row-start', 'grid-row-end'],
  'grid-column': ['grid-column-start', 'grid-column-end'],
  grid: ['grid-template-rows', 'grid-template-columns', 'grid-template-areas', 'grid-auto-rows', 'grid-auto-columns', 'grid-auto-flow'],
  offset: ['offset-position', 'offset-path', 'offset-distance', 'offset-rotate', 'offset-anchor'],
  mask: ['mask-image', 'mask-position', 'mask-size', 'mask-repeat', 'mask-origin', 'mask-clip', 'mask-composite', 'mask-mode'],
  container: ['container-name', 'container-type'],
  'scroll-timeline': ['scroll-timeline-name', 'scroll-timeline-axis'],
  'view-timeline': ['view-timeline-name', 'view-timeline-axis', 'view-timeline-inset'],
  'contain-intrinsic-size': ['contain-intrinsic-width', 'contain-intrinsic-height'],
}

const BOX = new Set([
  'margin',
  'padding',
  'scroll-margin',
  'scroll-padding',
  'inset',
  'border-width',
  'border-style',
  'border-color',
  'border-radius',
])

const PAIR = new Set([
  'margin-block',
  'margin-inline',
  'padding-block',
  'padding-inline',
  'scroll-margin-block',
  'scroll-margin-inline',
  'scroll-padding-block',
  'scroll-padding-inline',
  'inset-block',
  'inset-inline',
  'border-block-width',
  'border-block-style',
  'border-block-color',
  'border-inline-width',
  'border-inline-style',
  'border-inline-color',
  'gap',
  'place-items',
  'place-content',
  'place-self',
  'overflow',
  'overscroll-behavior',
  'contain-intrinsic-size',
])

const EDGE = new Set([
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-block',
  'border-inline',
  'border-block-start',
  'border-block-end',
  'border-inline-start',
  'border-inline-end',
  'outline',
  'column-rule',
])

const BORDER_STYLE = new Set(['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'])
const WIDE = /^(initial|inherit|unset|revert|revert-layer)$/i

export function normalize(property: string) {
  const name = property.trim().toLowerCase()
  return ALIAS[name] ?? name
}

export function isShorthand(property: string) {
  const name = normalize(property)
  return name === 'all' || name in DIRECT
}

export function longhands(property: string) {
  const name = normalize(property)
  if (name === 'all') return ['all']
  const kids = DIRECT[name]
  if (!kids) return [name]
  const out: string[] = []
  const seen = new Set<string>()
  const walk = (item: string) => {
    const next = DIRECT[item]
    if (!next) {
      if (!seen.has(item)) {
        seen.add(item)
        out.push(item)
      }
      return
    }
    next.forEach(walk)
  }
  kids.forEach(walk)
  return out
}

export function sets(property: string, longhand: string) {
  const from = normalize(property)
  const to = normalize(longhand)
  if (from === to) return true
  if (from === 'all') return to !== 'all'
  const hands = longhands(from)
  if (hands.includes(to)) return true
  return isShorthand(to) && to !== 'all' && longhands(to).every((hand) => hands.includes(hand))
}

export function shares(left: string, right: string) {
  const a = normalize(left)
  const b = normalize(right)
  if (a === b) return false
  if (a === 'all' || b === 'all') return true
  const hands = new Set(longhands(a))
  return longhands(b).some((hand) => hands.has(hand))
}

export function overlapGroup(property: string, present: string[]) {
  const group = new Set<string>([property])
  let grew = true
  while (grew) {
    grew = false
    for (const name of present) {
      if (group.has(name)) continue
      if ([...group].some((item) => shares(item, name))) {
        group.add(name)
        grew = true
      }
    }
  }
  return [...group]
}

export function toggleGroup(current: string[], property: string, on: boolean, present: string[]) {
  if (on) {
    const group = overlapGroup(property, present)
    return [...current, ...group.filter((name) => !current.includes(name))]
  }
  const drop = new Set(overlapGroup(property, current))
  return current.filter((name) => !drop.has(name))
}

export function syncProperties(current: string[], present: string[]) {
  const live = current.filter((name) => present.includes(name))
  return live.reduce((list, name) => toggleGroup(list, name, true, present), live)
}

export function contested(selected: string[]) {
  const leaves = new Set<string>()
  for (const name of selected) {
    for (const hand of longhands(name)) {
      if (selected.some((other) => other !== name && sets(other, hand))) leaves.add(hand)
    }
  }
  if (!leaves.size) return [...selected]
  const out: string[] = []
  const used = new Set<string>()
  for (const name of selected) {
    const hit = longhands(name).filter((hand) => leaves.has(hand))
    if (!hit.length) {
      if (!used.has(name)) {
        used.add(name)
        out.push(name)
      }
      continue
    }
    for (const item of summarize(hit)) {
      if (!used.has(item)) {
        used.add(item)
        out.push(item)
      }
    }
  }
  return out
}

export function linkLabel(property: string, present: string[]) {
  const others = present.filter((name) => shares(property, name))
  if (!others.length) return null
  if (normalize(property) === 'all') return `сокращение, задаёт ${others.join(', ')}`
  if (!isShorthand(property)) {
    const vias = others.filter((name) => isShorthand(name) && sets(name, property))
    return vias.length ? `то же задаёт ${vias.join(', ')}` : null
  }
  const hands = longhands(property).filter((hand) => others.some((name) => sets(name, hand)))
  const shown = summarize(hands)
  return shown.length ? `сокращение, задаёт ${shown.join(', ')}` : null
}

export function componentValue(property: string, value: string, longhand: string) {
  const from = normalize(property)
  const to = normalize(longhand)
  if (from === to) return value.trim()
  const wide = value.trim()
  if (WIDE.test(wide)) return wide.toLowerCase()
  const direct = expandDirect(from, value)
  if (!direct) return value.trim()
  if (to in direct) return direct[to]
  for (const [sub, subValue] of Object.entries(direct)) {
    if (sets(sub, to)) return componentValue(sub, subValue, to)
  }
  return value.trim()
}

function summarize(hands: string[]) {
  const left = new Set(hands)
  const shown: string[] = []
  const parents = Object.keys(DIRECT).sort((a, b) => longhands(b).length - longhands(a).length)
  for (const name of parents) {
    const kids = longhands(name)
    if (kids.length < 2 || kids.some((kid) => !left.has(kid))) continue
    shown.push(name)
    kids.forEach((kid) => left.delete(kid))
  }
  for (const hand of hands) if (left.has(hand)) shown.push(hand)
  return shown
}

function expandDirect(property: string, value: string): Record<string, string> | null {
  const kids = DIRECT[property]
  if (!kids) return null
  if (BOX.has(property)) return assign(kids, box(splitTokens(head(value)), kids.length))
  if (PAIR.has(property)) return assign(kids, box(splitTokens(value), kids.length))
  if (EDGE.has(property)) return edge(value, kids)
  if (property === 'background') return background(value)
  if (property === 'background-position') return position(value)
  if (property === 'font') return font(value)
  if (property === 'font-variant') return fontVariant(value)
  if (property === 'font-synthesis') return fontSynthesis(value)
  if (property === 'flex') return flex(value)
  if (property === 'flex-flow') return flexFlow(value)
  if (property === 'columns') return columns(value)
  if (property === 'list-style') return listStyle(value)
  if (property === 'animation') return layered(value, animationLayer, kids)
  if (property === 'transition') return layered(value, transitionLayer, kids)
  if (property === 'text-decoration') return decoration(value)
  if (property === 'text-emphasis') return emphasis(value)
  if (property === 'text-wrap') return textWrap(value)
  if (property === 'white-space') return whiteSpace(value)
  if (property === 'grid-row' || property === 'grid-column') return slashPair(value, kids, 'auto')
  if (property === 'grid-area') return gridArea(value)
  if (property === 'grid-template') return gridTemplate(value)
  if (property === 'grid') return grid(value)
  if (property === 'container') return slashPair(value, kids, 'normal')
  if (property === 'scroll-timeline') return namedAxis(value, kids, 'block')
  if (property === 'view-timeline') return viewTimeline(value)
  if (property === 'mask') return mask(value)
  return assign(kids, splitTokens(value).concat(Array(kids.length).fill('initial')).slice(0, kids.length))
}

function assign(keys: string[], values: string[]) {
  return Object.fromEntries(keys.map((key, index) => [key, values[index] ?? values[0] ?? 'initial']))
}

function box(tokens: string[], count: number) {
  const [a = 'initial', b = a, c = a, d = b] = tokens
  return [a, b, c, d].slice(0, count)
}

function edge(value: string, kids: string[]) {
  let width = kids[0].endsWith('width') ? 'medium' : ''
  let style = 'none'
  let color = 'currentcolor'
  if (kids[0] === 'outline-width') width = 'medium'
  if (kids[0] === 'column-rule-width') width = 'medium'
  for (const token of splitTokens(value)) {
    if (isLineWidth(token)) width = token
    else if (BORDER_STYLE.has(token.toLowerCase())) style = token.toLowerCase()
    else color = token
  }
  if (kids.length === 3 && kids[0].includes('width')) return { [kids[0]]: width || 'medium', [kids[1]]: style, [kids[2]]: color }
  return { [kids[0]]: width || 'medium', [kids[1]]: style, [kids[2]]: color }
}

function background(value: string) {
  const layers = splitList(value).map(backgroundLayer)
  const last = layers[layers.length - 1] ?? backgroundLayer('')
  return {
    'background-image': layers.map((layer) => layer.image).join(', '),
    'background-position-x': layers.map((layer) => layer.x).join(', '),
    'background-position-y': layers.map((layer) => layer.y).join(', '),
    'background-size': layers.map((layer) => layer.size).join(', '),
    'background-repeat': layers.map((layer) => layer.repeat).join(', '),
    'background-attachment': layers.map((layer) => layer.attachment).join(', '),
    'background-origin': layers.map((layer) => layer.origin).join(', '),
    'background-clip': layers.map((layer) => layer.clip).join(', '),
    'background-color': last.color,
  }
}

function backgroundLayer(value: string) {
  const layer = { image: 'none', x: '0%', y: '0%', size: 'auto', repeat: 'repeat', attachment: 'scroll', origin: 'padding-box', clip: 'border-box', color: 'transparent' }
  const tokens = slashTokens(splitTokens(value))
  const position: string[] = []
  let sized = false
  const boxes: string[] = []
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === '/') {
      sized = true
      continue
    }
    if (sized && layer.size === 'auto') {
      const next = tokens[index + 1]
      layer.size = next && !isBackgroundKeyword(next) && !isColor(next) ? `${token} ${next}` : token
      if (layer.size !== token) index += 1
      sized = false
      continue
    }
    if (isImage(token)) {
      layer.image = token
      continue
    }
    if (isRepeat(token)) {
      const next = tokens[index + 1]
      layer.repeat = next && isRepeat(next) ? `${token} ${next}` : token
      if (layer.repeat !== token) index += 1
      continue
    }
    if (token === 'scroll' || token === 'fixed' || token === 'local') {
      layer.attachment = token
      continue
    }
    if (isBox(token)) {
      boxes.push(token)
      continue
    }
    if (isColor(token)) {
      layer.color = token
      continue
    }
    position.push(token)
  }
  if (position.length) {
    const placed = positionWords(position)
    layer.x = placed.x
    layer.y = placed.y
  }
  if (boxes[0]) layer.origin = boxes[0]
  if (boxes[1]) layer.clip = boxes[1]
  else if (boxes[0]) layer.clip = boxes[0]
  return layer
}

function position(value: string) {
  const placed = positionWords(splitTokens(value))
  return { 'background-position-x': placed.x, 'background-position-y': placed.y }
}

function positionWords(tokens: string[]) {
  if (!tokens.length) return { x: '0%', y: '0%' }
  if (tokens.length === 1) {
    if (tokens[0] === 'top' || tokens[0] === 'bottom') return { x: 'center', y: tokens[0] }
    if (tokens[0] === 'left' || tokens[0] === 'right' || tokens[0] === 'center') return { x: tokens[0], y: 'center' }
    return { x: tokens[0], y: 'center' }
  }
  const [first, second, third, fourth] = tokens
  if ((first === 'left' || first === 'right' || first === 'center') && (second === 'top' || second === 'bottom' || second === 'center')) {
    return { x: third ? `${first} ${second}` : first, y: fourth ? `${third} ${fourth}` : third && second !== 'top' && second !== 'bottom' ? second : second }
  }
  if ((first === 'top' || first === 'bottom') && (second === 'left' || second === 'right' || second === 'center')) {
    return { x: second, y: first }
  }
  return { x: first, y: second }
}

function font(value: string) {
  const system = /^(caption|icon|menu|message-box|small-caption|status-bar)$/i
  if (system.test(value.trim())) {
    const keyword = value.trim().toLowerCase()
    return {
      'font-style': keyword,
      'font-variant-caps': keyword,
      'font-weight': keyword,
      'font-stretch': keyword,
      'font-size': keyword,
      'line-height': keyword,
      'font-family': keyword,
    }
  }
  const tokens = splitTokens(value)
  let sizeAt = tokens.findIndex(isFontSize)
  if (sizeAt < 0) sizeAt = tokens.length - 1
  const sizeToken = tokens[sizeAt] ?? 'medium'
  const [size, line = 'normal'] = sizeToken.split('/')
  const family = tokens.slice(sizeAt + 1).join(' ').replace(/,\s*/g, ', ') || 'initial'
  let style = 'normal'
  let caps = 'normal'
  let weight = 'normal'
  let stretch = 'normal'
  for (const token of tokens.slice(0, sizeAt)) {
    const name = token.toLowerCase()
    if (name === 'italic' || name === 'oblique' || name.endsWith('deg') || name.endsWith('grad') || name.endsWith('rad') || name.endsWith('turn')) style = style === 'normal' ? token : `${style} ${token}`
    else if (name === 'small-caps') caps = 'small-caps'
    else if (/^(bold|bolder|lighter|[1-9]00)$/.test(name) || name === 'normal') {
      if (/^(bold|bolder|lighter|[1-9]00)$/.test(name)) weight = token
    } else stretch = token
  }
  return { 'font-style': style, 'font-variant-caps': caps, 'font-weight': weight, 'font-stretch': stretch, 'font-size': size, 'line-height': line, 'font-family': family }
}

function fontVariant(value: string) {
  const base = {
    'font-variant-ligatures': 'normal',
    'font-variant-caps': 'normal',
    'font-variant-numeric': 'normal',
    'font-variant-east-asian': 'normal',
    'font-variant-alternates': 'normal',
    'font-variant-position': 'normal',
    'font-variant-emoji': 'normal',
  }
  const name = value.trim().toLowerCase()
  if (name === 'none') return { ...base, 'font-variant-ligatures': 'none' }
  if (name === 'normal') return base
  if (name === 'small-caps') return { ...base, 'font-variant-caps': 'small-caps' }
  return { ...base, 'font-variant-ligatures': value.trim() }
}

function fontSynthesis(value: string) {
  const result = { 'font-synthesis-weight': 'none', 'font-synthesis-style': 'none', 'font-synthesis-small-caps': 'none' }
  if (value.trim().toLowerCase() === 'none') return result
  for (const token of splitTokens(value)) {
    if (token === 'weight') result['font-synthesis-weight'] = 'auto'
    if (token === 'style') result['font-synthesis-style'] = 'auto'
    if (token === 'small-caps') result['font-synthesis-small-caps'] = 'auto'
  }
  return result
}

function flex(value: string) {
  const raw = value.trim().toLowerCase()
  if (raw === 'none') return { 'flex-grow': '0', 'flex-shrink': '0', 'flex-basis': 'auto' }
  if (raw === 'auto') return { 'flex-grow': '1', 'flex-shrink': '1', 'flex-basis': 'auto' }
  const tokens = splitTokens(value)
  if (tokens.length === 1 && isFlexNumber(tokens[0])) return { 'flex-grow': tokens[0], 'flex-shrink': '1', 'flex-basis': '0%' }
  if (tokens.length === 1) return { 'flex-grow': '1', 'flex-shrink': '1', 'flex-basis': tokens[0] }
  if (tokens.length === 2 && isFlexNumber(tokens[0]) && isFlexNumber(tokens[1])) return { 'flex-grow': tokens[0], 'flex-shrink': tokens[1], 'flex-basis': '0%' }
  if (tokens.length === 2) return { 'flex-grow': tokens[0], 'flex-shrink': '1', 'flex-basis': tokens[1] }
  return { 'flex-grow': tokens[0] ?? '0', 'flex-shrink': tokens[1] ?? '1', 'flex-basis': tokens[2] ?? 'auto' }
}

function flexFlow(value: string) {
  let direction = 'row'
  let wrap = 'nowrap'
  for (const token of splitTokens(value)) {
    const name = token.toLowerCase()
    if (name === 'wrap' || name === 'nowrap' || name === 'wrap-reverse') wrap = name
    else direction = name
  }
  return { 'flex-direction': direction, 'flex-wrap': wrap }
}

function columns(value: string) {
  let width = 'auto'
  let count = 'auto'
  for (const token of splitTokens(value)) {
    if (/^\d+(\.\d+)?$/.test(token)) count = token
    else width = token
  }
  return { 'column-width': width, 'column-count': count }
}

function listStyle(value: string) {
  let type = 'disc'
  let position = 'outside'
  let image = 'none'
  for (const token of splitTokens(value)) {
    const name = token.toLowerCase()
    if (name === 'inside' || name === 'outside') position = name
    else if (isImage(token) || name === 'none') image = token
    else type = token
  }
  return { 'list-style-type': type, 'list-style-position': position, 'list-style-image': image }
}

function decoration(value: string) {
  const result = { 'text-decoration-line': 'none', 'text-decoration-style': 'solid', 'text-decoration-color': 'currentcolor', 'text-decoration-thickness': 'auto' }
  const lines: string[] = []
  for (const token of splitTokens(value)) {
    const name = token.toLowerCase()
    if (['underline', 'overline', 'line-through', 'blink', 'none', 'spelling-error', 'grammar-error'].includes(name)) lines.push(name)
    else if (['solid', 'double', 'dotted', 'dashed', 'wavy'].includes(name)) result['text-decoration-style'] = name
    else if (name === 'from-font' || name === 'auto' || isLineWidth(token)) result['text-decoration-thickness'] = token
    else result['text-decoration-color'] = token
  }
  if (lines.length) result['text-decoration-line'] = lines.join(' ')
  return result
}

function emphasis(value: string) {
  const tokens = splitTokens(value)
  const color = [...tokens].reverse().find(isColor)
  const style = tokens.filter((token) => token !== color).join(' ') || 'none'
  return { 'text-emphasis-style': style, 'text-emphasis-color': color ?? 'currentcolor' }
}

function textWrap(value: string) {
  const name = value.trim().toLowerCase()
  if (name === 'wrap' || name === 'nowrap') return { 'text-wrap-mode': name, 'text-wrap-style': 'auto' }
  return { 'text-wrap-mode': 'wrap', 'text-wrap-style': name || 'auto' }
}

function whiteSpace(value: string) {
  const name = value.trim().toLowerCase()
  const table: Record<string, [string, string]> = {
    normal: ['collapse', 'wrap'],
    nowrap: ['collapse', 'nowrap'],
    pre: ['preserve', 'nowrap'],
    'pre-wrap': ['preserve', 'wrap'],
    'pre-line': ['preserve-breaks', 'wrap'],
    'break-spaces': ['break-spaces', 'wrap'],
  }
  const [collapse, mode] = table[name] ?? [name, 'wrap']
  return { 'white-space-collapse': collapse, 'text-wrap-mode': mode }
}

function slashPair(value: string, kids: string[], fallback: string) {
  const [start = fallback, end = 'auto'] = splitList(value, '/').map((part) => part.trim())
  return { [kids[0]]: start, [kids[1]]: end || 'auto' }
}

function gridArea(value: string) {
  const parts = splitList(value, '/').map((part) => part.trim())
  const [rowStart = 'auto', columnStart = 'auto', rowEnd = 'auto', columnEnd = 'auto'] = parts
  return { 'grid-row-start': rowStart, 'grid-column-start': columnStart, 'grid-row-end': rowEnd, 'grid-column-end': columnEnd }
}

function gridTemplate(value: string) {
  const [columns = 'none', rows = 'none'] = splitList(value, '/').map((part) => part.trim())
  const areas = columns.includes('"') ? columns : 'none'
  return { 'grid-template-columns': columns, 'grid-template-rows': rows, 'grid-template-areas': areas }
}

function grid(value: string) {
  const template = gridTemplate(value)
  return { ...template, 'grid-auto-rows': 'auto', 'grid-auto-columns': 'auto', 'grid-auto-flow': 'row' }
}

function namedAxis(value: string, kids: string[], axis: string) {
  const tokens = splitTokens(value)
  return { [kids[0]]: tokens[0] ?? 'none', [kids[1]]: tokens[1] ?? axis }
}

function viewTimeline(value: string) {
  const parts = splitList(value, '/').map((part) => part.trim())
  const tokens = splitTokens(parts[0] ?? '')
  return { 'view-timeline-name': tokens[0] ?? 'none', 'view-timeline-axis': tokens[1] ?? 'block', 'view-timeline-inset': parts[1] ?? 'auto' }
}

function mask(value: string) {
  const layer = background(value)
  return {
    'mask-image': layer['background-image'],
    'mask-position': `${layer['background-position-x']} ${layer['background-position-y']}`.trim(),
    'mask-size': layer['background-size'],
    'mask-repeat': layer['background-repeat'],
    'mask-origin': layer['background-origin'],
    'mask-clip': layer['background-clip'],
    'mask-composite': 'add',
    'mask-mode': 'match-source',
  }
}

function layered(value: string, parse: (layer: string) => Record<string, string>, keys: string[]) {
  const layers = splitList(value).map(parse)
  return Object.fromEntries(keys.map((key) => [key, layers.map((layer) => layer[key] ?? 'initial').join(', ')]))
}

function animationLayer(value: string) {
  const result: Record<string, string> = {
    'animation-name': 'none',
    'animation-duration': '0s',
    'animation-timing-function': 'ease',
    'animation-delay': '0s',
    'animation-iteration-count': '1',
    'animation-direction': 'normal',
    'animation-fill-mode': 'none',
    'animation-play-state': 'running',
  }
  let times = 0
  const names: string[] = []
  for (const token of splitTokens(value)) {
    const name = token.toLowerCase()
    if (isTime(token)) {
      if (times === 0) result['animation-duration'] = token
      else result['animation-delay'] = token
      times += 1
    } else if (isTiming(token)) result['animation-timing-function'] = token
    else if (name === 'infinite' || /^\d+(\.\d+)?$/.test(name)) result['animation-iteration-count'] = token
    else if (['normal', 'reverse', 'alternate', 'alternate-reverse'].includes(name)) result['animation-direction'] = name
    else if (['none', 'forwards', 'backwards', 'both'].includes(name)) result['animation-fill-mode'] = name
    else if (name === 'running' || name === 'paused') result['animation-play-state'] = name
    else names.push(token)
  }
  if (names.length) result['animation-name'] = names.join(' ')
  return result
}

function transitionLayer(value: string) {
  const result: Record<string, string> = {
    'transition-property': 'all',
    'transition-duration': '0s',
    'transition-timing-function': 'ease',
    'transition-delay': '0s',
    'transition-behavior': 'normal',
  }
  let times = 0
  const props: string[] = []
  for (const token of splitTokens(value)) {
    const name = token.toLowerCase()
    if (isTime(token)) {
      if (times === 0) result['transition-duration'] = token
      else result['transition-delay'] = token
      times += 1
    } else if (isTiming(token)) result['transition-timing-function'] = token
    else if (name === 'normal' || name === 'allow-discrete') result['transition-behavior'] = name
    else props.push(token)
  }
  if (props.length) result['transition-property'] = props.join(' ')
  return result
}

function splitTokens(value: string) {
  const tokens: string[] = []
  let current = ''
  let depth = 0
  let quote = ''
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index]
    if (quote) {
      current += char
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      current += char
      continue
    }
    if (char === '(') depth += 1
    if (char === ')' && depth > 0) depth -= 1
    if (depth === 0 && /\s/.test(char)) {
      if (current) tokens.push(current)
      current = ''
      continue
    }
    current += char
  }
  if (current) tokens.push(current)
  return tokens
}

function splitList(value: string, separator = ',') {
  const parts: string[] = []
  let current = ''
  let depth = 0
  let quote = ''
  for (const char of value) {
    if (quote) {
      current += char
      if (char === quote) quote = ''
      continue
    }
    if (char === '"' || char === "'") quote = char
    if (char === '(') depth += 1
    if (char === ')' && depth > 0) depth -= 1
    if (char === separator && depth === 0 && !quote) {
      if (current.trim()) parts.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  if (current.trim()) parts.push(current.trim())
  return parts.length ? parts : ['']
}

function slashTokens(tokens: string[]) {
  return tokens.flatMap((token) => {
    if (!token.includes('/') || token.includes('(')) return [token]
    const [left, right] = token.split('/')
    return [left, '/', right].filter(Boolean)
  })
}

function head(value: string) {
  return splitList(value, '/')[0] ?? value
}

function isColor(token: string) {
  if (/^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(token)) return true
  if (/^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(/i.test(token)) return true
  if (isBackgroundKeyword(token) || isImage(token) || isRepeat(token) || isLineWidth(token)) return false
  return /^[a-z-]+$/i.test(token)
}

function isImage(token: string) {
  return /^(?:url|image|image-set|element|linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient|repeating-conic-gradient)\(/i.test(token) || token.toLowerCase() === 'none'
}

function isRepeat(token: string) {
  return ['repeat', 'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round'].includes(token.toLowerCase())
}

function isBox(token: string) {
  return ['border-box', 'padding-box', 'content-box', 'text'].includes(token.toLowerCase())
}

function isBackgroundKeyword(token: string) {
  const name = token.toLowerCase()
  return isRepeat(name) || isBox(name) || ['scroll', 'fixed', 'local', 'left', 'right', 'top', 'bottom', 'center', 'cover', 'contain', 'auto', 'none'].includes(name)
}

function isLineWidth(token: string) {
  return /^(thin|medium|thick|0|-?\d+(\.\d+)?[a-z%]+)$/i.test(token)
}

function isFontSize(token: string) {
  const name = token.toLowerCase().split('/')[0]
  return /^(xx-small|x-small|small|medium|large|x-large|xx-large|xxx-large|larger|smaller|0|-?\d+(\.\d+)?[a-z%]+)$/.test(name)
}

function isFlexNumber(token: string) {
  return /^\d+(\.\d+)?$/.test(token)
}

function isTime(token: string) {
  return /^-?\d+(\.\d+)?m?s$/i.test(token)
}

function isTiming(token: string) {
  const name = token.toLowerCase()
  return ['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'step-start', 'step-end'].includes(name) || /^(?:cubic-bezier|steps)\(/i.test(token)
}
