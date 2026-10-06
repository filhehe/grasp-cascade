export function scrollOptionIntoList(
  list: { scrollTop: number; clientHeight: number },
  option: { offsetTop: number; offsetHeight: number },
) {
  const top = option.offsetTop
  const bottom = top + option.offsetHeight
  if (option.offsetHeight >= list.clientHeight) {
    if (list.scrollTop !== top) list.scrollTop = top
    return
  }
  const viewBottom = list.scrollTop + list.clientHeight
  if (top >= list.scrollTop && bottom <= viewBottom) return
  list.scrollTop = top < list.scrollTop ? top : bottom - list.clientHeight
}
