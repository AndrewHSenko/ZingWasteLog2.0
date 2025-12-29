const Entry = require('../models/LogEntry')
const {StatusCodes} = require('http-status-codes')
// const {BadRequestError, NotFoundError} = require('../errors')

const getAllEntries = async (req, res) => {
    const entries = await Entry.find({}).sort('createdAt')
    res.status(StatusCodes.OK).json({entries, count: entries.length})
}

const getEntries = async (req, res) => {
    try {
        const {startEntryDate, endEntryDate, enterer, productName} = req.query
        const userQuery = []
        const entryDateQuery = []
        let startDate = null
        let endDate = null
        if (startEntryDate) {
            startDate = new Date(startEntryDate)
            if (!isNaN(startDate.getTime())) {
                entryDateQuery.push({createdAt : {$gte: startDate}})
            }
            else {
                return res.status(400).json({ error: 'Invalid start date' })
                // throw new NotFoundError('Start date invalid')
            }
        }
        if (endEntryDate) {
            endDate = new Date(endEntryDate)
            if (!isNaN(endDate.getTime())) { // Just an end date
                entryDateQuery.push({createdAt : {$lte: endDate}})
            }
            else
                return res.status(400).json({ error: 'Invalid end date' })
                // throw new NotFoundError('Start date invalid')
        }
        if (startDate && endDate) {
            if (startDate > endDate) {
                return res.status(400).json({ error: 'Invalid start and end date' })
                // throw new NotFoundError('Start date is greater than the end date')
            }
        }
        if (entryDateQuery.length) {
            userQuery.push({$and : userQuery})
        }
        if (enterer) {
            userQuery.push({entererName : new RegExp(enterer, 'i')})
        }
        if (productName) {
            userQuery.push({product : new RegExp(productName, 'i')})
        }
        const query = userQuery.length ? {$and : userQuery} : {}
        const entries = await Entry.find(query).sort('createdAt')
        // if (!entries) {
        //     throw new NotFoundError("No entries found.")
        // }
        res.status(StatusCodes.OK).json({entries, count: entries.length})
    }
    catch ({name, message}) {
        res.status(500).json(name + ": " + message) // Will change
    }
}

const createEntry = async (req, res) => {
    const entry = await Entry.create(req.body)
    res.status(StatusCodes.CREATED).json({entry})
}

const updateEntry = async (req, res) => {
    const {entryId} = req.params
    const updatedEntry = await Entry.findOneAndUpdate({_id : entryId}, req.body, {new: true, runValidators:true})
    // if (!entry) {
    //     throw new NotFoundError(`No entry found`)
    // }
    res.status(StatusCodes.OK).json({entry : updatedEntry})
}

const deleteEntry = async (req, res) => { // Delete by date only
   const {entryId} = req.params
   const deletedItem = await Entry.findOneAndDelete({_id : entryId})
//    if (!entry) {
//     throw new NotFoundError("No entries found with that date, so could not be deleted.")
//    }
   res.status(StatusCodes.OK).send({ deleted: true })
}

module.exports = {
    getAllEntries,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry
}
    