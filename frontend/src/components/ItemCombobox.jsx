import { useEffect, useId, useRef, useState } from 'react'

// A typable replacement for the item <select> — with 200+ items, a native picker is
// a long scroll on a phone. The form value stays the item's _id (what LogEntry.product
// needs); the input only ever shows a name. Free text is never accepted: nothing is
// selected until an option is tapped or chosen with the keyboard.
const ItemCombobox = ({ items, value, onChange, error, inputId }) => {
  // What has been typed since the field was opened. null means nothing has been
  // typed, so the box shows the chosen item's name instead. Typing never changes the
  // selection, which is why the form always holds a real item id: dropping the draft
  // is all it takes to put the chosen name back, whether the list closed without a
  // pick or the parent reset the form after a submit.
  const [draft, setDraft] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  // Index into the visible list, for arrow-key browsing. -1 means nothing is active.
  const [activeIndex, setActiveIndex] = useState(-1)

  const containerRef = useRef(null)
  const listRef = useRef(null)
  const listId = useId()

  const selectedName = items.find((item) => item._id === value)?.name ?? ''

  const close = () => {
    setIsOpen(false)
    setDraft(null)
    setActiveIndex(-1)
  }

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setIsOpen(false)
        setDraft(null)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isOpen])

  useEffect(() => {
    if (activeIndex < 0) return
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // With no draft the whole list shows, so reopening on an already-chosen item still
  // allows browsing away from it rather than stranding you on the one match.
  const search = (draft ?? '').trim().toLowerCase()
  const visible = search
    ? items.filter((item) => item.name.toLowerCase().includes(search))
    : items

  const choose = (item) => {
    onChange(item._id)
    close()
  }

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }
      if (!visible.length) return
      const down = event.key === 'ArrowDown'
      setActiveIndex((index) => {
        if (index < 0) return down ? 0 : visible.length - 1
        return (index + (down ? 1 : -1) + visible.length) % visible.length
      })
      return
    }

    if (event.key === 'Enter' && isOpen && visible[activeIndex]) {
      // Otherwise picking an item would submit the form.
      event.preventDefault()
      choose(visible[activeIndex])
      return
    }

    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      close()
    }
  }

  return (
    <div className="position-relative" ref={containerRef}>
      <input
        id={inputId}
        type="text"
        role="combobox"
        className={`form-control ${error ? 'is-invalid' : ''}`}
        placeholder="Type to search items..."
        value={draft ?? selectedName}
        // The browser's own autofill would cover the list on mobile.
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        onFocus={(event) => {
          setIsOpen(true)
          // Select the current name so typing replaces it instead of appending.
          event.target.select()
        }}
        onChange={(event) => {
          setDraft(event.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={onKeyDown}
      />
      {/* Bootstrap only reveals .invalid-feedback next to the .is-invalid control,
          so it lives here rather than beside the field in the parent form. */}
      <div className="invalid-feedback">{error}</div>

      {isOpen && (
        <ul
          id={listId}
          ref={listRef}
          role="listbox"
          className="list-group position-absolute w-100 mt-1 shadow overflow-auto z-3 item-options"
          // Keeps focus in the input so the mobile keyboard does not flicker shut and
          // reopen on every pick. Deliberately mousedown, not pointerdown: preventing
          // the default on pointerdown would also cancel touch-panning, making the
          // list impossible to scroll with a finger.
          onMouseDown={(event) => event.preventDefault()}
        >
          {!visible.length && (
            <li className="list-group-item text-muted">No items match.</li>
          )}
          {visible.map((item, index) => {
            const isActive = index === activeIndex
            return (
              <li
                key={item._id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={item._id === value}
                onClick={() => choose(item)}
                className={`list-group-item list-group-item-action py-2 d-flex justify-content-between gap-3 ${
                  isActive ? 'active' : ''
                }`}
              >
                <span>{item.name}</span>
                <span className={isActive ? '' : 'text-muted'}>{item.quantityType}</span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default ItemCombobox
