import { buildWeeklyReport } from './report.js'

// Loaded on click: @react-pdf/renderer is large and only this button needs it, so it stays
// out of the main bundle.
export const downloadWeeklyReportPdf = async (filename, entries, itemsById, range) => {
  const [{ pdf }, { default: WeeklyReportPdf }, { createElement }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('../components/WeeklyReportPdf.jsx'),
    import('react'),
  ])

  const report = buildWeeklyReport(entries, itemsById, range)
  const blob = await pdf(createElement(WeeklyReportPdf, { report })).toBlob()
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  // Firefox ignores a click on a link that was never in the document.
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
