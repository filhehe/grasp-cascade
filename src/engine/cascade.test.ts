import assert from 'node:assert/strict'
import { EXAMPLES } from '../examples.ts'
import { buildRun, restingStyle } from './cascade.ts'
import { indentCssKey } from '../cssIndent.ts'
import { focusProperty, keepSelectorNotes, parseDocument, parseSelector, propertyHits, resolveElement, selectorNotes, sourceUsage, spaceSelectors, specificityOf } from './css.ts'
import { componentValue, contested, linkLabel, shares, syncProperties, toggleGroup } from './shorthand.ts'
import type { Scenario } from './model.ts'

function run(scenario: Scenario) {
  const result = buildRun(scenario)
  assert.equal(result.error, null, result.error ?? '')
  const last = result.steps.at(-1)
  assert.ok(last, scenario.id)
  return { ...result, last }
}

function decision(scenario: Scenario, property: string) {
  return run(scenario).last.decisions[property]
}

const byId = Object.fromEntries(EXAMPLES.map((example) => [example.id, example])) as Record<string, Scenario>

const absent = /Слоёв @layer нет|Флага !important нет|Происхождение одно|подходит для|в разбор не входят|Дальше сравниваются только/

for (const level of ['novice', 'junior', 'middle', 'senior', 'interview'] as const) {
  assert.equal(EXAMPLES.filter((example) => example.level === level).length, 20, level)
}

for (const example of EXAMPLES) {
  const result = run(example)
  assert.ok(result.steps.length >= 2 && result.steps.length <= 24, `${example.id} ${result.steps.length} steps`)
  for (const step of result.steps) assert.doesNotMatch(step.message, absent, `${example.id}: ${step.message}`)
}

