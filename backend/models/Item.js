const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Must provide name!'],
        trim: true, // trims surrounding whitespace
        minlength: [2, 'Name must be more than one letter unless we\'re selling alphabet soup!']
    },
    quantityType: {
        type: String,
        required: [true, 'Must provide a measurement type!'],
        trim: true
    }},
    {timestamps : true} // Records createdAt and updatedAt
)

module.exports = mongoose.model('Item', ItemSchema, 'Items')