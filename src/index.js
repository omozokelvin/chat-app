const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage, generateLocationMessage} = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectoryPath = path.join(__dirname, '../public');

app.use(express.static(publicDirectoryPath));

//socket.emit - sends an event to a specific client
//io.emit - sends an event to every connected client
//socket.broadcast.emit - sends an event to every connected client except the specific client
//io.to.emit - sends a message to everyone on a room
//socket.broadcast.to(<room_name>).emit - send a message to everyone in a room except the specific client

io.on('connection', (socket) => {
  console.log('New WebSocket connection');

  socket.on('join', ({username, room}, callback) => {

    const {error, user} = addUser({
      id: socket.id,
      username,
      room
    })

    if(error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit('message', generateMessage('Admin', 'Welcome'));
    socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${ user.username } has joined!`));

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    })

    callback();
  })

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);

    const filter = new Filter();

    if(filter.isProfane(message)) {
      return callback('Profanity is not allowed')
    }

    io.to(user.room).emit('message', generateMessage(user.username, message));
    callback(); //acknowledgement
  })

  socket.on('sendLocation', ({latitude, longitude}, callback) => {
    const user = getUser(socket.id);

    io.to(user.room).emit('locationMessage', generateLocationMessage({username: user.username, latitude, longitude}));
    callback();
  })

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if(user) {
      io.to(user.room).emit('message', generateMessage('Admin', `${ user.username } has left`));

      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      })
    }
  })
})

server.listen(port, () => {
  console.log(`Server is up on ${ port }!`);
})