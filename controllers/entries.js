// Can pass null as a field when using find()
// Use the "params : {entererName : entererNameId, entryDate : entryDateId} from the req object as the parameters

const Entry = require('../models/LogEntry')
const {StatusCodes} = require('http-status-codes')
// const {BadRequestError, NotFoundError} = require('../errors')

const getAllEntries = async (req, res) => {
    const entries = await Entry.find({}).sort('createdAt')
    res.status(StatusCodes.OK).json({entries, count: entries.length})
}

const getEntries = async (req, res) => {
    const {params : {entryDate : entryDateId, enterer : entererId, productName : productNameId}} = req
    const entries = await Entry.find({entryDateId, entererId, productNameId}).sort('createdAt')
    // if (!entries) {
    //     throw new NotFoundError("No entries found.")
    // }
    res.status(StatusCodes.OK).json({entries})
}

const createEntry = async (req, res) => {
    const entry = await Entry.create(req.body)
    res.status(StatusCodes.CREATED).json({entry})
}

const updateEntry = async (req, res) => {
    const {params : {entryDate : entryDateId, enterer : entererId}} = req
    const query = {entryDate : entryDateId, enterer : entererId}
    const entry = await Entry.findOneAndUpdate(query, req.body, {new: true, runValidators:true})
    // if (!entry) {
    //     throw new NotFoundError(`No entry found`)
    // }
    res.status(StatusCodes.OK).json({entry})
}

const deleteEntry = async (req, res) => { // Delete by date only
   const {params : {entryDate : entryDateId}} = req
   const query = {entryDate : entryDateId}
   const entry = await Entry.findOneAndDelete(query)
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
    