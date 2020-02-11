const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
	username: {
		type: String,
		unique: true,
		required: true,
		minlength: 5
	}
})

module.exports = mongoose.model('User', userSchema)
