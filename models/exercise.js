const mongoose = require('mongoose')

const exerciseSchema = new mongoose.Schema({
	userId: {
		type: String,
		required: true
	},
	description: {
		type: String,
		required: true,
		maxlength: 300
	},
	duration: {
		type: Number,
		required: true
	},
	date: Date
})

module.exports = mongoose.model('Exercise', exerciseSchema)
