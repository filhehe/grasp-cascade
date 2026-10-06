import { declarationsFor, inherits, initialValue, parseDocument, resolveElement, specificityOf } from './css.ts'
import { componentValue, contested, sets, shares } from './shorthand.ts'
import {
  ZERO,
  formatSpec,
  type Candidate,
  type CandidateState,
  type Decl,
  type Decision,
  type ElementNode,
  type Notice,
  type Reason,
  type Selector,
  type Simple,
  type Specificity,
  type Step,
} from './model.ts'

type Input = {
  html: string
  css: string
  target: string
  properties: string[]
}

type Working = Decl & {
  state: CandidateState
  reason: Reason | null
  reasonText: string | null
  via: string | null
}

export function buildRun(input: Input, prepared?: ReturnType<typeof parseDocument>) {
  const doc = prepared ?? parseDocument(input.html, input.css)
  const element = resolveElement(doc.elements, input.target)
  if (!element) {
    return { steps: [] as Step[], notices: doc.notices, error: null as string | null, doc }
  }
  const matched = declarationsFor(element, doc)
  const steps: Step[] = []
  const decisions: Record<string, Decision> = {}
  for (const notice of doc.notices) {
    push(steps, decisions, {
      message: `${notice.message}.`,
      property: null,
      line: notice.line,
      focusId: null,
      candidates: [],
    })
  }
  for (const property of contested(input.properties)) {
    const own = declsForRun(property, matched, input.properties).map(working)
    resolveProperty(property, own, element, doc, steps, decisions)
  }
  return { steps, notices: doc.notices as Notice[], error: null as string | null, doc }
}

