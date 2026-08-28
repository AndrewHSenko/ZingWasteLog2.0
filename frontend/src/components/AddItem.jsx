import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import toast from 'react-hot-toast'

import { getItems } from '../api/client.js'

const AddItem = ({ onAdd }) => {
  const [items, setItems] = useState([])

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
    onAdd({
      key: crypto.randomUUID(),
      ...values,
      itemName: item.name,
      quantityType: item.quantityType,
    })
    // Keep the name so the same person can stage several rows in a row.
    reset({ entererName: values.entererName, product: '', productQuantity: '', notes: '' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
        {/* A select carries the item's _id as its value, which is what LogEntry.product needs. */}
        <select
          id="product"
          className={`form-select ${errors.product ? 'is-invalid' : ''}`}
          {...register('product', { required: 'Please choose an item.' })}
        >
          <option value="">Choose an item...</option>
          {items.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>
        <div className="invalid-feedback">{errors.product?.message}</div>
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
