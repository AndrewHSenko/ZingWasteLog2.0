import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { getItems, searchEntries } from '../api/client.js'

const EMPTY_FILTERS = { enterer: '', productName: '', startDate: '', endDate: '' }

const EntriesPage = () => {
  const [entries, setEntries] = useState([])
  const [items, setItems] = useState([])
  // Results stay hidden until a search is actually run.
  const [hasSearched, setHasSearched] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FILTERS })

  // Entries store product as an ObjectId and the backend does not populate it,
  // so item names and units are resolved here.
  const itemsById = new Map(items.map((item) => [item._id, item]))

  const runSearch = async (filters) => {
    try {
      setEntries(await searchEntries(filters))
      setHasSearched(true)
    } catch (err) {
      toast.error(err.message)
    }
  }

  // Items are still needed up front, for the name suggestions and for resolving
  // each entry's product id once results come back.
  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => toast.error(err.message))
  }, [])

  const onClear = () => {
    reset(EMPTY_FILTERS)
    setEntries([])
    setHasSearched(false)
  }

  const formatDate = (value) =>
    new Date(value).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="container py-4">
      <div className="w-100 w-xl-50 mx-auto">
        <h2 className="mb-3">Entries</h2>

        <form onSubmit={handleSubmit(runSearch)} noValidate className="mb-4">
          <div className="mb-3">
            <label htmlFor="enterer" className="form-label">Name</label>
            <input
              id="enterer"
              className={`form-control ${errors.enterer ? 'is-invalid' : ''}`}
              placeholder="Any name"
              {...register('enterer', {
                // The backend rejects anything longer outright.
                maxLength: { value: 24, message: 'Name filter is limited to 24 characters.' },
              })}
            />
            <div className="invalid-feedback">{errors.enterer?.message}</div>
          </div>

          <div className="mb-3">
            <label htmlFor="productName" className="form-label">Item</label>
            <input
              id="productName"
              className={`form-control ${errors.productName ? 'is-invalid' : ''}`}
              list="entryItemNames"
              placeholder="Any item"
              {...register('productName', {
                maxLength: { value: 64, message: 'Item filter is limited to 64 characters.' },
              })}
            />
            {/* Suggestions only — partial text matches server-side, so free text is valid too. */}
            <datalist id="entryItemNames">
              {items.map((item) => (
                <option key={item._id} value={item.name} />
              ))}
            </datalist>
            <div className="invalid-feedback">{errors.productName?.message}</div>
          </div>

          <div className="row">
            <div className="col mb-3">
              <label htmlFor="startDate" className="form-label">From</label>
              <input
                id="startDate"
                type="date"
                className="form-control"
                {...register('startDate')}
              />
            </div>
            <div className="col mb-3">
              <label htmlFor="endDate" className="form-label">To</label>
              <input
                id="endDate"
                type="date"
                className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                {...register('endDate', {
                  // Caught here so an impossible range never costs a round trip.
                  validate: (value) =>
                    !value ||
                    !getValues('startDate') ||
                    value >= getValues('startDate') ||
                    'End date must be on or after the start date.',
                })}
              />
              <div className="invalid-feedback">{errors.endDate?.message}</div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClear}
              disabled={isSubmitting}
            >
              Clear
            </button>
          </div>
        </form>

        {hasSearched && (
          <>
            <h5 className="mb-2">Results ({entries.length})</h5>
            {!entries.length && (
              <p className="text-muted">No entries match those filters.</p>
            )}
          </>
        )}

        <ul className="list-group">
          {entries.map((entry) => {
            const item = itemsById.get(entry.product)
            return (
              <li key={entry._id} className="list-group-item">
                <div className="d-flex justify-content-between">
                  <span>{item?.name ?? 'Unknown item'}</span>
                  <span className="text-muted">
                    {entry.productQuantity} {item?.quantityType ?? ''}
                  </span>
                </div>
                <div className="d-flex justify-content-between">
                  <small className="text-muted">{entry.entererName}</small>
                  <small className="text-muted">{formatDate(entry.createdAt)}</small>
                </div>
                {entry.notes && (
                  <small className="text-muted fst-italic d-block mt-1">{entry.notes}</small>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default EntriesPage
