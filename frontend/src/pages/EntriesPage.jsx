import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { getItems, searchEntries } from '../api/client.js'
import ItemCombobox from '../components/ItemCombobox.jsx'

const EMPTY_FILTERS = { enterer: '', productName: '', startDate: '', endDate: '' }

// Everything one person logged on one day reads as a single log rather than a run of
// near-identical rows. The day is the *local* calendar day: searchEntries pins the
// From/To filters to the local day too, so a UTC key would group results outside the
// range that was actually asked for.
const groupEntries = (entries, itemsById) => {
  const groups = new Map()

  for (const entry of entries) {
    const loggedAt = new Date(entry.createdAt)
    const day = `${loggedAt.getFullYear()}-${loggedAt.getMonth()}-${loggedAt.getDate()}`
    // The backend matches enterer with a case-insensitive regex, so "andrew" and
    // "Andrew" come back together and must not split into two cards. The first
    // spelling seen is the one displayed.
    const key = `${day}|${entry.entererName.trim().toLowerCase()}`

    let group = groups.get(key)
    if (!group) {
      group = {
        key,
        dayLabel: loggedAt.toLocaleDateString(undefined, { dateStyle: 'medium' }),
        entererName: entry.entererName.trim(),
        latest: 0,
        rows: [],
      }
      groups.set(key, group)
    }

    // Entries store product as an ObjectId the backend does not populate, so names
    // and units are resolved here.
    const item = itemsById.get(entry.product)
    group.rows.push({
      ...entry,
      itemName: item?.name ?? 'Unknown item',
      quantityType: item?.quantityType ?? '',
    })
    group.latest = Math.max(group.latest, loggedAt.getTime())
  }

  // Newest day first; when two people logged on the same day, whoever logged most
  // recently leads. Rows keep the order the backend sorted them in (createdAt asc).
  return [...groups.values()].sort((a, b) => b.latest - a.latest)
}

const EntriesPage = () => {
  const [entries, setEntries] = useState([])
  const [items, setItems] = useState([])
  // Results stay hidden until a search is actually run.
  const [hasSearched, setHasSearched] = useState(false)
  // Ids of the rows currently showing their reason. Held in React state rather than
  // with Bootstrap's data-bs-toggle="collapse": Bootstrap mutates .show on the DOM
  // directly, so a row reused across searches would keep an open state React never
  // resets.
  const [expandedRows, setExpandedRows] = useState(() => new Set())

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_FILTERS })

  const itemsById = new Map(items.map((item) => [item._id, item]))
  const groups = groupEntries(entries, itemsById)

  const toggleRow = (id) =>
    setExpandedRows((open) => {
      const next = new Set(open)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const runSearch = async (filters) => {
    try {
      const found = await searchEntries(filters)
      // A new result set must not arrive with rows already expanded.
      setExpandedRows(new Set())
      setEntries(found)
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
    setExpandedRows(new Set())
    setHasSearched(false)
  }

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
            {/* freeText because the backend matches partial names server-side: typing
                "chick" should still find every chicken item without picking one. */}
            <Controller
              control={control}
              name="productName"
              rules={{
                maxLength: { value: 64, message: 'Item filter is limited to 64 characters.' },
              }}
              render={({ field, fieldState }) => (
                <ItemCombobox
                  freeText
                  inputId="productName"
                  placeholder="Any item"
                  items={items}
                  value={field.value}
                  onChange={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="row">
            <div className="col-12 col-sm mb-3">
              <label htmlFor="startDate" className="form-label">From</label>
              <input
                id="startDate"
                type="date"
                className="form-control"
                {...register('startDate')}
              />
            </div>
            <div className="col-12 col-sm mb-3">
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
            <h5 className="mb-2">
              Results ({entries.length} {entries.length === 1 ? 'entry' : 'entries'} in{' '}
              {groups.length} {groups.length === 1 ? 'log' : 'logs'})
            </h5>
            {!entries.length && (
              <p className="text-muted">No entries match those filters.</p>
            )}
          </>
        )}

        {groups.map((group) => (
          <div key={group.key} className="card mt-3">
            <div className="card-header d-flex justify-content-between gap-2">
              <span className="text-nowrap">{group.dayLabel}</span>
              <span className="text-muted text-break text-end">{group.entererName}</span>
            </div>

            <ul className="list-group list-group-flush">
              {group.rows.map((row) => {
                const isOpen = expandedRows.has(row._id)
                const amount = `${row.productQuantity} ${row.quantityType}`

                // With no note there is nothing to reveal, so the row stays inert
                // rather than offering a click that does nothing.
                if (!row.notes) {
                  return (
                    <li
                      key={row._id}
                      className="list-group-item d-flex justify-content-between gap-2 py-3"
                    >
                      <span className="text-break">
                        {/* Empty, but still holds the caret column open so item names
                            line up whether or not a row has a reason. */}
                        <span aria-hidden="true" className="caret me-2" />
                        {row.itemName}
                      </span>
                      <span className="text-muted text-nowrap flex-shrink-0">{amount}</span>
                    </li>
                  )
                }

                return (
                  <li key={row._id} className="list-group-item p-0">
                    {/* list-group-item-action rather than .btn: custom.scss repaints
                        every .btn yellow on hover. */}
                    <button
                      type="button"
                      className="list-group-item-action d-flex justify-content-between align-items-center gap-2 w-100 px-3 py-3 border-0 bg-transparent"
                      onClick={() => toggleRow(row._id)}
                      aria-expanded={isOpen}
                      aria-controls={`reason-${row._id}`}
                    >
                      <span className="text-break text-start">
                        <span aria-hidden="true" className="caret me-2">
                          {isOpen ? '▾' : '▸'}
                        </span>
                        {row.itemName}
                      </span>
                      <span className="text-muted text-nowrap flex-shrink-0">{amount}</span>
                    </button>
                    <div id={`reason-${row._id}`} hidden={!isOpen} className="px-3 pb-2 ms-4">
                      <small className="text-muted fst-italic">{row.notes}</small>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EntriesPage
