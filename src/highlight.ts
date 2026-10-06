export type Token = { text: string; kind: 'plain' | 'keyword' | 'string' | 'number' | 'comment' | 'punct' | 'property' | 'selector' }

export function highlight(source: string, mode: 'css' | 'html') {
  return source.split('\n').map((line) => (mode === 'css' ? cssLine(line) : htmlLine(line)))
}

function cssLine(line: string): Token[] {
  const tokens: Token[] = []
  const pattern =
    /\/\*.*?\*\/|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|!important|@[a-zA-Z-]+|#[\w-]+|\.[\w-]+|-?\d+(?:\.\d+)?(?:px|em|rem|%)?|[{}():;,>\[]|\]|[a-zA-Z_][\w-]*/g
  let cursor = 0
  for (const match of line.matchAll(pattern)) {
    const text = match[0]
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: line.slice(cursor, index), kind: 'plain' })
    tokens.push({ text, kind: cssKind(text, line, index) })
    cursor = index + text.length
  }
  if (cursor < line.length) tokens.push({ text: line.slice(cursor), kind: 'plain' })
  return tokens.length ? tokens : [{ text: '', kind: 'plain' }]
}

function cssKind(text: string, line: string, index: number): Token['kind'] {
  if (text.startsWith('/*')) return 'comment'
  if (text.startsWith('"') || text.startsWith("'")) return 'string'
  if (text === '!important' || text.startsWith('@')) return 'keyword'
  if (text.startsWith('#') || text.startsWith('.')) return 'selector'
  if (/^-?\d/.test(text)) return 'number'
  if (/^[{}():;,>\[\]]$/.test(text)) return 'punct'
  const rest = line.slice(index + text.length)
  if (/^\s*:/.test(rest) && !/^\s*:\s*(?:hover|is|where|not)\b/.test(rest)) return 'property'
  return 'selector'
}

function htmlLine(line: string): Token[] {
  const tokens: Token[] = []
  const pattern = /<!--.*?-->|<\/?[a-zA-Z][\w-]*|\/?>|=|"[^"]*"|'[^']*'|[^\s<>="']+/g
  let cursor = 0
  for (const match of line.matchAll(pattern)) {
    const text = match[0]
    const index = match.index ?? 0
    if (index > cursor) tokens.push({ text: line.slice(cursor, index), kind: 'plain' })
    let kind: Token['kind'] = 'plain'
    if (text.startsWith('<!--')) kind = 'comment'
    else if (text.startsWith('<')) kind = 'keyword'
    else if (text.startsWith('"') || text.startsWith("'")) kind = 'string'
    else if (text === '=' || text === '>' || text === '/>') kind = 'punct'
    else kind = 'property'
    tokens.push({ text, kind })
    cursor = index + text.length
  }
  if (cursor < line.length) tokens.push({ text: line.slice(cursor), kind: 'plain' })
  return tokens.length ? tokens : [{ text: '', kind: 'plain' }]
}
