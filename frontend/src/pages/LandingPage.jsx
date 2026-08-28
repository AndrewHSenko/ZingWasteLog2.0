import { useState } from 'react'
import toast from 'react-hot-toast'

import AddItem from '../components/AddItem.jsx'
import PendingItems from '../components/PendingItems.jsx'
import { createEntry } from '../api/client.js'

const LandingPage = () => {
  const [pendingItems, setPendingItems] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addPendingItem = (row) => setPendingItems((rows) => [...rows, row])

  const removePendingItem = (key) =>
    setPendingItems((rows) => rows.filter((row) => row.key !== key))

  const clearPendingItems = () => setPendingItems([])

  const submitAll = async () => {
    setIsSubmitting(true)
    const staged = pendingItems

    // The backend has no bulk-create endpoint, so each staged row is its own POST.
    const results = await Promise.allSettled(
      staged.map(({ entererName, product, productQuantity, notes }) =>
        createEntry({ entererName, product, productQuantity, notes })
      )
    )

    const sentKeys = new Set(
      staged.filter((_, i) => results[i].status === 'fulfilled').map((row) => row.key)
    )
    const failedCount = staged.length - sentKeys.size

    if (sentKeys.size) {
      toast.success(`Logged ${sentKeys.size} ${sentKeys.size === 1 ? 'entry' : 'entries'}`)
    }
    if (failedCount) {
      toast.error(`${failedCount} could not be saved — still listed below.`)
    }

    // Drop only what actually saved, so failures stay staged and anything added
    // mid-request is preserved.
    setPendingItems((rows) => rows.filter((row) => !sentKeys.has(row.key)))
    setIsSubmitting(false)
  }

  return (
    <div className="container py-4">
      <div className="w-100 w-xl-50 mx-auto">
        <AddItem onAdd={addPendingItem} />
        <PendingItems
          pendingItems={pendingItems}
          onRemove={removePendingItem}
          onClear={clearPendingItems}
          onSubmit={submitAll}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

export default LandingPage
