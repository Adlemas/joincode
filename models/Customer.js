const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const customerScheme = new Scheme({
    name: {
        type: String,
        required: true
    },
    uri: {
        type: String,
        default: null
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Customer = mongoose.model('Customer', customerScheme)

module.exports = Customer;