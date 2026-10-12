import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { formatQuantity } from '../utils/report.js'

// Follows "Waste Log Report Template.md": italic centered title and date range, a Total Wasted
// table, then (on a new page) an Item Summary with one table per item. Plain black on white.
const styles = StyleSheet.create({
  page: { padding: 72, fontFamily: 'Helvetica', fontSize: 11 },
  title: { fontFamily: 'Helvetica-Oblique', fontSize: 26, textAlign: 'center' },
  range: { textAlign: 'center', marginTop: 6, marginBottom: 24 },
  heading: { fontFamily: 'Helvetica-Oblique', fontSize: 18 },
  label: { fontFamily: 'Helvetica-Bold', marginTop: 18, marginBottom: 4 },
  // Borders are drawn as top/left on the table and bottom/right on each cell, so adjacent
  // cells share one line instead of doubling up.
  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#000' },
  row: { flexDirection: 'row' },
  cell: {
    padding: 5,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
  },
})

// widths are flex weights, one per column.
const Table = ({ widths, rows }) => (
  <View style={styles.table}>
    {rows.map(({ key, cells }) => (
      // wrap={false}: a row is never split across a page break.
      <View key={key} style={styles.row} wrap={false}>
        {cells.map((cell, i) => (
          <Text key={i} style={[styles.cell, { flex: widths[i] }]}>
            {cell}
          </Text>
        ))}
      </View>
    ))}
  </View>
)

// Rough height guess in text lines: a row is one line plus however many extra lines its notes
// wrap to (the notes column fits ~40 characters). A page holds about 25 lines under the title
// and label, so stay under that with some margin.
const MAX_KEEP_TOGETHER_LINES = 22
const fitsOnPage = (rows) =>
  rows.reduce((lines, r) => lines + 1 + Math.floor(r.notes.length / 40), 0) <=
  MAX_KEEP_TOGETHER_LINES

const amount =(quantity, unit) => `${formatQuantity(quantity)} ${unit}`.trim()

const WeeklyReportPdf = ({ report }) => (
  <Document title="Zingerman's Waste Log Report">
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.title}>Zingerman’s Waste Log Report</Text>
      <Text style={styles.range}>{report.dateRange}</Text>

      <Text style={[styles.label, { marginTop: 0 }]}>Total Wasted:</Text>
      <Table
        widths={[1, 1]}
        rows={report.blocks.map((b) => ({
          key: b.name,
          cells: [b.name, amount(b.quantity, b.unit)],
        }))}
      />

      {/* break: the Item Summary always starts on a fresh page. */}
      <Text style={styles.heading} break>
        Item Summary
      </Text>
      {report.blocks.map((block) => (
        // wrap={false}: the title and its rows move to the next page together. An item too
        // tall for one page can't, so it wraps and minPresenceAhead at least keeps the title
        // with its first rows.
        <View key={block.name} wrap={!fitsOnPage(block.rows)}>
          <Text style={styles.label} minPresenceAhead={60}>
            {block.name}:
          </Text>
          <Table
            widths={[1, 1.2, 1, 2]}
            rows={block.rows.map((r) => ({
              key: r.id,
              cells: [r.date, r.name, amount(r.quantity, block.unit), r.notes],
            }))}
          />
        </View>
      ))}
    </Page>
  </Document>
)

export default WeeklyReportPdf