function resolveProperty(
  property: string,
  own: Working[],
  element: ElementNode,
  doc: ReturnType<typeof parseDocument>,
  steps: Step[],
  decisions: Record<string, Decision>,
) {
  const show = () => own.map(view)
  for (const decl of own) {
    if (!decl.via) continue
    const who = decl.inline ? 'style' : decl.selectorText
    push(steps, decisions, {
      message: `${decl.inline ? 'Атрибут style' : `Селектор ${who}`} записывает сокращение ${decl.via}. Для свойства ${property} из него получается ${decl.value}. Сокращение задаёт сразу несколько свойств, поэтому в разборе оно стоит рядом с длинной записью.`,
      property,
      line: decl.line,
      focusId: decl.id,
      candidates: show(),
    })
  }
  if (!own.length) {
    finishMissing(property, element, doc, steps, decisions, show)
    return
  }
  push(steps, decisions, {
    message: inventory(property, own, element),
    property,
    line: own[0]?.line ?? null,
    focusId: own[0]?.id ?? null,
    candidates: show(),
  })
  for (const decl of own) {
    if (!decl.invalid) continue
    drop(decl, 'invalid', 'невалидное значение')
    push(steps, decisions, {
      message: `Значение «${decl.value}» для ${property} браузер не принимает: ${decl.invalid}. Такое объявление выбрасывают, в споре оно больше не участвует.`,
      property,
      line: decl.line,
      focusId: decl.id,
      candidates: show(),
    })
  }
  let alive = own.filter((decl) => decl.state !== 'out')
  if (!alive.length) {
    finishMissing(property, element, doc, steps, decisions, show)
    return
  }
  if (alive.length < 2) {
    crown(alive[0], property, steps, decisions, show, loneReason(alive[0]))
    return
  }
  const important = alive.filter((decl) => decl.important)
  if (important.length && important.length < alive.length) {
    for (const decl of alive) {
      if (decl.important) continue
      drop(decl, 'important', 'обычное против !important')
      push(steps, decisions, {
        message: lossMessage(decl, 'important', 'обычное против !important'),
        property,
        line: decl.line,
        focusId: decl.id,
        candidates: show(),
      })
    }
    alive = alive.filter((decl) => decl.state !== 'out')
  }
  if (alive.length < 2) {
    crown(alive[0], property, steps, decisions, show, 'обычные объявления отброшены: пометка !important важнее значения без неё')
    return
  }
  alive = narrow(alive, property, steps, decisions, show, () => {
    const origins = new Set(alive.map((decl) => decl.origin))
    if (origins.size < 2) return quiet()
    const best = maxRank(alive, doc.layers)
    const losers = alive.filter((decl) => rank(decl, doc.layers).origin !== rank(best, doc.layers).origin)
    if (!losers.length) return quiet()
    best.state = 'leader'
    return {
      message: `Сначала смотрят, откуда стиль: от автора страницы, от пользователя или от браузера. Это важнее, чем вес селектора. Здесь остаются стили ${originPlain(best.origin)}.`,
      focus: best,
      losers: losers.map((decl) => ({ decl, ...originReason(decl, best) })),
    }
  })
  if (alive.length < 2) {
    crown(alive[0], property, steps, decisions, show, `победило происхождение «${originPlain(alive[0].origin)}»: его сравнивают раньше веса селектора`)
    return
  }
  alive = narrow(alive, property, steps, decisions, show, () => {
    if (!alive.some((decl) => decl.layer)) return quiet()
    const best = maxRank(alive, doc.layers)
    const losers = alive.filter((decl) => rank(decl, doc.layers).layer !== rank(best, doc.layers).layer)
    if (!losers.length) return quiet()
    best.state = 'leader'
    return {
      message: best.layer
        ? `Дальше сравнивают слои @layer, и это тоже раньше веса селектора. Слой «${best.layer}» в этом споре сильнее, поэтому остаётся ${named(best)} со значением ${best.value}.`
        : `Стили вне @layer сильнее стилей внутри слоя. Поэтому остаётся ${named(best)} со значением ${best.value}: он записан без слоя.`,
      focus: best,
      losers: losers.map((decl) => ({ decl, reason: 'layer' as Reason, reasonText: 'слой слабее' })),
    }
  })
  if (alive.length < 2) {
    const winner = alive[0]
    crown(
      winner,
      property,
      steps,
      decisions,
      show,
      winner.layer ? `победил слой «${winner.layer}»: слои сравнивают раньше, чем вес селектора` : 'стили вне @layer сильнее стилей внутри слоя',
    )
    return
  }
  for (const decl of alive.filter((item) => !item.inline && item.selector)) {
    decl.state = 'leader'
    push(steps, decisions, {
      message: weightMessage(decl),
      property,
      line: decl.line,
      focusId: decl.id,
      candidates: show(),
    })
    decl.state = 'pending'
  }
  if (alive.some((decl) => decl.inline) && alive.some((decl) => !decl.inline)) {
    alive = narrow(alive, property, steps, decisions, show, () => {
      const best = maxRank(alive, doc.layers)
      const losers = alive.filter((decl) => decl.inline !== best.inline)
      if (!losers.length) return quiet()
      best.state = 'leader'
      return {
        message: best.inline
          ? 'Атрибут style записан прямо на элементе. Он конкретнее селектора из файла стилей, поэтому побеждает, даже если селектор длинный.'
          : 'Селектор из файла стилей здесь побеждает атрибут style.',
        focus: best,
        losers: losers.map((decl) => ({
          decl,
          reason: 'specificity' as Reason,
          reasonText: best.inline ? 'inline выше селектора' : 'ниже специфичность',
        })),
      }
    })
    if (alive.length < 2) {
      crown(alive[0], property, steps, decisions, show, alive[0].inline ? 'атрибут style на элементе конкретнее селектора из файла' : 'селектор из файла оказался сильнее атрибута style')
      return
    }
  }
  let verdict = ''
  alive = narrow(alive, property, steps, decisions, show, () => {
    const best = maxRank(alive, doc.layers)
    const losers = alive.filter((decl) => specKey(decl) !== specKey(best))
    if (!losers.length) return quiet()
    best.state = 'leader'
    verdict = specVerdict(best, losers)
    return {
      message: verdict,
      focus: best,
      losers: losers.map((decl) => ({ decl, reason: 'specificity' as Reason, reasonText: 'ниже специфичность' })),
    }
  })
  if (alive.length < 2) {
    crown(alive[0], property, steps, decisions, show, verdict.replace(/\.$/, ''))
    return
  }
  const tied = formatSpec(alive[0].specificity)
  alive = narrow(alive, property, steps, decisions, show, () => {
    const best = maxRank(alive, doc.layers)
    best.state = 'leader'
    const losers = alive.filter((decl) => decl.order !== best.order)
    return {
      message: `Вес одинаковый ${formatSpec(best.specificity)}: селекторы одинаково конкретные. Тогда смотрят порядок в CSS — побеждает объявление, которое написано ниже. Ниже стоит ${named(best)}.`,
      focus: best,
      losers: losers.map((decl) => ({ decl, reason: 'order' as Reason, reasonText: 'раньше в исходнике' })),
    }
  })
  crown(alive[0], property, steps, decisions, show, `вес одинаковый ${tied}, селекторы одинаково конкретные, поэтому победило объявление ниже в CSS`)
}

