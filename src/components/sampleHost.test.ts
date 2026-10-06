import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createElement, Fragment } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EXAMPLES } from '../examples.ts'
import { parseDocument } from '../engine/css.ts'
import { isElement, type Node } from '../engine/model.ts'
import { isVoidTag, sampleHost } from './sampleHost.ts'

const viewSource = readFileSync(new URL('./ElementView.tsx', import.meta.url), 'utf8')

assert.equal(sampleHost('body'), 'div')
assert.equal(sampleHost('html'), 'div')
assert.equal(sampleHost('head'), 'div')
assert.equal(sampleHost('p'), 'p')
assert.equal(isVoidTag('input'), true)
assert.equal(isVoidTag('p'), false)
assert.match(viewSource, /sampleHost\(node\.tag\)/)
assert.match(viewSource, /isVoidTag\(node\.tag\)/)
assert.doesNotMatch(viewSource, /createElement\(\s*node\.tag/)

function sampleMarkup(html: string) {
  const doc = parseDocument(html, '')
  const renderNode = (node: Node) => {
    if (!isElement(node)) return node.text
    const children = node.children.map((child, index) => createElement(Fragment, { key: index }, renderNode(child)))
    return createElement(sampleHost(node.tag), null, isVoidTag(node.tag) ? undefined : children)
  }
  return renderToStaticMarkup(
    createElement(
      'div',
      null,
      doc.root.children.map((node, index) => createElement(Fragment, { key: index }, renderNode(node))),
    ),
  )
}

for (const example of EXAMPLES) {
  const markup = sampleMarkup(example.html)
  assert.doesNotMatch(markup, /<\/?(?:html|head|body)\b/i, example.id)
}

const inherit = EXAMPLES.find((example) => example.id === 'n-inherit-body')
assert.ok(inherit)
const inheritMarkup = sampleMarkup(inherit.html)
assert.match(inheritMarkup, /<div><p>As the body has been set to have a color of blue\.<\/p><\/div>/)
assert.doesNotMatch(inheritMarkup, /<body/)

const columns = EXAMPLES.find((example) => example.id === 'j-three-columns')
assert.ok(columns)
const columnsMarkup = sampleMarkup(columns.html)
assert.match(columnsMarkup, /<input\/>/)
assert.doesNotMatch(columnsMarkup, /<\/?(?:html|head|body)\b/)

console.log('sample host ok')
