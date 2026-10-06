const documentTags = new Set(['html', 'head', 'body'])
const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])

export function sampleHost(tag: string) {
  return documentTags.has(tag) ? 'div' : tag
}

export function isVoidTag(tag: string) {
  return voidTags.has(tag)
}