{
  const color = decision(byId['id-vs-classes'], 'color')
  assert.equal(color.value, 'coral')
  assert.equal(color.kind, 'decl')
  assert.match(color.summary, /\(1, 0, 0\)/)
  assert.match(color.summary, /\(0, 2, 0\)/)
  assert.match(color.summary, /id 1 против 0/)
  const steps = run(byId['id-vs-classes']).steps
  const dropped = steps.flatMap((step) => step.candidates).find((item) => item.selector === '.note.highlight' && item.state === 'out')
  assert.equal(dropped?.reasonText, 'ниже специфичность')
  const text = steps.map((step) => step.message).join('\n')
  assert.match(text, /класс \.note \+ класс \.highlight/)
  assert.match(text, /id #title/)
}

{
  const result = run(byId['source-order'])
  assert.equal(result.last.decisions.color.value, 'royalblue')
  assert.equal(result.last.decisions['background-color'].value, '#d7f3ee')
  const colorStep = result.steps.find((step) => step.decisions.color?.value === 'royalblue')
  const loser = colorStep?.candidates.find((item) => item.selector === '.card' && item.value === 'tomato')
  assert.equal(loser?.reasonText, 'раньше в исходнике')
  const bg = result.steps.find((step) => step.decisions['background-color'])
  const lighter = bg?.candidates.find((item) => item.selector === 'article p')
  assert.equal(lighter?.reasonText, 'ниже специфичность')
}

{
  assert.equal(decision(byId['s-inline-important'], 'color').value, 'black')
  assert.equal(decision(byId['s-important-reverses'], 'color').value, 'blue')
  assert.equal(decision(byId['s-matuzovic'], 'color').value, 'green')
}

{
  const color = decision(byId.inline, 'color')
  assert.equal(color.value, 'green')
  assert.match(color.summary, /атрибут style на элементе конкретнее селектора/i)
  const dropped = run(byId.inline).steps.flatMap((step) => step.candidates).find((item) => item.selector === 'p.note.note' && item.state === 'out')
  assert.equal(dropped?.reasonText, 'inline выше селектора')
}

{
  const result = run(byId.important)
  assert.equal(result.last.decisions.color.value, 'blue')
  const winnerStep = [...result.steps].reverse().find((step) => step.decisions.color?.value === 'blue')
  assert.equal(winnerStep?.candidates.find((item) => item.selector === 'style')?.reasonText, 'обычное против !important')
  assert.equal(winnerStep?.candidates.find((item) => item.selector === '.a')?.reasonText, 'раньше в исходнике')
  assert.equal(winnerStep?.candidates.find((item) => item.selector === '.b')?.state, 'winner')
}

{
  const bg = decision(byId.layers, 'background-color')
  assert.equal(bg.value, 'coral')
  assert.match(bg.summary, /вне @layer сильнее/i)
  const winnerStep = [...run(byId.layers).steps].reverse().find((step) => step.decisions['background-color'])
  assert.equal(winnerStep?.candidates.find((item) => item.layer === 'base')?.reasonText, 'слой слабее')
  assert.equal(winnerStep?.candidates.find((item) => item.layer === 'components')?.reasonText, 'слой слабее')
}

{
  const result = run(byId.inherit)
  assert.equal(result.last.decisions.color.kind, 'inherit')
  assert.equal(result.last.decisions.color.value, 'navy')
  assert.equal(result.last.decisions.margin.kind, 'initial')
  assert.equal(result.last.decisions.margin.value, '0')
  assert.ok(result.steps.some((step) => step.message.includes('не наследуется')))
}

{
  const where = parseSelector(':where(.note)')
  const is = parseSelector(':is(#title, .note)')
  const not = parseSelector(':not(#title)')
  assert.ok(where && is && not)
  assert.deepEqual(specificityOf(where), { a: 0, b: 0, c: 0 })
  assert.deepEqual(specificityOf(is), { a: 1, b: 0, c: 0 })
  assert.deepEqual(specificityOf(not), { a: 1, b: 0, c: 0 })
}

{
  const css = spaceSelectors('p.note.note {\n  color: blue;\n}\n.a, #b {\n  color: red;\n}\n:where(.note) { color: teal; }\n:is(#title, .note) { color: gold; }\n')
  const notes = selectorNotes(css, parseDocument('<p class="note"></p>', css).blocks)
  assert.equal(notes.lead?.label, '(0, 2, 1)')
  const lines = css.split('\n')
  const second = lines.indexOf('.a,')
  const third = lines.indexOf('#b {')
  assert.equal(lines[second - 1], '')
  assert.equal(lines[second - 2], '')
  assert.equal(notes.lines[second - 1]?.label, '(0, 1, 0)')
  assert.equal(notes.lines[second - 2], null)
  assert.equal(lines[third - 1], '')
  assert.equal(lines[third - 2], '')
  assert.equal(notes.lines[third - 1]?.label, '(1, 0, 0)')
  assert.deepEqual(
    notes.lines.flatMap((note) => (note ? [note.label] : [])),
    ['(0, 1, 0)', '(1, 0, 0)', '(0, 0, 0)', '(1, 0, 0)'],
  )
}

{
  const css = spaceSelectors('p {\n  color: red;\n}\n@layer B {\n  body p {\n    color: blue;\n  }\n}\n@layer C {\n  p {\n    color: green;\n  }\n}')
  const notes = selectorNotes(css, parseDocument('<p>Hello</p>', css).blocks)
  const lines = css.split('\n')
  const layers = lines.flatMap((line, index) => (line.trimStart().startsWith('@layer') ? [index] : []))
  const inner = lines.findIndex((line) => line.trim() === 'body p {')
  assert.deepEqual(layers.map((index) => lines[index - 1]), ['', ''])
  assert.equal(lines[inner - 1], '')
  assert.equal(lines[inner - 2], '')
  assert.equal(notes.lines[inner - 1]?.label, '(0, 0, 2)')
  assert.equal(notes.lines[inner - 2], null)
  assert.equal(spaceSelectors(css), css)
}

{
  const before = '.a {\n  color: teal;\n}\n\n\n#b {\n  color: coral;\n}\n'
  const propertyEdit = '.a {\n  color: red;\n}\n\n\n#b {\n  color: navy;\n}\n'
  const selectorEdit = '.a.a {\n  color: red;\n}\n\n\n#b {\n  color: navy;\n}\n'
  const held = keepSelectorNotes(null, before)
  const same = keepSelectorNotes(held, propertyEdit)
  assert.equal(same, held)
  assert.equal(held.notes.lead?.label, '(0, 1, 0)')
  const next = keepSelectorNotes(held, selectorEdit)
  assert.notEqual(next, held)
  assert.equal(next.notes.lead?.label, '(0, 2, 0)')
  assert.equal(next.notes.lines.find((note) => note?.label === '(1, 0, 0)')?.label, '(1, 0, 0)')
}

{
  const result = buildRun({
    html: '<p class="note">Текст</p>',
    css: 'p { color: not-a-color; }\np { color: teal; }\n',
    target: 'p',
    properties: ['color'],
  })
  assert.equal(result.steps.at(-1)?.decisions.color.value, 'teal')
  assert.ok(result.steps.some((step) => step.candidates.some((item) => item.reasonText === 'невалидное значение')))
}

{
  const result = buildRun({
    html: '<p>Текст</p>',
    css: '@media (min-width: 1px) {\n  p { color: red; }\n}\np { color: blue; }\n',
    target: 'p',
    properties: ['color'],
  })
  assert.equal(result.steps.at(-1)?.decisions.color.value, 'blue')
  assert.ok(result.notices.some((notice) => notice.message.includes('не разобрано')))
}

{
  const doc = parseDocument('<p class="a">Текст</p>', '.a:hover { color: red; }\n.a { color: teal; }\n')
  const result = buildRun({
    html: '<p class="a">Текст</p>',
    css: '.a:hover { color: red; }\n.a { color: teal; }\n',
    target: 'p',
    properties: ['color'],
  })
  assert.equal(doc.notices.length, 0)
  assert.equal(result.steps.at(-1)?.decisions.color.value, 'teal')
}

{
  const earlier = buildRun({
    html: '<button class="btn">Кнопка</button>',
    css: '@layer base, components;\n@layer base {\n  .btn { color: gray !important; }\n}\n@layer components {\n  .btn { color: teal !important; }\n}\n.btn { color: coral !important; }\n',
    target: 'button',
    properties: ['color'],
  })
  assert.equal(earlier.steps.at(-1)?.decisions.color.value, 'gray')
  assert.equal(
    earlier.steps.at(-1)?.candidates.find((item) => item.value === 'coral')?.reasonText,
    'слой слабее',
  )
}

{
  const unknown = buildRun({
    html: '<p>Текст</p>',
    css: 'p::before { color: red; }\np { color: teal; }\n',
    target: 'p',
    properties: ['color'],
  })
  assert.equal(unknown.steps.at(-1)?.decisions.color.value, 'teal')
  assert.ok(unknown.notices.some((notice) => notice.message.includes('не разобран')))
}

{
  const html = '<h1 class="card item">Текст</h1>\n'
  const css = byId['source-order'].css
  const result = buildRun({ html, css, target: 'p.card', properties: ['color', 'background-color'] })
  assert.equal(result.error, null)
  assert.equal(result.steps.at(-1)?.decisions.color.value, 'royalblue')
  assert.equal(result.steps.at(-1)?.decisions['background-color'].value, '#d7f3ee')
  const usage = sourceUsage(html, css, 'p.card')
  const article = css.indexOf('article p')
  const cardRule = css.indexOf('.card')
  assert.ok(usage.cssUnused.some((span) => article >= span.start && article < span.end))
  assert.ok(!usage.cssUnused.some((span) => cardRule >= span.start && cardRule < span.end))
  const tag = html.indexOf('h1')
  const cardClass = html.indexOf('card')
  const itemClass = html.indexOf('item')
  assert.ok(!usage.htmlUnused.some((span) => tag >= span.start && tag < span.end))
  assert.ok(!usage.htmlUnused.some((span) => cardClass >= span.start && cardClass < span.end))
  assert.ok(!usage.htmlUnused.some((span) => itemClass >= span.start && itemClass < span.end))
  const articleBlock = usage.cssUnused.find((span) => article >= span.start && article < span.end)
  assert.equal(css.slice(articleBlock?.start ?? 0, articleBlock?.end ?? 0), 'article p')
  assert.match(articleBlock?.reason ?? '', /не совпадает ни с одним элементом/)
}

{
  const matched = sourceUsage(byId['source-order'].html, byId['source-order'].css, 'p.card')
  assert.equal(matched.cssUnused.length, 0)
  assert.equal(matched.htmlUnused.length, 0)
}

{
  const html = '<p id="title" class="note extra">Заголовок</p>\n'
  const css = byId['id-vs-classes'].css
  const usage = sourceUsage(html, css, 'p#title')
  const tag = html.indexOf('p')
  const extra = html.indexOf('extra')
  assert.ok(!usage.htmlUnused.some((span) => tag >= span.start && tag < span.end))
  assert.equal(usage.htmlUnused.length, 1)
  assert.equal(usage.htmlUnused[0].start, extra)
  assert.match(usage.htmlUnused[0].reason, /Класс \.extra/)
  const missed = usage.cssUnused.find((span) => css.slice(span.start, span.end).includes('.note.highlight'))
  assert.match(missed?.reason ?? '', /не совпадает ни с одним элементом/)
  assert.equal(css.slice(missed?.start ?? 0, missed?.end ?? 0), '.note.highlight')
}

{
  const css = `${byId.inherit.css}.parent, .ffdf {\n}\n`
  const usage = sourceUsage(byId.inherit.html, css, 'p.child')
  const parentRule = css.indexOf('.parent')
  const stray = css.indexOf('.ffdf')
  assert.ok(!usage.cssUnused.some((span) => parentRule >= span.start && parentRule < span.end))
  const missed = usage.cssUnused.find((span) => stray >= span.start && stray < span.end)
  assert.equal(css.slice(missed?.start ?? 0, missed?.end ?? 0), '.ffdf')
  assert.match(missed?.reason ?? '', /не совпадает ни с одним элементом/)
  const child = byId.inherit.html.indexOf('child')
  const parentClass = byId.inherit.html.indexOf('parent')
  assert.ok(!usage.htmlUnused.some((span) => child >= span.start && child < span.end))
  assert.ok(!usage.htmlUnused.some((span) => parentClass >= span.start && parentClass < span.end))
}

{
  const hits = propertyHits(byId.inherit.css)
  assert.equal(byId.inherit.css.slice(hits[0].start, hits[0].end), 'padding')
  const next = focusProperty(byId.inherit.html, byId.inherit.css, 'p.child', 'padding', ['.parent'])
  assert.equal(next.target, '.parent')
  assert.deepEqual(next.properties, ['padding'])
  const result = buildRun({ html: byId.inherit.html, css: byId.inherit.css, ...next })
  assert.equal(result.error, null)
  assert.equal(result.steps.at(-1)?.decisions.padding.value, '12px')
}

{
  const next = focusProperty(byId['source-order'].html, byId['source-order'].css, 'p.card', 'color', ['.card'])
  assert.equal(next.target, 'p.card')
  assert.deepEqual(next.properties, ['color'])
}

{
  const opened = indentCssKey('.ffdf', 5, 5, '{')
  assert.equal(opened?.value, '.ffdf {\n  \n}')
  assert.equal(opened?.caret, 10)
  const entered = indentCssKey('.parent {', 9, 9, 'Enter')
  assert.equal(entered?.value, '.parent {\n  ')
  assert.equal(entered?.caret, 12)
  const closed = indentCssKey('.parent {\n  ', 12, 12, '}')
  assert.equal(closed?.value, '.parent {\n}')
  const kept = indentCssKey('.parent {\n  padding: 12px', 25, 25, 'Enter')
  assert.equal(kept?.value, '.parent {\n  padding: 12px\n  ')
  const media = indentCssKey('@media (min-width: 600px)', 25, 25, '{')
  assert.equal(media?.value, '@media (min-width: 600px) {\n  \n}')
  assert.equal(indentCssKey('  color: red', 12, 12, '{'), null)
}

{
  const html = byId['source-order'].html
  const css = '.card {\n  color: tomato;\n}\n.item {\n  color: royalblue;\n}\narticle p {\n  background-color: #f3e6d8;\n}\n.card {\n  background: #d7f3ee;\n}\n'
  const result = buildRun({ html, css, target: 'p.card', properties: ['background-color', 'background'] })
  assert.equal(result.steps.at(-1)?.decisions['background-color'].value, '#d7f3ee')
  assert.match(result.steps.map((step) => step.message).join('\n'), /сокращение background[\s\S]*background-color[\s\S]*#d7f3ee/)
  const card = result.steps.flatMap((step) => step.candidates).find((item) => item.via === 'background')
  assert.equal(card?.value, '#d7f3ee')
  assert.equal(contested(['background-color', 'background']).join(','), 'background-color')
  assert.equal(contested(['color', 'background-color']).join(','), 'color,background-color')
  assert.equal(linkLabel('background', ['background', 'background-color']), 'сокращение, задаёт background-color')
  assert.equal(linkLabel('background-color', ['background', 'background-color']), 'то же задаёт background')
}

{
  assert.equal(shares('color', 'background'), false)
  assert.equal(shares('margin', 'margin-top'), true)
  assert.equal(shares('border', 'border-top-color'), true)
  assert.equal(shares('all', 'color'), true)
  assert.equal(componentValue('background', '#d7f3ee', 'background-color'), '#d7f3ee')
  assert.equal(componentValue('background', 'url(a.png)', 'background-color'), 'transparent')
  assert.equal(componentValue('margin', '8px 4px', 'margin-top'), '8px')
  assert.equal(componentValue('margin', '8px 4px', 'margin-left'), '4px')
  assert.equal(componentValue('padding', '12px', 'padding-bottom'), '12px')
  assert.equal(componentValue('border', '1px solid red', 'border-color'), 'red')
  assert.equal(componentValue('border', '1px solid red', 'border-top-width'), '1px')
  assert.equal(componentValue('font', 'italic bold 16px/1.4 Georgia, sans-serif', 'font-size'), '16px')
  assert.equal(componentValue('font', 'italic bold 16px/1.4 Georgia, sans-serif', 'font-weight'), 'bold')
  assert.equal(componentValue('font', 'italic bold 16px/1.4 Georgia, sans-serif', 'line-height'), '1.4')
  assert.equal(componentValue('flex', '1', 'flex-grow'), '1')
  assert.equal(componentValue('flex', '1', 'flex-basis'), '0%')
  assert.equal(componentValue('gap', '8px 12px', 'column-gap'), '12px')
  assert.equal(componentValue('overflow', 'hidden auto', 'overflow-y'), 'auto')
  assert.equal(componentValue('inset', '10px 20px', 'left'), '20px')
  assert.equal(componentValue('outline', '2px solid navy', 'outline-color'), 'navy')
  assert.equal(componentValue('all', 'unset', 'color'), 'unset')
  assert.equal(componentValue('place-items', 'center stretch', 'justify-items'), 'stretch')
  assert.equal(componentValue('columns', '2 12em', 'column-count'), '2')
  assert.equal(componentValue('transition', 'color 200ms ease 50ms', 'transition-duration'), '200ms')
  assert.equal(componentValue('white-space', 'nowrap', 'text-wrap-mode'), 'nowrap')
  assert.deepEqual(toggleGroup(['background-color'], 'background-color', true, ['background-color', 'background']), ['background-color', 'background'])
  assert.deepEqual(toggleGroup(['background-color', 'background', 'color'], 'background', false, ['background-color', 'background', 'color']), ['color'])
  assert.deepEqual(syncProperties(['background-color'], ['background-color', 'background']), ['background-color', 'background'])
  const margin = buildRun({
    html: '<p class="card">Текст</p>\n',
    css: 'p {\n  margin: 8px 4px;\n}\n.card {\n  margin-top: 1px;\n}\n',
    target: 'p.card',
    properties: ['margin', 'margin-top'],
  })
  assert.equal(margin.steps.at(-1)?.decisions['margin-top'].value, '1px')
  assert.match(margin.steps.map((step) => step.message).join('\n'), /сокращение margin[\s\S]*margin-top[\s\S]*8px/)
}

{
  const html = '<h1 class="main-heading">This is my heading.</h1>'
  const css = '.main-heading {\n  color: red;\n}\nh1 {\n  color: #f55;\n  border: 2px solid;\n}\n'
  const doc = parseDocument(html, css)
  const element = resolveElement(doc.elements, 'h1.main-heading')
  assert.ok(element)
  const resting = restingStyle(element, doc, ['color'])
  assert.equal(resting.border, '2px solid')
  assert.equal(resting.color, undefined)
  const run = buildRun({ html, css, target: 'h1.main-heading', properties: ['color'] })
  assert.equal(run.steps.some((step) => step.property === 'border'), false)
  const both = restingStyle(element, doc, [])
  assert.equal(both.color, 'red')
  assert.equal(both.border, '2px solid')
  const stronger = parseDocument(html, 'h1 {\n  border: 1px solid;\n}\n.main-heading {\n  border: 4px dashed;\n}\n')
  assert.equal(restingStyle(resolveElement(stronger.elements, 'h1')!, stronger, []).border, '4px dashed')
}

console.log(EXAMPLES.map((example) => `${example.id} ${run(example).steps.length}`).join('\n'))
console.log('ok')
