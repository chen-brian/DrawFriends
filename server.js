const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const helper = require('./modules/helper.js');
const absolutePath = {
  root: path.join(__dirname, 'public')
}

app.use(express.static('public'));
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', (req, res) => {
  res.sendFile('home.html', absolutePath);
});


app.get('/:id', (req, res) => {
  if (helper.guestAuth(req.params.id)) {
    res.sendFile('home.html', absolutePath);
  }
  else {
    res.redirect('https://drawfriends.herokuapp.com');
  }
});

io.on('connection', (socket) => {
  socket.on('add host', (nickname, screenWidth, screenHeight) => {
    let roomId = uuidv4();
    helper.addHost(socket.id, roomId, nickname, screenWidth, screenHeight);
    
    let roomIndex = helper.getRoomIndex(roomId);
    socket.join(roomId);
    io.to(roomId).emit('update lobby', helper.getRoom(roomIndex).users);
    socket.emit('invite link', roomId);

  });

  socket.on('add guest', (nickname, roomId, screenWidth, screenHeight) => {
    if (helper.guestAuth(roomId)) {
      helper.addGuest(roomId, socket.id, nickname, screenWidth, screenHeight);
    
      let roomIndex = helper.getRoomIndex(roomId);
      let roomData = helper.getRoom(roomIndex).users
      socket.join(roomId);
      io.to(roomId).emit('update lobby', roomData);
      socket.to(roomId).emit('user has joined message', nickname);
      socket.emit('welcome to user room message', roomData[0].nickname);
    }
    else {
      let roomId = uuidv4();
      helper.addHost(socket.id, roomId, nickname, screenWidth, screenHeight);
      
      let roomIndex = helper.getRoomIndex(roomId);
      socket.join(roomId);
      io.to(roomId).emit('update lobby', helper.getRoom(roomIndex).users);
      socket.emit('invite link', roomId);
    }
  });
  
  socket.on('remove then add primary and secondary canvases', () => {
    let roomId = helper.getRoomId(socket.id);
    let roomIndex = helper.getRoomIndex(roomId);
    io.to(roomId).emit('remove then add primary and secondary canvases', helper.getRoom(roomIndex).users, socket.id);
    
  });

  socket.on('color change', (hexCode, socketId) => {
    let roomId = helper.getRoomId(socket.id);
    
    socket.emit('stroke color of primary canvas', hexCode);
    
    socket.to(roomId).emit('stroke color of secondary canvas' + socketId, hexCode);
    
  });

  socket.on('line width change', (lineWidth, socketId) => {
    let roomId = helper.getRoomId(socket.id);
    socket.emit('stroke width of primary canvas', lineWidth);
    socket.to(roomId).emit('stroke width of secondary canvas' + socketId, lineWidth);
    
  });
 
  socket.on('show user in lobby', () => {
    let roomId = helper.getRoomId(socket.id);
    let roomIndex = helper.getRoomIndex(roomId);
    io.to(roomId).emit('users in room', helper.getRoom(roomIndex).users);
  });

  socket.on('initialize tag color', (color, socketId) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('initialize tag color' + socketId, color);
  });
  socket.on('change tag color', (color, socketId) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('change tag color' + socketId, color);
  });

  socket.on('start drawing on secondary canvas', (x, y, id) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('start drawing on secondary canvas' + id, x, y);
    
  });

  socket.on('continuation of drawing on secondary canvas', (x, y, id) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('continuation of drawing on secondary canvas' + id, x, y);
  });

  socket.on('start erasing on secondary canvas', (x, y, id, eraserSize) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('start erasing on secondary canvas' + id, x, y, eraserSize);
    
  });

  socket.on('continuation of erasing on secondary canvas', (x, y, id, eraserSize) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('continuation of erasing on secondary canvas' + id, x, y, eraserSize);
  });

  socket.on('stop on secondary canvas', (socketId) => {
    let roomId = helper.getRoomId(socket.id);
    socket.to(roomId).emit('stop on secondary canvas' + socketId);
  });


  socket.on('user msg', (msg, nickname, color) => {
    let roomId = helper.getRoomId(socket.id);
    io.to(roomId).emit('display user msg', msg, nickname, color);
  });


  socket.on('disconnect', () => {
    let roomId = helper.getRoomId(socket.id);
    let roomIndex = helper.getRoomIndex(roomId);
    let user = helper.getUser(socket.id, roomIndex);

    if (user != undefined) {
      let nickname = helper.getUser(socket.id, roomIndex).nickname;
      io.to(roomId).emit('user left message', nickname);

      if (helper.getRoom(roomIndex).users.length > 1) {
        helper.deleteUser(socket.id, roomIndex);
        io.to(roomId).emit('update lobby', helper.getRoom(roomIndex).users);
      }
      else {
        helper.deleteUser(socket.id, roomIndex);
        helper.deleteRoom(roomId);
      }
    }
    
  });
});



http.listen(process.env.PORT || 3000, () => {
  console.log('listening on *:3000');
});