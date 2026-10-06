export function indentCssKey(value: string, start: number, end: number, key: string) {
  if (start !== end) return null
  if (key === '{') return openBrace(value, start)
  if (key === 'Enter') return breakLine(value, start)
  if (key === '}') return closeBrace(value, start)
  if (key === 'Tab') return indentLine(value, start, false)
  if (key === 'ShiftTab') return indentLine(value, start, true)
  return null
}

function openBrace(value: string, start: number) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const before = value.slice(lineStart, start)
  const rest = value.slice(start).split('\n')[0]
  if (!/^\s*$/.test(rest) || declarationLine(before)) return null
  const indent = before.match(/^[ \t]*/)?.[0] ?? ''
  const gap = /\s$/.test(before) ? '' : ' '
  const insert = `${gap}{\n${indent}  \n${indent}}`
  const next = value.slice(0, start) + insert + value.slice(start + rest.length)
  return { value: next, caret: start + gap.length + indent.length + 4 }
}

function breakLine(value: string, start: number) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const before = value.slice(lineStart, start)
  const indent = before.match(/^[ \t]*/)?.[0] ?? ''
  const opens = /{\s*$/.test(before)
  const inner = indent + (opens ? '  ' : '')
  const closes = opens && /^\s*\}/.test(value.slice(start))
  const insert = closes ? `\n${inner}\n${indent}` : `\n${inner}`
  return { value: value.slice(0, start) + insert + value.slice(start), caret: start + 1 + inner.length }
}

function closeBrace(value: string, start: number) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const before = value.slice(lineStart, start)
  if (!/^[ \t]+$/.test(before)) return null
  const unit = before[0] === '\t' ? 1 : 2
  if (before.length < unit) return null
  const dedented = before.slice(0, before.length - unit)
  const next = value.slice(0, lineStart) + dedented + '}' + value.slice(start)
  return { value: next, caret: lineStart + dedented.length + 1 }
}

function indentLine(value: string, start: number, out: boolean) {
  const lineStart = value.lastIndexOf('\n', start - 1) + 1
  const lineEnd = value.indexOf('\n', start)
  const end = lineEnd < 0 ? value.length : lineEnd
  const line = value.slice(lineStart, end)
  if (out) {
    const unit = line.startsWith('\t') ? 1 : line.startsWith('  ') ? 2 : line.startsWith(' ') ? 1 : 0
    if (!unit) return null
    const next = value.slice(0, lineStart) + line.slice(unit) + value.slice(end)
    return { value: next, caret: Math.max(lineStart, start - unit) }
  }
  const next = value.slice(0, lineStart) + '  ' + line + value.slice(end)
  return { value: next, caret: start + 2 }
}

function declarationLine(before: string) {
  let depth = 0
  for (const char of before) {
    if (char === '(') depth += 1
    else if (char === ')') depth = Math.max(0, depth - 1)
    else if (char === ':' && depth === 0) return true
  }
  return false
}
