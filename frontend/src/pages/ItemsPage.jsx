import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { getItems, createItem, searchEntries } from '../api/client.js'

const NO_FILTERS = { name: '', quantityType: '' }

const ItemsPage = () => {
  const [mode, setMode] = useState('see')
  const [items, setItems] = useState([])
  const [entries, setEntries] = useState([])
  const [appliedFilters, setAppliedFilters] = useState(NO_FILTERS)
  // Results stay hidden until a search is actually run.
  const [hasSearched, setHasSearched] = useState(false)
  const [loadError, setLoadError] = useState('')

  const addForm = useForm({ defaultValues: { name: '', quantityType: '' } })
  const filterForm = useForm({ defaultValues: NO_FILTERS })

  // There is no endpoint for "how many entries reference this item", so entries
  // are counted here. Grouping by the product ObjectId keeps the count exact,
  // rather than re-matching on name the way the backend's search does.
  const entryCounts = entries.reduce((counts, entry) => {
    counts.set(entry.product, (counts.get(entry.product) ?? 0) + 1)
    return counts
  }, new Map())

  const loadData = async () => {
    try {
      const [loadedItems, loadedEntries] = await Promise.all([getItems(), searchEntries()])
      setItems(loadedItems)
      setEntries(loadedEntries)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message)
    }
  }

  // Items are still needed up front: the add form checks them for duplicates and
  // the measurement-type filter is built from them. Entries only matter once a
  // search runs, so they are fetched then.
  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setLoadError(err.message))
  }, [])

  const onAdd = async (values) => {
    const name = values.name.trim()

    // Mongoose has no unique index on Item.name, so this is the only thing
    // stopping a duplicate. Match the way the backend trims, and ignore case.
    const exists = items.some(
      (item) => item.name.trim().toLowerCase() === name.toLowerCase()
    )
    if (exists) {
      toast.error('Item already exists!')
      return
    }

    try {
      const item = await createItem({ ...values, name })
      toast.success(`Added "${item.name}"`)
      addForm.reset()
      await loadData()
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Refresh before filtering so counts reflect entries logged since page load.
  const onFilter = async (values) => {
    await loadData()
    setAppliedFilters(values)
    setHasSearched(true)
  }

  const onClearFilters = () => {
    filterForm.reset(NO_FILTERS)
    setAppliedFilters(NO_FILTERS)
    setHasSearched(false)
  }

  // Items are loaded at mount for the add form, so nothing is listed until a
  // search has actually been run.
  const visibleItems = !hasSearched ? [] : items.filter((item) => {
    const nameFilter = appliedFilters.name.trim().toLowerCase()
    const matchesName = !nameFilter || item.name.toLowerCase().includes(nameFilter)
    const matchesType =
      !appliedFilters.quantityType || item.quantityType === appliedFilters.quantityType
    return matchesName && matchesType
  })

  // Offer whatever types are actually in use alongside the two current choices,
  // so items saved before the select existed stay filterable.
  const quantityTypes = [...new Set(['qty', 'oz', ...items.map((i) => i.quantityType)])]

  const { errors: addErrors, isSubmitting: isAdding } = addForm.formState
  const { isSubmitting: isFiltering } = filterForm.formState

  return (
    <div className="container py-4">
      <div className="w-100 w-xl-50 mx-auto">
        <h2 className="mb-3">Items</h2>

        <div className="btn-group mb-4" role="group" aria-label="Items view">
          <button
            type="button"
            className={`btn ${mode === 'see' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMode('see')}
            aria-pressed={mode === 'see'}
          >
            See items
          </button>
          <button
            type="button"
            className={`btn ${mode === 'add' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setMode('add')}
            aria-pressed={mode === 'add'}
          >
            Add an item
          </button>
        </div>

        {mode === 'add' && (
          <form onSubmit={addForm.handleSubmit(onAdd)} noValidate>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Item name</label>
              <input
                id="name"
                className={`form-control ${addErrors.name ? 'is-invalid' : ''}`}
                {...addForm.register('name', {
                  required: 'Name is required.',
                  // Mirrors the minlength rule in backend/models/Item.js.
                  minLength: { value: 2, message: 'Name must be at least 2 characters.' },
                })}
              />
              <div className="invalid-feedback">{addErrors.name?.message}</div>
            </div>

            <div className="mb-3">
              <label htmlFor="quantityType" className="form-label">Measurement type</label>
              <select
                id="quantityType"
                className={`form-select ${addErrors.quantityType ? 'is-invalid' : ''}`}
                {...addForm.register('quantityType', {
                  required: 'Measurement type is required.',
                })}
              >
                <option value="">Choose a measurement type...</option>
                <option value="qty">qty</option>
                <option value="oz">oz</option>
              </select>
              <div className="invalid-feedback">{addErrors.quantityType?.message}</div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add item'}
            </button>
          </form>
        )}

        {mode === 'see' && (
          <>
            <form onSubmit={filterForm.handleSubmit(onFilter)} noValidate className="mb-4">
              <div className="mb-3">
                <label htmlFor="filterName" className="form-label">Name</label>
                <input
                  id="filterName"
                  className="form-control"
                  placeholder="Any name"
                  {...filterForm.register('name')}
                />
              </div>

              <div className="mb-3">
                <label htmlFor="filterQuantityType" className="form-label">
                  Measurement type
                </label>
                <select
                  id="filterQuantityType"
                  className="form-select"
                  {...filterForm.register('quantityType')}
                >
                  <option value="">Any measurement type</option>
                  {quantityTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={isFiltering}>
                  {isFiltering ? 'Searching...' : 'Search'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={onClearFilters}
                  disabled={isFiltering}
                >
                  Clear
                </button>
              </div>
            </form>

            {loadError && <p className="text-danger">{loadError}</p>}

            {hasSearched && !loadError && (
              <>
                <h5 className="mb-2">Results ({visibleItems.length})</h5>
                {!visibleItems.length && (
                  <p className="text-muted">No items match those filters.</p>
                )}
              </>
            )}

            <ul className="list-group">
              {visibleItems.map((item) => {
                const count = entryCounts.get(item._id) ?? 0
                return (
                  <li key={item._id} className="list-group-item">
                    <div className="d-flex justify-content-between gap-2">
                      <span className="text-break">{item.name}</span>
                      <span className="text-muted text-nowrap flex-shrink-0">
                        {item.quantityType}
                      </span>
                    </div>
                    <small className="text-muted">
                      In {count} {count === 1 ? 'entry' : 'entries'}
                    </small>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}

export default ItemsPage