function finishMissing(
  property: string,
  element: ElementNode,
  doc: ReturnType<typeof parseDocument>,
  steps: Step[],
  decisions: Record<string, Decision>,
  show: () => Candidate[],
) {
  const who = elementPhrase(element)
  const parent = inheritedFrom(element.parent, property, doc)
  if (inherits(property) && parent) {
    push(steps, decisions, {
      message: `У ${who} своё значение ${property} не задано. Это свойство наследуется: если у элемента нет своего, он берёт его у родителя. Родитель — ${parent.label}, у него ${property}: ${parent.value}.`,
      property,
      line: parent.line,
      focusId: null,
      candidates: show(),
    })
    decisions[property] = {
      property,
      value: parent.value,
      kind: 'inherit',
      summary: `наследование от ${parent.label}`,
    }
    push(steps, decisions, {
      message: `Итог для ${property}: значение ${parent.value}. Оно не записано на самом элементе, а пришло от родителя.`,
      property,
      line: parent.line,
      focusId: null,
      candidates: show(),
    })
    return
  }
  if (!inherits(property)) {
    const note = parent ? ` У родителя (${parent.label}) ${property} равен ${parent.value}, но ребёнку это значение не передаётся.` : ''
    push(steps, decisions, {
      message: `У ${who} своё значение ${property} не задано. Свойство ${property} не наследуется: то, что задано родителю, сюда не переходит.${note}`,
      property,
      line: parent?.line ?? null,
      focusId: null,
      candidates: show(),
    })
  } else {
    push(steps, decisions, {
      message: `У ${who} своё значение ${property} не задано. Свойство наследуется, но у родителя своего значения тоже нет, передать нечего.`,
      property,
      line: null,
      focusId: null,
      candidates: show(),
    })
  }
  const value = initialValue(property)
  decisions[property] = {
    property,
    value,
    kind: 'initial',
    summary: inherits(property) ? `начальное значение ${value}` : `начальное значение ${value}, не наследуется`,
  }
  push(steps, decisions, {
    message: `Итог для ${property}: начальное значение ${value}. Так свойство выглядит, когда его не задал ни сам элемент, ни родитель.`,
    property,
    line: null,
    focusId: null,
    candidates: show(),
  })
}

function inheritedFrom(
  parent: ElementNode | null,
  property: string,
  doc: ReturnType<typeof parseDocument>,
): { value: string; label: string; line: number | null } | null {
  if (!parent || parent.tag === '#root') return null
  const alive = declarationsFor(parent, doc).filter((decl) => decl.property === property && !decl.invalid)
  if (alive.length) {
    const best = maxRank(alive, doc.layers)
    return { value: best.value, label: elementPhrase(parent, 'nom'), line: best.line }
  }
  if (!inherits(property)) return null
  return inheritedFrom(parent.parent, property, doc)
}


