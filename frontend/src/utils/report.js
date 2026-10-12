// Local calendar day, deliberately not toISOString(): that is UTC, so an entry logged at
// 8pm Eastern would land on the following date — and disagree with both the date-range
// filters and the grouped cards, which are local.
export const toIsoDate = (value) => {
  const at = new Date(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`
}

// 25, not 25.000; 1,234.5, not 1234.5000000001.
export const formatQuantity = (value) => Number(value.toFixed(3)).toLocaleString()

// Rolling week: today and the six days before it, as local YYYY-MM-DD strings in the form
// searchEntries expects.
export const weeklyRange = (now = new Date()) => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
  return { startDate: toIsoDate(start), endDate: toIsoDate(now), start, end: now }
}

const formatRangeDay = (value, withYear) =>
  value.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear && { year: 'numeric' }),
  })

// "Oct 2 – Oct 8, 2026"; both years are spelled out when the week straddles New Year.
export const formatDateRange = (start, end) => {
  const crossesYear = start.getFullYear() !== end.getFullYear()
  return `${formatRangeDay(start, crossesYear)} – ${formatRangeDay(end, true)}`
}

// Entries -> the structure the PDF renders. One row per entry, items with no entries never
// appear, items are largest total first and entries newest first.
export const buildWeeklyReport = (entries, itemsById, { start, end }) => {
  const byItem = new Map()

  for (const entry of entries) {
    const item = itemsById.get(entry.product)
    let block = byItem.get(entry.product)
    if (!block) {
      block = {
        // An entry can outlive the item it points at.
        name: item?.name ?? 'Unknown item',
        unit: item?.quantityType ?? '',
        quantity: 0,
        entries: [],
      }
      byItem.set(entry.product, block)
    }

    block.quantity += entry.productQuantity
    block.entries.push(entry)
  }

  const blocks = [...byItem.values()]
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .map((block) => ({
      name: block.name,
      unit: block.unit,
      quantity: block.quantity,
      rows: block.entries
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((entry) => ({
          id: entry._id,
          date: toIsoDate(entry.createdAt),
          name: entry.entererName,
          quantity: entry.productQuantity,
          notes: entry.notes ?? '',
        })),
    }))

  return { dateRange: formatDateRange(start, end), blocks }
}
