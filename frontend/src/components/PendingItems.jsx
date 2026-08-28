import trashcan from '../assets/trashcan.png'

const PendingItems = ({ pendingItems, onRemove, onClear, onSubmit, isSubmitting }) => {
  if (!pendingItems.length) {
    return <p className="text-muted">Nothing added yet.</p>
  }

  return (
    <div>
      <h5 className="mb-2">Pending ({pendingItems.length})</h5>

      <ul className="list-group mb-3">
        {pendingItems.map((row) => (
          <li key={row.key} className="list-group-item">
            <div className="d-flex justify-content-between align-items-center">
              <span>{row.itemName}</span>
              <span className="d-flex align-items-center gap-3">
                <span className="text-muted">
                  {row.productQuantity} {row.quantityType}
                </span>
                <button
                  type="button"
                  className="btn btn-sm p-1 lh-1"
                  onClick={() => onRemove(row.key)}
                  disabled={isSubmitting}
                  aria-label={`Remove ${row.itemName}`}
                >
                  {/* alt is empty because the button's aria-label already names the action. */}
                  <img src={trashcan} alt="" width="18" height="18" />
                </button>
              </span>
            </div>
            {row.notes && <small className="text-muted">{row.notes}</small>}
          </li>
        ))}
      </ul>

      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : `Submit`}
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
    </div>
  )
}

export default PendingItems