function narrow(
  alive: Working[],
  property: string,
  steps: Step[],
  decisions: Record<string, Decision>,
  show: () => Candidate[],
  collect: () => { message: string | null; focus?: Working | null; losers: { decl: Working; reason: Reason; reasonText: string }[] },
) {
  const result = collect()
  if (!result.message) return alive
  const focus = result.focus ?? alive[0] ?? null
  push(steps, decisions, {
    message: result.message,
    property,
    line: focus?.line ?? null,
    focusId: focus?.id ?? null,
    candidates: show(),
  })
  for (const loser of result.losers) {
    drop(loser.decl, loser.reason, loser.reasonText)
    push(steps, decisions, {
      message: lossMessage(loser.decl, loser.reason, loser.reasonText),
      property,
      line: loser.decl.line,
      focusId: loser.decl.id,
      candidates: show(),
    })
  }
  return alive.filter((decl) => decl.state !== 'out')
}

function crown(
  decl: Working,
  property: string,
  steps: Step[],
  decisions: Record<string, Decision>,
  show: () => Candidate[],
  because: string,
) {
  decl.state = 'winner'
  const summary = sentence(because)
  decisions[property] = { property, value: decl.value, kind: 'decl', summary }
  const via = decl.via ? ` Значение взято из сокращения ${decl.via}.` : ''
  push(steps, decisions, {
    message: `Итог для ${property}: побеждает ${named(decl)}, значение ${decl.value}.${via} ${summary}`,
    property,
    line: decl.line,
    focusId: decl.id,
    candidates: show(),
  })
}

function drop(decl: Working, reason: Reason, reasonText: string) {
  decl.state = 'out'
  decl.reason = reason
  decl.reasonText = reasonText
}

function originReason(loser: Working, winner: Working): { reason: Reason; reasonText: string } {
  if (loser.origin === 'user-agent' && winner.origin === 'author') {
    return { reason: 'origin', reasonText: 'user-agent против author' }
  }
  return { reason: 'origin', reasonText: 'происхождение слабее' }
}

function maxRank<T extends Decl>(decls: T[], layers: string[]) {
  return decls.reduce((best, decl) => (compare(decl, best, layers) > 0 ? decl : best))
}

function compare(left: Decl, right: Decl, layers: string[]) {
  const a = rank(left, layers)
  const b = rank(right, layers)
  const keys: (keyof typeof a)[] = ['important', 'origin', 'layer', 'inline', 'a', 'b', 'c', 'order']
  for (const key of keys) {
    if (a[key] !== b[key]) return a[key] - b[key]
  }
  return 0
}

function rank(decl: Decl, layers: string[]) {
  const important = decl.important ? 1 : 0
  const origin = decl.important ? { author: 0, user: 1, 'user-agent': 2 }[decl.origin] : { 'user-agent': 0, user: 1, author: 2 }[decl.origin]
  return {
    important,
    origin,
    layer: layerScore(decl, layers),
    inline: decl.inline ? 1 : 0,
    a: decl.specificity.a,
    b: decl.specificity.b,
    c: decl.specificity.c,
    order: decl.order,
  }
}

function layerScore(decl: Decl, layers: string[]) {
  const normalTop = layers.length + 1
  if (decl.origin !== 'author') return decl.important ? 0 : normalTop
  if (decl.inline) return normalTop
  if (!decl.layer) return decl.important ? 0 : normalTop
  const index = Math.max(0, layers.indexOf(decl.layer))
  return decl.important ? layers.length - index : index + 1
}

function specKey(decl: Decl) {
  return `${decl.specificity.a}:${decl.specificity.b}:${decl.specificity.c}`
}

function label(decl: { inline: boolean; selectorText: string; via?: string | null }) {
  const name = decl.inline ? 'style' : decl.selectorText
  return decl.via ? `${name} (${decl.via})` : name
}

