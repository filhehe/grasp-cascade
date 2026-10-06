export type Level = 'novice' | 'junior' | 'middle' | 'senior' | 'interview'

export type Origin = 'user-agent' | 'user' | 'author'

export type Specificity = { a: number; b: number; c: number }

export type Reason = 'specificity' | 'order' | 'important' | 'layer' | 'origin' | 'invalid' | 'not-inherited'

export type Simple =
  | { kind: 'type'; name: string }
  | { kind: 'class'; name: string }
  | { kind: 'id'; name: string }
  | { kind: 'attr'; name: string; value?: string }
  | { kind: 'pseudo'; name: 'hover' | 'where' | 'is' | 'not'; args: Selector[] }

export type Compound = Simple[]

export type Selector = {
  text: string
  compounds: Compound[]
  combinators: (' ' | '>')[]
}

export type ElementNode = {
  tag: string
  id: string
  classes: string[]
  attrs: Record<string, string>
  inline: { property: string; value: string; important: boolean; line: number }[]
  children: Node[]
  parent: ElementNode | null
}

export type TextNode = { text: string; parent: ElementNode | null }

export type Node = ElementNode | TextNode

export type Decl = {
  id: string
  property: string
  value: string
  important: boolean
  selectorText: string
  selector: Selector | null
  origin: Origin
  layer: string | null
  specificity: Specificity
  inline: boolean
  order: number
  line: number
  invalid: string | null
}

export type Notice = { line: number; message: string }

export type CandidateState = 'pending' | 'out' | 'leader' | 'winner'

export type Candidate = {
  id: string
  selector: string
  value: string
  origin: Origin
  layer: string | null
  important: boolean
  specificity: Specificity
  inline: boolean
  order: number
  line: number
  state: CandidateState
  reason: Reason | null
  reasonText: string | null
  via: string | null
}

export type Decision = {
  property: string
  value: string
  summary: string
  kind: 'decl' | 'inherit' | 'initial'
}

export type Step = {
  message: string
  property: string | null
  line: number | null
  focusId: string | null
  candidates: Candidate[]
  decisions: Record<string, Decision>
}

export type Scenario = {
  id: string
  title: string
  level: Level
  html: string
  css: string
  target: string
  properties: string[]
}

export function isElement(node: Node): node is ElementNode {
  return 'tag' in node
}

export const ZERO: Specificity = { a: 0, b: 0, c: 0 }

export function formatSpec(spec: Specificity) {
  return `(${spec.a}, ${spec.b}, ${spec.c})`
}

export function originLabel(origin: Origin) {
  if (origin === 'author') return 'автор'
  if (origin === 'user') return 'пользователь'
  return 'user-agent'
}

export function layerLabel(layer: string | null) {
  return layer ? `слой ${layer}` : 'без слоя'
}

export function reasonLabel(reason: Reason) {
  if (reason === 'specificity') return 'ниже специфичность'
  if (reason === 'order') return 'раньше в исходнике'
  if (reason === 'important') return 'обычное против !important'
  if (reason === 'layer') return 'слой слабее'
  if (reason === 'origin') return 'user-agent против author'
  if (reason === 'invalid') return 'невалидное значение'
  return 'не наследуется'
}
