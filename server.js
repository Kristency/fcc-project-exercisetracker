const express = require('express')
const app = express()
require('dotenv').config()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track', {
	useNewUrlParser: true,
	useUnifiedTopology: true
})

const PORT = process.env.PORT || 3000

app.use(cors())

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html')
})

// requiring models
const User = require('./models/user')
const Exercise = require('./models/exercise')

app.post('/api/exercise/new-user', async (req, res) => {
	let { username } = req.body
	try {
		let { _id } = await User.create({ username })
		res.json({ username, _id })
	} catch (e) {
		res.json(e.message)
	}
})

function buildDbQuery(query) {
	dbQuery = {}
	let { userId, from, to } = query
	dbQuery['userId'] = userId
	if (from) {
		dbQuery.date['$gte'] = new Date(from)
	}
	if (to) {
		dbQuery.date['$lte'] = new Date(to)
	}

	return dbQuery
}

app.get('/api/exercise/users', async (req, res) => {
	try {
		let foundUsers = await User.find({}, { __v: 0 })
		res.json(foundUsers)
	} catch (e) {
		res.json(e.message)
	}
})

app.post('/api/exercise/add', async (req, res) => {
	let { userId, description, duration, date } = req.body
	let parsedDate
	if (!date) {
		parsedDate = new Date()
	} else {
		parsedDate = new Date(date)
	}

	try {
		let foundUser = await User.findOne({ _id: userId }, { __v: 0 })
		if (!foundUser) {
			res.json({ error: 'No user found matching the user id' })
		}
		let { username, _id } = foundUser
		await Exercise.create({
			userId,
			description,
			duration,
			date: parsedDate
		})
		// foundUser.log.push(createdExercise)
		// await foundUser.save()
		res.json({ username, _id, description, duration, date: parsedDate })
	} catch (e) {
		res.json(e.message)
	}
})

app.get('/api/exercise/log', async (req, res) => {
	let dbQuery = buildDbQuery(req.query)
	// let projectionFields = { __v: 0 }
	let { userId, limit } = req.query
	try {
		/* if user references the exercise model and keeps only object ids in its log array */
		// let foundUser = await (
		// 	await User.findOne(dbQuery, projectionFields).populate({
		// 		path: 'log',
		// 		select: { _id: 0, __v: 0 }
		// 	})
		// ).execPopulate()
		let foundUser = await User.findOne({ _id: userId }, { __v: 0 })
		if (!foundUser) {
			res.json({ error: 'No user found matching the user id' })
		}

		let [{ count: totalExercisesCount }] = await Exercise.aggregate([
			{ $group: { _id: null, count: { $sum: 1 } } },
			{ $project: { _id: 0 } }
		])

		let foundLogs = await Exercise.aggregate([
			{ $match: dbQuery },
			{ $project: { _id: 0, __v: 0, userId: 0 } },
			{ $limit: limit ? parseInt(limit) : totalExercisesCount }
		])

		res.json({
			_id: foundUser._id,
			username: foundUser.username,
			count: totalExercisesCount,
			log: foundLogs
		})
	} catch (e) {
		res.json(e.message)
	}
})

// Not found middleware
app.use((req, res, next) => {
	return next({ status: 404, message: 'not found' })
})

// Error Handling middleware
app.use((err, req, res, next) => {
	let errCode, errMessage

	if (err.errors) {
		// mongoose validation error
		errCode = 400 // bad request
		const keys = Object.keys(err.errors)
		// report the first validation error
		errMessage = err.errors[keys[0]].message
	} else {
		// generic or custom error
		errCode = err.status || 500
		errMessage = err.message || 'Internal Server Error'
	}
	res.status(errCode)
		.type('txt')
		.send(errMessage)
})

app.listen(PORT, () => {
	console.log(`Your app is listening on port ${PORT}`)
})