function sentence(text: string) {
  const trimmed = text.trim().replace(/\.$/, '')
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}.`
}

function quiet() {
  return { message: null, losers: [] as { decl: Working; reason: Reason; reasonText: string }[] }
}

function inventory(property: string, own: Working[], element: ElementNode) {
  const mixed = own.some((decl) => decl.important) && own.some((decl) => !decl.important)
  const allImportant = own.every((decl) => decl.important)
  const claims = own.map((decl) => claimLine(decl)).join(' ')
  const hint = mixed
    ? ' Обычное объявление без !important проигрывает помеченному, даже если оно записано в style прямо на элементе. Пометку смотрят раньше веса селектора и порядка в файле.'
    : allImportant
      ? ' У всех стоит !important, поэтому пометка их не разделяет. Дальше сравнивают слой, вес селектора и то, кто ниже в файле.'
      : ''
  return `Свойство ${property} у ${elementPhrase(element)}. ${howMany(own.length)} ${claims}${hint}`
}

function claimLine(decl: Working) {
  const who = decl.inline ? 'Атрибут style на самом элементе' : `Селектор ${decl.selectorText}`
  const marks: string[] = []
  if (decl.important) marks.push('помечен !important')
  if (decl.layer) marks.push(`лежит в слое ${decl.layer}`)
  if (decl.via) marks.push(`значение взято из сокращения ${decl.via}`)
  const tail = marks.length ? ` — ${marks.join(', ')}` : ''
  return `${who} задаёт ${decl.value}${tail}.`
}

function howMany(count: number) {
  if (count === 1) return 'На него попало одно объявление.'
  const word = count >= 2 && count <= 4 ? 'объявления' : 'объявлений'
  const number = ['два', 'три', 'четыре'][count - 2] ?? String(count)
  return `На него попали ${number} ${word}, они спорят между собой.`
}

function named(decl: { inline: boolean; selectorText: string; via?: string | null }) {
  return decl.inline ? 'атрибут style на элементе' : `селектор ${label(decl)}`
}

function elementPhrase(element: ElementNode, grammatical: 'nom' | 'gen' = 'gen') {
  const nouns: Record<string, [string, string]> = {
    p: ['абзац', 'абзаца'],
    div: ['блок', 'блока'],
    button: ['кнопка', 'кнопки'],
    a: ['ссылка', 'ссылки'],
    span: ['элемент span', 'элемента span'],
    h1: ['заголовок', 'заголовка'],
    h2: ['заголовок', 'заголовка'],
    section: ['секция', 'секции'],
    article: ['статья', 'статьи'],
    li: ['пункт списка', 'пункта списка'],
    ul: ['список', 'списка'],
  }
  const pair = nouns[element.tag]
  const noun = pair
    ? pair[grammatical === 'nom' ? 0 : 1]
    : grammatical === 'nom'
      ? `элемент ${element.tag}`
      : `элемента ${element.tag}`
  const bits: string[] = []
  if (element.id) bits.push(`id ${element.id}`)
  if (element.classes.length === 1) bits.push(`классом ${element.classes[0]}`)
  else if (element.classes.length > 1) bits.push(`классами ${element.classes.join(' и ')}`)
  return bits.length ? `${noun} с ${bits.join(' и ')}` : noun
}

function originPlain(origin: Working['origin']) {
  if (origin === 'author') return 'автора страницы'
  if (origin === 'user') return 'пользователя'
  return 'самого браузера'
}

function lossMessage(decl: Working, reason: Reason, reasonText: string) {
  const name = decl.inline ? `Атрибут style со значением ${decl.value}` : `Селектор ${label(decl)} со значением ${decl.value}`
  if (reason === 'important') {
    return `${name} выбывает. Это обычное объявление, без !important. Рядом есть помеченное, и браузер оставляет только его: !important сравнивают раньше веса селектора.`
  }
  if (reason === 'order') {
    return `${name} выбывает. Селектор не слабее соперника, но это объявление записано в CSS выше. При равном весе побеждает то, что ниже в файле.`
  }
  if (reason === 'specificity') {
    return `${name} выбывает. Его селектор менее конкретный: в весе меньше id, классов или тегов, чем у соперника.`
  }
  if (reason === 'layer') {
    return `${name} выбывает. Оно лежит в более слабом слое. Слои сравнивают раньше веса: поздний слой сильнее раннего, а стили вне @layer сильнее стилей внутри слоя.`
  }
  if (reason === 'origin') {
    return `${name} выбывает. Стили автора страницы важнее встроенных стилей браузера. Происхождение смотрят раньше веса.`
  }
  if (reason === 'invalid') {
    return `${name} выбывает. Браузер не понимает это значение и выбрасывает объявление.`
  }
  return `${name} выбывает: ${reasonText}.`
}

function loneReason(decl: Working) {
  if (decl.inline || !decl.selector) return 'это единственное объявление, других претендентов нет'
  return `других претендентов нет. Вес селектора ${formatSpec(decl.specificity)}: ${weightBits(decl.selector).join(' + ')}`
}

function weightMessage(decl: Working) {
  const how = decl.selector ? weightBits(decl.selector).join(' + ') : named(decl)
  return `Считаем конкретность селектора ${label(decl)}. Вес ${formatSpec(decl.specificity)} — это три числа: id, классы, теги. Здесь ${how}.`
}

function weightBits(selector: Selector) {
  return selector.compounds.flatMap((compound) => compound.map(bitLabel))
}

function bitLabel(simple: Simple) {
  if (simple.kind === 'id') return `id #${simple.name}`
  if (simple.kind === 'class') return `класс .${simple.name}`
  if (simple.kind === 'attr') return `атрибут [${simple.name}]`
  if (simple.kind === 'type') return `тег ${simple.name}`
  if (simple.name === 'hover') return 'псевдокласс :hover'
  if (simple.name === 'where') return ':where = (0, 0, 0)'
  let best = ZERO
  for (const arg of simple.args) {
    const spec = specificityOf(arg)
    if (heavierSpec(spec, best)) best = spec
  }
  return `:${simple.name} = ${formatSpec(best)}`
}

