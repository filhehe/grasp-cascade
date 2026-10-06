// Открытие селекта вешало вкладку: обработчик scroll вызывал place(),
// тот читал offsetHeight и писал style.left/top/width. Запись позиции
// снова слала scroll, а флаг re-entry сбрасывался до следующего события.
// Меню стоит на CSS. Этот файл входит в npm test.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { scrollOptionIntoList } from './selectOpen'

const selectSource = readFileSync(new URL('./Select.tsx', import.meta.url), 'utf8')

function openSelect(trackScroll: boolean) {
  let calls = 0
  let top = 0
  const queue: Array<() => void> = []
  const handlers: Array<() => void> = []
  const place = () => {
    calls += 1
    if (calls > 20) throw new Error('select open hangs: scroll listener writes menu position')
    const next = top === 100 ? 40 : 100
    if (top !== next) {
      top = next
      if (trackScroll) queue.push(() => handlers.forEach((handler) => handler()))
    }
  }
  if (trackScroll) handlers.push(place)
  place()
  while (queue.length > 0) queue.shift()?.()
  return calls
}

assert.throws(() => openSelect(true), /select open hangs/)
assert.equal(openSelect(false), 1)

assert.doesNotMatch(selectSource, /addEventListener\(\s*['"]scroll['"]/)
assert.doesNotMatch(selectSource, /scrollWidth|getBoundingClientRect|offsetHeight|createPortal|placeMenu/)
assert.doesNotMatch(selectSource, /style\.(top|left|width)/)
assert.match(selectSource, /scrollOptionIntoList/)

const list = { scrollTop: 0, clientHeight: 216 }
const below = { offsetTop: 800, offsetHeight: 36 }
scrollOptionIntoList(list, below)
assert.equal(list.scrollTop, 620)
scrollOptionIntoList(list, below)
assert.equal(list.scrollTop, 620)

const above = { offsetTop: 10, offsetHeight: 36 }
scrollOptionIntoList(list, above)
assert.equal(list.scrollTop, 10)
scrollOptionIntoList(list, above)
assert.equal(list.scrollTop, 10)

const tall = { scrollTop: 40, clientHeight: 30 }
const taller = { offsetTop: 0, offsetHeight: 80 }
scrollOptionIntoList(tall, taller)
assert.equal(tall.scrollTop, 0)
scrollOptionIntoList(tall, taller)
assert.equal(tall.scrollTop, 0)

console.log('select open ok')
