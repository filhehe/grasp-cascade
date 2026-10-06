import { CATALOG } from './catalog.ts'
import { spaceSelectors } from './engine/css.ts'
import type { Level, Scenario } from './engine/model.ts'

const CORE: Scenario[] = [
  {
    id: 'id-vs-classes',
    title: '01 · Два класса и id',
    level: 'novice',
    html: '<p id="title" class="note highlight">Заголовок</p>\n',
    css: '.note.highlight {\n  color: teal;\n}\n#title {\n  color: coral;\n}\n',
    target: 'p#title',
    properties: ['color'],
  },
  {
    id: 'source-order',
    title: '02 · Порядок в исходнике',
    level: 'novice',
    html: '<section>\n  <article>\n    <p class="card item">Текст</p>\n  </article>\n</section>\n',
    css: '.card {\n  color: tomato;\n}\n.item {\n  color: royalblue;\n}\narticle p {\n  background-color: #f3e6d8;\n}\n.card {\n  background-color: #d7f3ee;\n}\n',
    target: 'p.card',
    properties: ['color', 'background-color'],
  },
  {
    id: 'inline',
    title: '03 · Атрибут style',
    level: 'novice',
    html: '<p class="note" style="color: green">Текст</p>\n',
    css: 'p.note.note {\n  color: blue;\n}\n',
    target: 'p.note',
    properties: ['color'],
  },
  {
    id: 'important',
    title: '01 · !important',
    level: 'interview',
    html: '<p class="a b" style="color: green">Текст</p>\n',
    css: '.a {\n  color: red !important;\n}\n.b {\n  color: blue !important;\n}\n',
    target: 'p',
    properties: ['color'],
  },
  {
    id: 'layers',
    title: '02 · Слои',
    level: 'interview',
    html: '<button class="btn">Кнопка</button>\n',
    css: '@layer base, components;\n@layer base {\n  .btn {\n    background-color: gray;\n  }\n}\n@layer components {\n  .btn {\n    background-color: teal;\n  }\n}\n.btn {\n  background-color: coral;\n}\n',
    target: 'button.btn',
    properties: ['background-color'],
  },
  {
    id: 'inherit',
    title: '04 · Наследование',
    level: 'novice',
    html: '<div class="parent" style="color: navy; margin: 24px">\n  <p class="child">Абзац</p>\n</div>\n',
    css: '.parent {\n  padding: 12px;\n}\n',
    target: 'p.child',
    properties: ['color', 'margin'],
  },
]

const core = (level: Level) => CORE.filter((example) => example.level === level)
const extra = (level: Level) => CATALOG.filter((example) => example.level === level)

export const EXAMPLES: Scenario[] = [
  ...core('novice'),
  ...extra('novice'),
  ...extra('junior'),
  ...extra('middle'),
  ...extra('senior'),
  ...core('interview'),
  ...extra('interview'),
].map((example) => ({ ...example, css: spaceSelectors(example.css) }))

export const LEVELS: { id: Level | 'all'; label: string }[] = [
  { id: 'novice', label: 'Новичок' },
  { id: 'junior', label: 'Джун' },
  { id: 'middle', label: 'Мидл' },
  { id: 'senior', label: 'Синьор' },
  { id: 'interview', label: 'Собес' },
  { id: 'all', label: 'Все' },
]

export function exampleById(id: string | null) {
  return EXAMPLES.find((example) => example.id === id)
}
