const express = require('express')
const router = express.Router()

const {createEntry, getAllEntries, getEntries, getEntryCounts, updateEntry, deleteEntry} = require('../controllers/entries') // Will handle getting by name or date in controllers

router.route('/').post(createEntry).get(getAllEntries)
router.route('/search').get(getEntries)
router.route('/counts').get(getEntryCounts)
// Keep new literal paths above this line: /:entryId would otherwise match them first.
router.route('/:entryId').patch(updateEntry).delete(deleteEntry)

module.exports = router