import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { scrollOptionIntoList } from './selectOpen'

export type SelectOption = { value: string; label: string; group?: string }

function groupOptions(options: SelectOption[]) {
  const sections: { label?: string; items: { option: SelectOption; index: number }[] }[] = []
  for (let index = 0; index < options.length; index += 1) {
    const option = options[index]
    const last = sections.at(-1)
    if (last && last.label === option.group) last.items.push({ option, index })
    else sections.push({ label: option.group, items: [{ option, index }] })
  }
  return sections
}

export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const activeRef = useRef(0)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.findIndex((option) => option.value === value)
  const current = options[selected] ?? options[0]
  const sections = useMemo(() => groupOptions(options), [options])

  function choose(index: number) {
    activeRef.current = index
    setActive(index)
  }

  useLayoutEffect(() => {
    if (!open) return
    const list = listRef.current
    const option = list?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (!list || !option) return
    scrollOptionIntoList(list, option)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointer(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      const target = event.target
      const inside = target instanceof Node && (buttonRef.current?.contains(target) || menuRef.current?.contains(target))
      if (!inside) {
        if (event.key === 'Escape') setOpen(false)
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        buttonRef.current?.focus()
        return
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        if (options.length === 0) return
        const step = event.key === 'ArrowDown' ? 1 : -1
        const next = (activeRef.current + step + options.length) % options.length
        choose(next)
        const list = listRef.current
        const option = list?.querySelector<HTMLElement>(`[data-index="${next}"]`)
        if (list && option) scrollOptionIntoList(list, option)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const option = options[activeRef.current]
        if (option) onChange(option.value)
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, options, onChange])

  return (
    <div className="ui-select-field">
      <button
        ref={buttonRef}
        type="button"
        className={`ui-select ${open ? 'is-open' : ''} ${className ?? ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => {
          if (!open) choose(selected >= 0 ? selected : 0)
          setOpen((next) => !next)
        }}
      >
        <span className="ui-select-value">{current?.label ?? ''}</span>
        <svg className="ui-select-chevron" width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 6.5 8 10.5 12 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div ref={menuRef} className="ui-select-menu">
          <div ref={listRef} id={listId} className="ui-select-scroll" role="listbox" aria-label={ariaLabel}>
            {sections.map((section, sectionIndex) => (
              <div key={section.label ?? section.items[0]?.option.value} role={section.label ? 'group' : 'presentation'} aria-label={section.label}>
                {section.label && sectionIndex > 0 ? <div className="ui-select-separator" /> : null}
                {section.label ? <div className="ui-select-group">{section.label}</div> : null}
                {section.items.map(({ option, index }) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    data-index={index}
                    id={`${listId}-${index}`}
                    className={`ui-select-option ${option.value === value ? 'is-selected' : ''} ${index === active ? 'is-active' : ''}`}
                    aria-selected={option.value === value}
                    onClick={() => {
                      onChange(option.value)
                      setOpen(false)
                      buttonRef.current?.focus()
                    }}
                  >
                    <span className="ui-select-option-label">{option.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
