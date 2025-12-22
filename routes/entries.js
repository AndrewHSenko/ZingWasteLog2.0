const express = require('express')
const router = express.Router()

const {createEntry, getAllEntries, getEntries, updateEntry, deleteEntry} = require('../controllers/entries') // Will handle getting by name or date in controllers

router.route('/').post(createEntry).get(getAllEntries)
router.route('/:id').get(getEntries).patch(updateEntry).delete(deleteEntry)

module.exports = router