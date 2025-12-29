const Item = require('../models/Item')
const {StatusCodes} = require('http-status-codes')
// const {BadRequestError, NotFoundError} = require('../errors')

const getAllItems = async (req, res) => {
    const items = await Item.find({}).sort('createdAt')
    res.status(StatusCodes.OK).json({items, count: items.length})
}

const searchItem = async (req, res) => {
    const {iname} = req.query
    const escapedName = iname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const item = await Item.findOne({name : {$regex : escapedName, $options : "i"}})
    // if (!entries) {
    //     throw new NotFoundError("No entries found.")
    // }
    res.status(StatusCodes.OK).json({item})
}

const createItem = async (req, res) => {
    const item = await Item.create(req.body)
    res.status(StatusCodes.CREATED).json({item})
}

const updateItem = async (req, res) => {
    const {itemId} = req.params
    const updatedItem = await Item.findOneAndUpdate({ _id: itemId }, req.body, {new: true, runValidators:true})
    // if (!item) {
    //     throw new NotFoundError("Item not found.")
    // }
    res.status(StatusCodes.OK).json({item : updatedItem})
}

const deleteItem = async (req, res) => {
   const {itemId} = req.params
   const deletedItem = await Item.findOneAndDelete({ _id: itemId })
//    if (!deletedItem) {
//     throw new NotFoundError("Item not found, so not deleted.")
//    }
   res.status(StatusCodes.NO_CONTENT).send({ deleted: true })
}

module.exports = {
    getAllItems,
    searchItem,
    createItem,
    updateItem,
    deleteItem
}
    