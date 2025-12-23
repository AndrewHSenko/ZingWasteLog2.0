const express = require('express')
const router = express.Router()

const {createEntry, getAllEntries, getEntries, updateEntry, deleteEntry} = require('../controllers/entries') // Will handle getting by name or date in controllers

router.route('/').post(createEntry).get(getAllEntries).get(getEntries)
router.route('/:id').patch(updateEntry).delete(deleteEntry) // May change

module.exports = router