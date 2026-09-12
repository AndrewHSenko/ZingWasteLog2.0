import writeExcelFile from 'write-excel-file/browser'

// Excel stores a date as a day serial with no timezone attached. Building the cell from the
// *local* Y/M/D re-expressed as a UTC instant keeps the day shown in Excel matching the page
// and the CSV; handing over the raw createdAt would shift an entry logged at 8pm Eastern onto
// the next day — the same trap toIsoDate avoids for the CSV.
export const toDateCell = (value) => {
  const at = new Date(value)
  return new Date(Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()))
}

// 4.x stopped bolding the header row by default.
export const headerCell = (value) => ({ value, fontWeight: 'bold' })

// The browser build does the zipping in a Web Worker and returns a handle whose toFile()
// triggers the download. Note the import path: the bare 'write-excel-file' entry is Node's.
export const downloadXlsx = (filename, columns, rows) =>
  writeExcelFile(rows, { columns }).toFile(filename)
