import assert from 'node:assert/strict'
import { parseDocument } from '../engine/css.ts'
import { createEditorPanes, type PaneState } from './editorPanes.ts'

function state(html: string, css: string, parsedHtml = html, parsedCss = css, properties = ['color']): PaneState {
  return {
    html,
    css,
    target: 'p',
    properties,
    doc: parseDocument(parsedHtml, parsedCss),
    parsedHtml,
    parsedCss,
  }
}

const html = '<p class="a">Текст</p>\n'
const css = '.a {\n  color: teal;\n}\n'

{
  const panes = createEditorPanes()
  const settled = state(html, css)
  const htmlPane = panes.html(settled)
  const cssPane = panes.css(settled)
  const typed = state('<p class="a">Другой</p>\n', css, html, css)
  assert.equal(panes.css(typed), cssPane)
  assert.notEqual(panes.html(typed), htmlPane)
  const compiled = state(typed.html, css)
  assert.equal(panes.css(compiled), cssPane)
  assert.notEqual(panes.html(compiled), htmlPane)
}

{
  const panes = createEditorPanes()
  const settled = state(html, css)
  const htmlPane = panes.html(settled)
  const cssPane = panes.css(settled)
  const typed = state(html, '.a {\n  color: red;\n}\n', html, css)
  assert.equal(panes.html(typed), htmlPane)
  assert.notEqual(panes.css(typed), cssPane)
  assert.equal(panes.css(typed).notes, cssPane.notes)
  assert.equal(panes.css(typed).notes.lead?.label, '(0, 1, 0)')
  const compiled = state(html, typed.css)
  assert.equal(panes.html(compiled), htmlPane)
  const selectorEdit = state(html, '.a.a {\n  color: red;\n}\n', html, css)
  assert.equal(panes.html(selectorEdit), htmlPane)
  assert.equal(panes.css(selectorEdit).notes.lead?.label, '(0, 2, 0)')
}

{
  const panes = createEditorPanes()
  const settled = state(html, css)
  const htmlPane = panes.html(settled)
  const cssPane = panes.css(settled)
  const picked = state(html, css, html, css, [])
  assert.equal(panes.html(picked), htmlPane)
  assert.notEqual(panes.css(picked), cssPane)
}

{
  const buttonHtml = '<button class="my-button">Save</button>\n'
  const buttonCss = 'button {\n  background-color: gray;\n}\n\n\nbutton.my-button {\n  background-color: blue;\n}\n'
  const panes = createEditorPanes()
  const settled = state(buttonHtml, buttonCss, buttonHtml, buttonCss, ['background-color'])
  const cssPane = panes.css(settled)
  const htmlPane = panes.html(settled)
  assert.equal(cssPane.unused.length, 0)
  const typed = state('<button class="my-buttonf">Save</button>\n', buttonCss, buttonHtml, buttonCss, ['background-color'])
  const during = panes.css(typed)
  assert.notEqual(during, cssPane)
  assert.equal(during.notes, cssPane.notes)
  assert.equal(during.css, buttonCss)
  assert.equal(during.unused.some((span) => span.reason.includes('button.my-button')), true)
  const textOnly = state('<button class="my-buttonf">Load</button>\n', buttonCss, typed.html, buttonCss, ['background-color'])
  assert.equal(panes.css(textOnly), during)
  const renamed = state(buttonHtml, buttonCss.replace('button.my-button', 'button.other'), buttonHtml, buttonCss, ['background-color'])
  const htmlAfter = panes.html(renamed)
  assert.notEqual(htmlAfter, htmlPane)
  assert.equal(htmlAfter.html, buttonHtml)
  assert.equal(htmlAfter.unused.some((span) => span.reason.includes('.my-button')), true)
}

console.log('editor panes ok')
