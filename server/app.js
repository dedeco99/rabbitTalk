const express = require("express");
const path = require("path");
const socket = require("socket.io");

const app = express();

app.set("port", process.env.PORT || 5000);

app.use(express.static(path.join(__dirname, "build")));

app.get("*/", (req, res) => {
  res.sendFile(path.join(`${__dirname}/build/index.html`));
});

const server = app.listen(app.get("port"), () => {
  console.log("Listening on port", app.get("port"));
});

const users = {};

const socketToRoom = {};

const io = socket(server);
io.sockets.on("connection", (socket) => {
  console.log("Connected", socket.id);

  socket.on("userConnected", (roomId) => {
    console.log(socket.id, "joined room", roomId);

    if (users[roomId]) {
      users[roomId].push(socket.id);

      socket.join(roomId);
      socket.emit("roomJoined", roomId);
    } else {
      users[roomId] = [socket.id];

      socket.join(roomId);
      socket.emit("roomCreated", roomId);
    }
  });

  socket.on("startCall", (roomId) => {
    socket.broadcast.to(roomId).emit("startCall");
  });

  socket.on("createOffer", (event) => {
    socket.broadcast.to(event.roomId).emit("createOffer", event.sdp);
  });

  socket.on("createAnswer", (event) => {
    socket.broadcast.to(event.roomId).emit("createAnswer", event.sdp);
  });

  socket.on("sendIceCandidate", (event) => {
    socket.broadcast.to(event.roomId).emit("sendIceCandidate", event);
  });

  socket.on("disconnect", () => {
    console.log(socket.id, "disconnected");
    const roomId = socketToRoom[socket.id];
    let room = users[roomId];
    if (room) {
      room = room.filter((id) => id !== socket.id);
      users[roomId] = room;

      for (const user of users[roomId]) {
        const usersInThisRoom = users[roomId].filter((id) => id !== user);

        io.to(user).emit("usersInRoom", usersInThisRoom);
      }
    }
  });
});
