import { useEffect, useRef, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'

import { getItems } from '../api/client.js'
import ItemCombobox from './ItemCombobox.jsx'

const AddItem = ({ onAdd }) => {
  const [items, setItems] = useState([])
  // Staged rows only need a key unique within this page session: it is React's list key
  // and the handle PendingItems passes back to onRemove, and it never reaches the
  // backend — LandingPage's submitAll picks out entererName/product/productQuantity/
  // notes and drops the rest. A counter cannot restart underneath the pending list,
  // because LandingPage renders this form for as long as that list exists.
  //
  // Deliberately not crypto.randomUUID: it exists only in a secure context, so it is
  // undefined when the app is opened over a plain-HTTP LAN address for phone testing.
  // It threw there, inside handleSubmit, which swallowed it and made Add look dead.
  const nextRowKey = useRef(0)

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: { entererName: '', product: '', productQuantity: '', notes: '' },
  })

  // Show the chosen item's unit beside the quantity input, so "4" reads as "4 lb".
  const selectedProduct = useWatch({ control, name: 'product' })
  const selectedUnit = items.find((item) => item._id === selectedProduct)?.quantityType

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => toast.error(err.message))
  }, [])

  // "Add" stages a row rather than saving it; the Submit button on the pending
  // list is what actually writes to the backend.
  const onSubmit = (values) => {
    const item = items.find((candidate) => candidate._id === values.product)
    // Deleted between page load and submit. Without this the next line throws inside
    // handleSubmit, which swallows it: no row, no reset, no error, just a dead button.
    if (!item) {
      toast.error('That item is no longer available — choose it again.')
      return
    }

    nextRowKey.current += 1
    onAdd({
      key: `row-${nextRowKey.current}`,
      ...values,
      itemName: item.name,
      quantityType: item.quantityType,
    })
    // Keep the name so the same person can stage several rows in a row.
    reset({ entererName: values.entererName, product: '', productQuantity: '', notes: '' })
  }

  // handleSubmit is bound inside the event rather than during render: onSubmit reads
  // the key-counter ref, and handing that out at render time trips react-hooks/refs.
  return (
    <form onSubmit={(event) => handleSubmit(onSubmit)(event)} noValidate>
      <h2 className="mb-3">Waste Log</h2>

      <div className="mb-3">
        <label htmlFor="entererName" className="form-label">Your name</label>
        <input
          id="entererName"
          className={`form-control ${errors.entererName ? 'is-invalid' : ''}`}
          {...register('entererName', { required: 'Please enter your name.' })}
        />
        <div className="invalid-feedback">{errors.entererName?.message}</div>
      </div>

      <div className="mb-3">
        <label htmlFor="product" className="form-label">Item</label>
        {/* Controlled rather than registered: the combobox holds the item's _id, which
            is what LogEntry.product needs, while showing the item's name. */}
        <Controller
          control={control}
          name="product"
          rules={{ required: 'Please choose an item.' }}
          render={({ field, fieldState }) => (
            <ItemCombobox
              inputId="product"
              items={items}
              value={field.value}
              onChange={field.onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="productQuantity" className="form-label">Amount wasted</label>
        {/* Bootstrap only shows .invalid-feedback inside an input group when it is a sibling
            of the control, so it lives in the group and wraps to its own line. */}
        <div className="input-group">
          <input
            id="productQuantity"
            type="number"
            step="any"
            // Without this iOS offers the plain number pad, with no decimal point.
            inputMode="decimal"
            className={`form-control ${errors.productQuantity ? 'is-invalid' : ''}`}
            {...register('productQuantity', {
              required: 'Please enter the amount wasted.',
              valueAsNumber: true,
              // Mirrors the min rule in backend/models/LogEntry.js.
              min: { value: 0.001, message: 'Must be more than 0.' },
            })}
          />
          {selectedUnit && <span className="input-group-text">{selectedUnit}</span>}
          <div className="invalid-feedback">{errors.productQuantity?.message}</div>
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="notes" className="form-label">
          Notes <span className="text-muted">(optional)</span>
        </label>
        <textarea
          id="notes"
          rows="2"
          className={`form-control ${errors.notes ? 'is-invalid' : ''}`}
          placeholder="Anything worth recording about this waste"
          {...register('notes', {
            // Mirrors the maxlength rule in backend/models/LogEntry.js.
            maxLength: { value: 500, message: 'Notes must be 500 characters or fewer.' },
          })}
        />
        <div className="invalid-feedback">{errors.notes?.message}</div>
      </div>

      <button type="submit" className="btn btn-primary mb-4">
        Add
      </button>
    </form>
  )
}

export default AddItem
