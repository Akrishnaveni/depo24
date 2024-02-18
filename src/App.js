import React, {useState, useEffect} from 'react'
import io from 'socket.io-client'

const socket = io.connect('http://localhost:3001') // Connect to the backend server

const App = () => {
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [users, setUsers] = useState([])

  // Listen for incoming messages from the server
  useEffect(() => {
    socket.on('message', message => {
      setMessages([...messages, message])
    })
    socket.on('users', userList => {
      setUsers(userList)
    })
    // Clean up socket listener when component unmounts
    return () => {
      socket.off('message')
      socket.off('users')
    }
  }, [messages])

  // Function to handle sending messages
  const sendMessage = () => {
    if (messageInput.trim() !== '') {
      socket.emit('message', messageInput)
      setMessageInput('')
    }
  }

  return (
    <div className="chat-room-container">
      <div className="chat-window">
        {messages.map((message, index) => (
          <div key={index} className="message">
            {message}
          </div>
        ))}
      </div>
      <div className="user-list">
        <h2>Active Users</h2>
        <ul>
          {users.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
      <div className="message-input">
        <input
          type="text"
          value={messageInput}
          onChange={e => setMessageInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  )
}

export default App
