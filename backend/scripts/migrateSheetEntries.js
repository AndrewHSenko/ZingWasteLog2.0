// One-off migration: Google Sheet waste log -> Entries collection.
//
//   node scripts/migrateSheetEntries.js                 # dry run, prints a summary
//   node scripts/migrateSheetEntries.js --commit        # insert, writing a rollback manifest
//   node scripts/migrateSheetEntries.js --rollback <manifest.json>
//
// Sheet layout: A=Timestamp, B=Name, C=No Items, then one column pair per item
// (`<Item>_amount`, `<Item>_reason`) from D onward. Columns C-E are ignored per the
// migration brief, so the item pairs start at index 5 (column F) -- the D/E "Misc"
// pair is free text with no matching Item document and is dropped with the rest.

// The sheet's timestamps are naive Ann Arbor wall-clock, so pin the zone rather than
// inheriting whatever the machine running the migration is set to.
process.env.TZ = 'America/Detroit'

require('dotenv').config({ quiet: true })
const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const connectDB = require('../db/connect')
const Item = require('../models/Item')
const Entry = require('../models/LogEntry')

const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1Cdaf3M6bd2AbvEXSenaq0hD-dOJsihHEzTdLBRJH3_g/export?format=csv&gid=510045951'

const FIRST_ITEM_COLUMN = 5 // column F; A-E are Timestamp, Name, No Items, Misc_amount, Misc_reason

const parseCSV = (text) => {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c !== '"') field += c
      else if (text[i + 1] === '"') { field += '"'; i++ }
      else quoted = false
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c !== '\r') field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

// "12/17/2025 19:28:30" -> Date. Built from components so the M/D/YYYY order is explicit
// rather than left to the engine's date heuristics.
const parseTimestamp = (raw) => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/.exec(raw.trim())
  if (!m) return null
  const [, mo, d, y, h, mi, s] = m.map(Number)
  const date = new Date(y, mo - 1, d, h, mi, s)
  return isNaN(date.getTime()) ? null : date
}

const buildEntries = (rows, itemIdsByName) => {
  const header = rows[0]
  const entries = []
  const skipped = []

  rows.slice(1).forEach((row, index) => {
    const sheetRow = index + 2 // 1-indexed, past the header
    const timestamp = parseTimestamp(row[0] || '')
    const entererName = (row[1] || '').trim()

    for (let col = FIRST_ITEM_COLUMN; col < header.length; col += 2) {
      const amountCell = (row[col] || '').trim()
      const reasonCell = (row[col + 1] || '').trim()
      if (!amountCell && !reasonCell) continue

      const itemName = header[col].slice(0, -'_amount'.length)
      const productId = itemIdsByName.get(itemName)

      // A handful of cells hold several submissions joined with ", " (amount "42, 32",
      // reason ","). Split those back into one entry apiece.
      const amounts = amountCell.split(',').map((a) => a.trim())
      const reasons = amountCell.includes(',') ? reasonCell.split(',').map((r) => r.trim()) : [reasonCell]

      amounts.forEach((amount, i) => {
        const quantity = Number(amount)
        const reject = (reason) => skipped.push({ sheetRow, itemName, amount, reason })

        if (!timestamp) return reject('unparseable timestamp')
        if (!entererName) return reject('missing enterer name')
        if (!productId) return reject('no matching Item document')
        if (!amount || !Number.isFinite(quantity) || quantity <= 0) return reject('non-positive or non-numeric amount')

        entries.push({
          entererName,
          product: productId,
          productQuantity: quantity,
          notes: (reasons[i] || '').slice(0, 500),
          createdAt: timestamp,
          updatedAt: timestamp,
        })
      })
    }
  })

  return { entries, skipped }
}

const fetchCSV = async (csvPath) => {
  if (csvPath) return fs.readFileSync(csvPath, 'utf8')
  const res = await fetch(SHEET_CSV_URL, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Sheet download failed: ${res.status} ${res.statusText}`)
  return res.text()
}

const rollback = async (manifestPath) => {
  const { ids } = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const { deletedCount } = await Entry.deleteMany({ _id: { $in: ids } })
  console.log(`Rolled back ${deletedCount} of ${ids.length} entries from ${path.basename(manifestPath)}`)
}

const migrate = async ({ commit, csvPath }) => {
  const rows = parseCSV(await fetchCSV(csvPath))
  const header = rows[0]

  const items = await Item.find({}).lean()
  const itemIdsByName = new Map(items.map((item) => [item.name, item._id]))

  const unmatched = []
  for (let col = FIRST_ITEM_COLUMN; col < header.length; col += 2) {
    const name = header[col].slice(0, -'_amount'.length)
    if (!itemIdsByName.has(name)) unmatched.push(name)
  }
  if (unmatched.length) {
    throw new Error(`No Item document for ${unmatched.length} sheet column(s): ${unmatched.join(', ')}`)
  }

  const { entries, skipped } = buildEntries(rows, itemIdsByName)

  console.log(`Sheet rows: ${rows.length - 1}`)
  console.log(`Entries built: ${entries.length}`)
  console.log(`Cells skipped: ${skipped.length}`)
  skipped.forEach((s) => console.log(`  row ${s.sheetRow} ${s.itemName} "${s.amount}" - ${s.reason}`))
  console.log(`Existing entries in collection: ${await Entry.countDocuments()}`)

  if (!commit) {
    console.log('\nDry run - nothing written. Re-run with --commit to insert.')
    console.log('Sample:', JSON.stringify(entries.slice(0, 3), null, 2))
    return
  }

  // timestamps: false so the sheet's createdAt/updatedAt survive instead of being
  // overwritten with the migration's own clock -- date-range search reads createdAt.
  const inserted = await Entry.insertMany(entries, { timestamps: false, ordered: false })

  const manifestPath = path.join(__dirname, `migration-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  fs.writeFileSync(manifestPath, JSON.stringify({ insertedAt: new Date(), ids: inserted.map((e) => e._id) }, null, 2))

  console.log(`\nInserted ${inserted.length} entries.`)
  console.log(`Rollback manifest: ${manifestPath}`)
}

const main = async () => {
  const args = process.argv.slice(2)
  const rollbackIndex = args.indexOf('--rollback')
  const csvIndex = args.indexOf('--csv')

  await connectDB(process.env.MONGO_URI)
  try {
    if (rollbackIndex !== -1) await rollback(args[rollbackIndex + 1])
    else await migrate({ commit: args.includes('--commit'), csvPath: csvIndex === -1 ? null : args[csvIndex + 1] })
  } finally {
    await mongoose.disconnect()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
