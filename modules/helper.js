let roomArr = [];

function addHost(socketId, roomId, nickname, screenWidth, screenHeight) {
  let room = {
    roomId: roomId,
    users: []
  }

  let host = {
    socketId: socketId,
    nickname: nickname,
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    type: "host"
  }

  room.users.push(host);
  roomArr.push(room);
}

function addGuest(roomId, socketId, nickname, screenWidth, screenHeight) {
  let index = roomArr.findIndex(x => x.roomId == roomId);

  let guest = {
    socketId: socketId,
    nickname: nickname,
    screenWidth: screenWidth,
    screenHeight: screenHeight,
    type: "guest"
  }

  roomArr[index].users.push(guest);
}

function getRoomId(socketId){
  let roomIndex = -1;
  
  for (let i = 0; i < roomArr.length; i++) {
    for (let j = 0; j < roomArr[i].users.length; j++) {
      if (socketId == roomArr[i].users[j].socketId) {
        roomIndex = i;
      }
    }
  }
  
  if (roomArr[roomIndex] != undefined) {
    return (roomArr[roomIndex].roomId);
  }
 
}

function getRoomIndex(id) {
  return roomArr.findIndex(x => x.roomId == id);
}

function getRoom(index) {
  return roomArr[index];
}

function getUser(id, roomIndex) {
  if (roomArr[roomIndex] != undefined) {
    let userIndex = roomArr[roomIndex].users.findIndex(x => x.socketId == id);

    return roomArr[roomIndex].users[userIndex];
  }
}

function deleteUser(id, roomIndex) {
  if (roomArr[roomIndex] != undefined) {
    let userIndex = roomArr[roomIndex].users.findIndex(x => x.socketId == id);
    roomArr[roomIndex].users.splice(userIndex, userIndex + 1);
  }
}

function deleteRoom(id) {
  let roomIndex = roomArr.findIndex(x => x.roomId == id);
  roomArr.splice(roomIndex, roomIndex + 1);
}

function guestAuth(id) {
  if (roomArr.find(x => x.roomId == id) != null) {
    return true;
  }
  else {
    return false;
  }
}

module.exports = {
  addHost,
  addGuest,
  getRoomId,
  getRoomIndex,
  getRoom,
  getUser,
  deleteUser,
  deleteRoom,
  guestAuth,
  roomArr
}