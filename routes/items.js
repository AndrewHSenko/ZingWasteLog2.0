const express = require('express')
const router = express.Router()

const {createItem, getAllItems, getItem, updateItem, deleteItem} = require('../controllers/items')

router.route('/').post(createItem).get(getAllItems)
router.route('/search').get(searchItem)
router.route('/:itemId').patch(updateItem).delete(deleteItem)

module.exports = router