
import express from 'express';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'node:path';
import path from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3500;
const ADMIN = 'Admin';

const app = express();

app.use(express.static(path.join(__dirname, 'public')));


const expressServer = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// sate 
const usersState = {
  users: [],
  setUser: function (newUserArray) {
    this.users = newUserArray;
  },

}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


const io = new Server(expressServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5500', 'http://127.0.0.1:5500'],
  },
});


io.on('connection', (socket) => {
  socket.emit('greeting message', buildMsg(`${ADMIN}:`, 'Welcome to the chat App!'));

  socket.on('enter room', ({ name, room }) => {
    // leave previous rooms
    const prevRoom = getUser(socket.id)?.room;
    if (prevRoom) {
      socket.leave(prevRoom);
      socket.to(prevRoom).emit('chat message', buildMsg(ADMIN, `${name} has left the chat room`));
    }

    const user = activateUser(socket.id, name, room);

    if (prevRoom) {
      socket.to(prevRoom).emit('userList', {
        // room: prevRoom,
        users: getUsersInRoom(prevRoom),
      })
    }

    // join new room
    socket.join(user.room);

    // send room info to specific user
    socket.emit('chat message', buildMsg(ADMIN, `You have join ${user.room} chat room`));

    // send room info to all users in the room
    socket.broadcast.to(user.room).emit('chat message', buildMsg(ADMIN,
      `${user.name} has joined the room`));


    //Update user list for room
    io.to(user.room).emit('userList', {
      users: getUsersInRoom(user.room),
    })

    //Update room list for everyone
    io.emit('roomList', {
      rooms: getAllActiveRooms(),
    });

  });


  // Listen for user disconnect
  socket.on('disconnect', () => {
    const user = getUser(socket.id);
    userLeaveRoom(socket.id);

    if (user) {
      io.to(user.room).emit('chat message', buildMsg(ADMIN, `${user.name} has left the room`))

      io.to(user.room).emit('userList', {
        users: getUsersInRoom(user.room)
      });

      io.emit('roomList', {
        rooms: getAllActiveRooms()
      });
    }

    socket.disconnect();
  });

  // Listen for a message from the client
  socket.on('chat message', ({ name, msg }) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      io.to(room).emit('chat message', buildMsg(name, msg));
    }
  });


  // Listen for user typing
  socket.on('activity', (name) => {
    const room = getUser(socket.id)?.room;
    if (room) {
      socket.broadcast.to(room).emit('activity', name);
    }

  });
});


function buildMsg(name, msg) {
  return {
    name,
    msg,
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }).format(new Date()),
  };
}


//User functions
function activateUser(id, name, room) {
  const user = {
    id,
    name,
    room,
  };
  usersState.setUser([
    ...usersState.users.filter((user) => user.id !== id),
    user,
  ])
  return user;
}


//User leaves room
function userLeaveRoom(id) {
  const user = deactivateUser(id);
  if (user) {
    io.to(user.room).emit('roomList', {
      room: user.room,
      user: getUsersInRoom(user.room),
    });
  }
}

//Get current user
function getUser(id) {
  return usersState.users.find((user) => user.id === id);
}

//Get users in room
function getUsersInRoom(room) {
  return usersState.users.filter((user) => user.room === room);
}

//Get all active rooms
function getAllActiveRooms() {
  return Array.from(new Set(usersState.users.map((user) => user.room)));
}


//User leaves chat
function deactivateUser(id) {
  usersState.setUser(usersState.users.filter((user) => user.id !== id));
}
