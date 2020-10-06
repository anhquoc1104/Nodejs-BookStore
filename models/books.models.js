const mongoose = require('../mongoose.js');

let bookSchema = mongoose.Schema({
    title: String,
    description: String,
    userId: mongoose.Schema.Types.ObjectId,
    createAt: Date,
    avatarUrl: {
        type: String,
        default: ""
    }
}, {
    autoCreate: true
})

let Book = mongoose.model('Book', bookSchema, 'books');

module.exports = Book;