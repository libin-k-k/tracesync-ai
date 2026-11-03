import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconChevron } from '../dashboard/icons'

type MenuBox = {
  top: number | 'auto'
  bottom: number | 'auto'
  left: number | 'auto'
  right: number | 'auto'
  width: number | 'auto'
  minWidth: number
  maxHeight: number
}

export type DropdownOption<T extends string = string> = {
  value: T
  label: string
}

type DropdownProps<T extends string> = {
  value: T
  options: readonly DropdownOption<T>[]
  onChange: (value: T) => void
  labelledBy?: string
  ariaLabel?: string
  disabled?: boolean
  variant?: 'field' | 'chip'
  align?: 'start' | 'end'
  leading?: ReactNode
}

export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
  ariaLabel,
  disabled = false,
  variant = 'field',
  align = 'start',
  leading,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [box, setBox] = useState<MenuBox | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )
  const selected = options[selectedIndex]

  const measure = (): MenuBox | null => {
    const trigger = rootRef.current?.querySelector('.ui-dropdown-trigger')

    if (!(trigger instanceof HTMLElement)) {
      return null
    }

    const rect = trigger.getBoundingClientRect()
    const gap = 8
    const needed = Math.min(options.length * 44 + 16, 320)
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < needed && spaceAbove > spaceBelow
    const maxHeight = Math.max(96, Math.min(needed, openUp ? spaceAbove : spaceBelow))
    const horizontal =
      align === 'end'
        ? { left: 'auto' as const, right: Math.max(8, window.innerWidth - rect.right), width: 'auto' as const, minWidth: rect.width }
        : { left: Math.max(8, rect.left), right: 'auto' as const, width: rect.width, minWidth: rect.width }

    if (openUp) {
      return {
        top: 'auto',
        bottom: window.innerHeight - rect.top + gap,
        maxHeight,
        ...horizontal,
      }
    }

    return {
      top: rect.bottom + gap,
      bottom: 'auto',
      maxHeight,
      ...horizontal,
    }
  }

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const update = () => setBox(measure())
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)

    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, options.length, align])

  useEffect(() => {
    if (!open) {
      return
    }

    const onPointer = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) {
        return
      }

      setOpen(false)
    }

    document.addEventListener('mousedown', onPointer)
    listRef.current?.focus()

    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  const choose = (option: DropdownOption<T>) => {
    onChange(option.value)
    setOpen(false)
  }

  const openMenu = () => {
    setActiveIndex(selectedIndex)
    setBox(measure())
    setOpen(true)
  }

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) {
        setOpen(false)
        return
      }
      openMenu()
    }
  }

  const onListKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % options.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + options.length) % options.length)
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[activeIndex]
      if (option) {
        choose(option)
      }
      return
    }

    if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={`ui-dropdown ui-dropdown-${variant}${open ? ' is-open' : ''}`}
    >
      <button
        type="button"
        className="ui-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-labelledby={labelledBy}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        {leading}
        <span className="ui-dropdown-value">{selected?.label ?? 'Select'}</span>
        <IconChevron className="ui-dropdown-chevron" />
      </button>
      {open && box
        ? createPortal(
            <ul
              ref={listRef}
              id={listId}
              className={`ui-dropdown-menu ui-dropdown-menu-${align} is-fixed`}
              role="listbox"
              tabIndex={-1}
              style={box as CSSProperties}
              onKeyDown={onListKeyDown}
            >
              {options.map((option, index) => {
                const isSelected = option.value === value
                const isActive = index === activeIndex
                return (
                  <li key={option.value} role="presentation">
                    <button
                      type="button"
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      className={
                        isSelected
                          ? 'ui-dropdown-option is-selected'
                          : isActive
                            ? 'ui-dropdown-option is-active'
                            : 'ui-dropdown-option'
                      }
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(option)}
                    >
                      {option.label}
                    </button>
                  </li>
                )
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  )
}