function heavierSpec(next: Specificity, current: Specificity) {
  if (next.a !== current.a) return next.a > current.a
  if (next.b !== current.b) return next.b > current.b
  return next.c > current.c
}

function specVerdict(best: Decl, losers: Decl[]) {
  if (losers.length !== 1) {
    return `Селектор ${label(best)} конкретнее остальных. Вес ${formatSpec(best.specificity)} выше: сначала сравнивают id, потом классы, потом теги.`
  }
  const other = losers[0]
  return `Селектор ${label(best)} конкретнее, чем ${label(other)}. Вес ${formatSpec(best.specificity)} против ${formatSpec(other.specificity)}: ${columnGap(best.specificity, other.specificity)}. Сравнивают слева направо, поэтому id важнее класса, а класс важнее тега.`
}

function columnGap(best: Specificity, other: Specificity) {
  if (best.a !== other.a) return `id ${best.a} против ${other.a}`
  if (best.b !== other.b) return `классы ${best.b} против ${other.b}`
  return `теги ${best.c} против ${other.c}`
}

function working(decl: Decl & { via?: string | null }): Working {
  return { ...decl, via: decl.via ?? null, state: 'pending', reason: null, reasonText: null }
}

function declsForRun(property: string, matched: Decl[], selected: string[]) {
  const out: (Decl & { via: string | null })[] = []
  for (const decl of matched) {
    if (!sets(decl.property, property)) continue
    const picked = decl.property === property || selected.some((name) => sets(name, property) && shares(decl.property, name))
    if (!picked) continue
    if (decl.property === property) out.push({ ...decl, via: null })
    else out.push({ ...decl, id: `${decl.id}:${property}`, value: componentValue(decl.property, decl.value, property), via: decl.property })
  }
  return out
}

function view(decl: Working): Candidate {
  return {
    id: decl.id,
    selector: decl.selectorText,
    value: decl.value,
    origin: decl.origin,
    layer: decl.layer,
    important: decl.important,
    specificity: decl.specificity,
    inline: decl.inline,
    order: decl.order,
    line: decl.line,
    state: decl.state,
    reason: decl.reason,
    reasonText: decl.reasonText,
    via: decl.via,
  }
}

function push(
  steps: Step[],
  decisions: Record<string, Decision>,
  step: Omit<Step, 'decisions'>,
) {
  steps.push({ ...step, decisions: { ...decisions } })
}
