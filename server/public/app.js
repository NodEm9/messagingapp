const socket = io('https://dix-chat.onrender.com');

const activity = document.querySelector('.activity');
const msgInput = document.querySelector('.message__input');
const nameInput = document.querySelector('.user');
const chatRoom = document.querySelector('.room-name');

const usersList = document.querySelector('.user-list');
const roomsList = document.querySelector('.room-list');
const chatMessage = document.querySelector('.chat__message');


function sendMessage() {
  if (msgInput.value && nameInput.value && chatRoom.value) {
    socket.emit('chat message', {
      name: nameInput.value,
      msg: msgInput.value,
    });
    msgInput.value = '';
  }
  msgInput.focus();

}

//Enter room function
function enterRoom() {
  if (chatRoom.value) {
    socket.emit('enter room', {
      name: nameInput.value,
      room: chatRoom.value
    });
  }

}

document.querySelector('.message-form').addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
})

document.querySelector('.chat-room').addEventListener('submit', (e) => {
  e.preventDefault();
  enterRoom();
})


//Emit admin message
// socket.on('greeting message', (data) => {
//   const { name, msg } = data;
//   const div = document.createElement('div')
//   div.className = 'admin_chat__message'
//   if (data) {
//     div.textContent = `${name} ${msg} `
//   }
//   document.querySelector('.admin').appendChild(div)
// })


//Emit user message
socket.on('chat message', (data) => {
  activity.textContent = '';
  const { name, msg, time } = data;

  const li = document.createElement('li')
  li.className = 'post'

  if (name === nameInput.value) li.className = 'post post--left'
  if (name !== nameInput.value && name !== 'Admin') li.className = 'post post--right'

  if (name !== 'Admin') {
    li.innerHTML = `<div class="post__header"  
    ${name === nameInput.value
        ? 'post__header--user'
        : 'post__header--reply'
      }>
    <span class="post__header--name">${name}</span> 
    <span class="post__header--time">${time}</span>
  </div>
  <div class="post__message" >${msg}</div>
  `
  } else {
    li.innerHTML = `<div class="post__message" id="post__message">${msg}</div>`
  }
  document.querySelector('.chat__message').appendChild(li)

  chatMessage.scrollTop = chatMessage.scrollHeight;

})

//Emit user activity
msgInput.addEventListener('keypress', () => {
  socket.emit('activity', `${socket.id.substring(0, 5)} is typing...`)
})

let activityTimer;
socket.on('activity', (name) => {
  activity.textContent = `${name} is typing...`;

  setTimeout(() => {
    activity.textContent = '';
  }, 2000);
})

socket.on('userList', (users) => {
  showUsers(users);
})

socket.on('roomList', (rooms) => {
  showRooms(rooms);
})


//Helper functions to display users and rooms
function showUsers({ users }) {
  usersList.textContent = '';
  if (users) {
    usersList.innerHTML = `<em class="user__list">Users in ${chatRoom.value}: </em>`
    users.forEach(user => {
      usersList.textContent += user.name
      if (user !== users[users.length - 1]) {
        usersList.textContent += ', '
      }
    })
  }
}

//Helper functions to display` rooms
function showRooms({ rooms }) {
  roomsList.textContent = '';
  if (rooms) {
    roomsList.innerHTML = `<em class="room__list">Active Rooms:</em>`
    rooms.forEach(room => {
      roomsList.textContent += room
      if (room !== rooms[rooms.length - 1]) {
        roomsList.textContent += ', '
      }
    }
    )
  }
}