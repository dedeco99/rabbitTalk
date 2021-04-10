const express = require("express");
const socket = require("socket.io");

const app = express();

app.set("port", process.env.PORT || 5000);

const server = app.listen(app.get("port"), () => {
  console.log("Listening on port", app.get("port"));
});

const users = {};

const socketToRoom = {};

const io = socket(server);
io.sockets.on("connection", (socket) => {
  console.log("Connected", socket.id);

  socket.on("joinRoom", (roomId) => {
    if (users[roomId]) {
      const length = users[roomId].length;
      if (length === 4) {
        socket.emit("roomFull");
        return;
      }
      users[roomId].push(socket.id);
    } else {
      users[roomId] = [socket.id];
    }
    socketToRoom[socket.id] = roomId;
    const usersInThisRoom = users[roomId].filter((id) => id !== socket.id);

    socket.emit("allUsers", usersInThisRoom);
  });

  socket.on("sendingSignal", (payload) => {
    io.to(payload.userToSignal).emit("userJoined", {
      signal: payload.signal,
      callerId: payload.callerId,
    });
  });

  socket.on("returningSignal", (payload) => {
    io.to(payload.callerId).emit("receivingReturnedSignal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomId = socketToRoom[socket.id];
    let room = users[roomId];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomId] = room;
    }
  });
});
