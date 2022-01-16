const mongoose = require('mongoose')
const Scheme = mongoose.Schema;

const userScheme = new Scheme({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    verified: {
        type: Boolean,
        default: false
    },
    age: {
        type: Number,
    },
    rate: {
        type: String,
        default: 'startup'
    },
    themes: {
        type: Array,
        default: ['default']
    },
    videos: {
        type: Array,
        default: []
    },
    customers: {
        type: Array,
        default: []
    },
    transactions: {
        type: Array,
        default: []
    },
    orders: {
        type: Array,
        default: []
    },
    password: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Number,
    }
}, { timestamps: true })

const User = mongoose.model('User', userScheme)

module.exports = User;