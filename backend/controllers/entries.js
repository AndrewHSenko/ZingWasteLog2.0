const mongoose = require('mongoose')
const Entry = require('../models/LogEntry')
const Item = require('../models/Item')
const {StatusCodes} = require('http-status-codes')
// const {BadRequestError, NotFoundError} = require('../errors')

const getAllEntries = async (req, res) => {
    const entries = await Entry.find({}).sort('createdAt')
    res.status(StatusCodes.OK).json({entries, count: entries.length})
}

const getEntries = async (req, res) => {
    try {
        const {startEntryDate, endEntryDate, enterer, productName, productIds} = req.query
        const userQuery = {}
        if (startEntryDate || endEntryDate) {
            userQuery.createdAt = {} // Necessary from a recursive bug from using multiple createdAt query paths with an $and
        }
        if (startEntryDate) {
            const startDate = new Date(startEntryDate)
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({ error: 'Invalid start date' })
                // throw some error
            }
            userQuery.createdAt.$gte = startDate
        }
        if (endEntryDate) {
            const endDate = new Date(endEntryDate)
            if (isNaN(endDate.getTime())) { // Just an end date
                return res.status(400).json({ error: 'Invalid end date' })
                // throw new NotFoundError('Start date invalid')
            }
            userQuery.createdAt.$lte = endDate
        }
        if (userQuery.createdAt && userQuery.createdAt.$gte && userQuery.createdAt.$lte && userQuery.createdAt.$gte > userQuery.createdAt.$lte) {
            return res.status(400).json({ error: 'Invalid start and end date' })
        }
        if (enterer) {
            if (enterer.length > 24) {
                return res.status(400).json({ error: "Enterer name too long"}) // Will change
            }
            const escapedEnterer = enterer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            userQuery.entererName = {$regex : escapedEnterer, $options : "i"}
        }
        // Ids come from picking items in the dropdown and mean those exact items; a name
        // still matches partially, so typing "chick" finds every chicken item. Both resolve
        // to item ids and merge into one $in, letting a search ask for several specific
        // items plus everything a fragment matches.
        const productIdFilter = new Set()
        // Tracked separately from the set's size: a name that matches no item must return
        // no entries, not fall through to an unfiltered search.
        const filteringByProduct = Boolean(productIds || productName)
        if (productIds) {
            // Tolerates repeated ?productIds= params as well as the comma-joined form the
            // client sends.
            const ids = [].concat(productIds).join(',').split(',').filter(Boolean)
            if (ids.length > 200) { // Will change
                return res.status(400).json({ error: "Too many items selected"})
            }
            for (const id of ids) {
                // Guard the cast: a CastError would reach the bare catch below and answer
                // with a 500 and a JSON string instead of {error}.
                if (!mongoose.isValidObjectId(id)) {
                    return res.status(400).json({ error: "Invalid product id"})
                }
                productIdFilter.add(id)
            }
        }
        if (productName) {
            if (productName.length > 64) { // Will change
                return res.status(400).json({ error: "Product name too long"})
            }
            const escapedProduct = productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
            const items = await Item.find({name : {$regex : escapedProduct, $options : "i"}})
            for (const item of items) productIdFilter.add(item._id.toString())
        }
        if (filteringByProduct) {
            userQuery.product = {$in : [...productIdFilter]}
        }
        const query = Object.keys(userQuery).length ? userQuery : {}
        const entries = await Entry.find(query).sort('createdAt').lean()
        // if (!entries) {
        //     throw new NotFoundError("No entries found.")
        // }
        res.status(StatusCodes.OK).json({entries, count: entries.length})
    }
    catch ({name, message}) {
        res.status(500).json(name + ": " + message) // Will change
    }
}

// How many entries reference each item. Done as an aggregation because the only
// consumer, the items page, wants the tallies and not the 667 documents behind them —
// fetching those to count them client-side moved ~146KB per search.
const getEntryCounts = async (req, res) => {
    const grouped = await Entry.aggregate([
        { $group: { _id: '$product', count: { $sum: 1 } } },
    ])
    // Keyed by item id so a lookup is direct. An ObjectId key stringifies to the same
    // hex the client already holds in item._id.
    const counts = Object.fromEntries(grouped.map(({_id, count}) => [_id, count]))
    res.status(StatusCodes.OK).json({counts})
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
    getEntryCounts,
    createEntry,
    updateEntry,
    deleteEntry
}
    