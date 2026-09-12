import trashcan from '../assets/trashcan.png'

// Items picked from the dropdown, waiting to be searched. Hidden entirely when empty —
// an empty box between two filter fields is just noise.
const SelectedItems = ({ items, onRemove, onClear, disabled }) => {
  if (!items.length) return null

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
        <span className="form-label mb-0">Selected ({items.length})</span>
        {/* type="button" on both: these sit inside the filter form and would submit it. */}
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={onClear}
          disabled={disabled}
        >
          Clear
        </button>
      </div>

      <ul className="list-group">
        {items.map((item) => (
          <li
            key={item._id}
            className="list-group-item d-flex justify-content-between align-items-center gap-2 py-2"
          >
            <span className="text-break">{item.name}</span>
            <button
              type="button"
              className="btn p-0 lh-1 tap-target flex-shrink-0"
              onClick={() => onRemove(item._id)}
              disabled={disabled}
              aria-label={`Remove ${item.name}`}
            >
              {/* alt is empty because the button's aria-label already names the action. */}
              <img src={trashcan} alt="" width="18" height="18" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default SelectedItems
