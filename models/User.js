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
    password: {
        type: String,
        required: true
    },
    lastLogin: {
        type: Number,
    }
}, { timestamps: true })

const User = mongoose.model('Blog', userScheme)

module.exports = User;