const mongoose = require('mongoose');

const LogEntrySchema = new mongoose.Schema({
    entererName: {
        type: String,
        required: [true, 'Please enter your name.'],
        trim: true, // trims surrounding whitespace
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: [true, 'Please enter the name of the ingredient/product.'] 
    },
    productQuantity: {
        type: Number, // Will handle non-numeric entries with middleware
        required: [true, 'Please enter the amount wasted.'],
        min: [0.001, 'Must be more than 0, duh.'] // Default, will be handled pre-emptively with middleware
    }},
    {timestamps : true} // Records createdAt and updatedAt
)

module.exports = mongoose.model('LogEntry', LogEntrySchema, 'Entries')