const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const sqlite3 = require('sqlite3').verbose()
const bodyParser = require('body-parser')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

// SQLite database setup
const db = new sqlite3.Database('chatroom.db') // Change to file path for persistent storage

db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)',
  )
  db.run(
    'CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER, message TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(userId) REFERENCES users(id))',
  )
})

// Express middleware
app.use(bodyParser.json())

// User authentication
app.post('/login', (req, res) => {
  const {username, password} = req.body
  db.get(
    'SELECT id FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, row) => {
      if (err) {
        return res.status(500).json({error: 'Database error'})
      }
      if (!row) {
        return res.status(401).json({error: 'Invalid username or password'})
      }
      res.json({userId: row.id})
    },
  )
})

// Joining the chat room
app.post('/join', (req, res) => {
  const {userId} = req.body
  // Implement authorization logic here if needed
  io.emit('userJoined', userId)
  res.sendStatus(200)
})

// Sending messages
app.post('/send-message', (req, res) => {
  const {userId, message} = req.body
  db.run(
    'INSERT INTO messages (userId, message) VALUES (?, ?)',
    [userId, message],
    err => {
      if (err) {
        return res.status(500).json({error: 'Database error'})
      }
      io.emit('message', {userId, message})
      res.sendStatus(200)
    },
  )
})

// Retrieving chat history
app.get('/chat-history', (req, res) => {
  db.all('SELECT * FROM messages', (err, rows) => {
    if (err) {
      return res.status(500).json({error: 'Database error'})
    }
    res.json(rows)
  })
})

// WebSocket communication
io.on('connection', socket => {
  console.log('A user connected')

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
