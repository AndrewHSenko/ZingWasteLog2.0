const Entry = require('../models/LogEntry')
const {StatusCodes} = require('http-status-codes')
// const {BadRequestError, NotFoundError} = require('../errors')

const getAllEntries = async (req, res) => {
    const entries = await Entry.find({}).sort('createdAt')
    res.status(StatusCodes.OK).json({entries, count: entries.length})
}

const getEntries = async (req, res) => {
    const {startEntryDate, endEntryDate, enterer, productName} = req.query // Will handle logical errors like start > end in front end
    const userQuery = []
    if (startEntryDate) {
        if (endEntryDate)
            query.push({$and : [{createdAt : {$gte: new Date(startEntryDate)}}, {createdAt : {$lte: new Date(endEntryDate)}}]})
        else
            query.push({createdAt : {$gte: new Date(startEntryDate)}})
    }
    else if (endEntryDate) {
        query.push({createdAt : {$lte: new Date(endEntryDate)}})
    }
    if (enterer) {
        query.push({entererName : new RegExp(enterer, 'i')})
    }
    if (productName) {
        query.push({product : productName})
    }
    const query = userQuery.length ? {$and : userQuery} : {}
    const entries = await Entry.find(query).sort('createdAt')
    // if (!entries) {
    //     throw new NotFoundError("No entries found.")
    // }
    res.status(StatusCodes.OK).json({entries, count: entries.length})
}

const createEntry = async (req, res) => {
    const entry = await Entry.create(req.body)
    res.status(StatusCodes.CREATED).json({entry})
}

const updateEntry = async (req, res) => {
    const {entryDate} = req.query
    const entry = await Entry.findOneAndUpdate({createdAt : entryDate}, req.body, {new: true, runValidators:true})
    // if (!entry) {
    //     throw new NotFoundError(`No entry found`)
    // }
    res.status(StatusCodes.OK).json({entry})
}

const deleteEntry = async (req, res) => { // Delete by date only
   const {entryDate} = req.query
   const entry = await Entry.findOneAndDelete({createdAt : entryDate})
//    if (!entry) {
//     throw new NotFoundError("No entries found with that date, so could not be deleted.")
//    }
   res.status(StatusCodes.OK).send()
}

module.exports = {
    getAllEntries,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry
}
    