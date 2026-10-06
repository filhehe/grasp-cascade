import { createElement } from 'react'
import { initialValue, resolveElement } from '../engine/css.ts'
import { isShorthand, linkLabel, longhands, sets } from '../engine/shorthand.ts'
import { isElement, type Decision, type ElementNode, type Node } from '../engine/model.ts'
import { useCascade } from '../store.ts'
import { isVoidTag, sampleHost } from './sampleHost.ts'

export function ElementView() {
  const doc = useCascade((state) => state.doc)
  const target = useCascade((state) => state.target)
  const properties = useCascade((state) => state.properties)
  const steps = useCascade((state) => state.steps)
  const index = useCascade((state) => state.index)
  const error = useCascade((state) => state.error)
  const step = index >= 0 ? steps[index] : undefined
  const decisions = step?.decisions ?? {}
  const element = resolveElement(doc.elements, target)

  return (
    <div className="element-view">
      <div className="sample" data-testid="sample">
        {error ? (
          <p className="sample-missing">{error}</p>
        ) : (
          doc.root.children.map((node, nodeIndex) => (
            <SampleNode key={nodeIndex} node={node} target={element} decisions={decisions} properties={properties} />
          ))
        )}
      </div>
      <ul className="property-list">
        {properties.map((property) => {
          const decision = decisions[property]
          const covered = longhands(property)
            .map((hand) => decisions[hand])
            .filter((item) => item != null)
          const shown = decision ?? (covered.length === 1 ? covered[0] : undefined)
          const link = linkLabel(property, properties)
          const active = step?.property === property || (step?.property != null && sets(property, step.property))
          return (
            <li key={property} className={active ? 'is-active' : undefined}>
              <span className="property-name">{property}</span>
              <span className="property-value">{shown ? shown.value : 'ещё не выбрано'}</span>
              {decision ? <span className="property-summary">{decision.summary}</span> : link ? <span className="property-summary">{link}</span> : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function camel(property: string) {
  return property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function SampleNode({
  node,
  target,
  decisions,
  properties,
}: {
  node: Node
  target: ElementNode | null
  decisions: Record<string, Decision>
  properties: string[]
}) {
  if (!isElement(node)) return node.text
  const isTarget = node === target
  const style: Record<string, string> = {}
  for (const decl of node.inline) {
    if (isTarget && properties.includes(decl.property) && !decisions[decl.property]) continue
    if (isTarget && decisions[decl.property]) continue
    style[camel(decl.property)] = decl.value
  }
    if (isTarget) {
      for (const property of properties) {
        const decision = decisions[property]
        if (decision) style[camel(property)] = decision.value
        else if (!isShorthand(property)) style[camel(property)] = initialValue(property)
      }
    }
  const children = node.children.map((child, index) => (
    <SampleNode key={index} node={child} target={target} decisions={decisions} properties={properties} />
  ))
  return createElement(sampleHost(node.tag), { style }, isVoidTag(node.tag) ? undefined : children)
}
