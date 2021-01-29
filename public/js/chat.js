const socket = io();

//Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');
const $sendLocationButton = document.querySelector('#send-location');
const $messages = document.querySelector('#messages');
const $sidebar = document.querySelector('#sidebar');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationMessageTemplate = document.querySelector('#location-message-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Get params
let params = new URLSearchParams(location.search);
const username = params.get('username');
const room = params.get('room');

const autoScroll = () => {
  //New message element
  $newMessage = $messages.lastElementChild;

  //Height of new messages
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible Height
  const visibleHeight = $messages.offsetHeight;

  //Height of messages container
  const containerHeight = $messages.scrollHeight;

  //How far have i scrolled
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if(containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }

  // console.log(newMessageStyles);
}

socket.on('message', ({username, text, createdAt}) => {
  console.log({username, text, createdAt});

  const html = Mustache.render(messageTemplate, {
    username,
    message: text,
    createdAt: moment(createdAt).format('h:mm a')
  });

  $messages.insertAdjacentHTML('beforeend', html);

  autoScroll();
})

socket.on('locationMessage', ({username, url, createdAt}) => {
  console.log({username, url, createdAt});

  const html = Mustache.render(locationMessageTemplate, {
    username,
    url,
    createdAt: moment(createdAt).format('h:mm a')
  })

  $messages.insertAdjacentHTML('beforeend', html);

  autoScroll();
})

socket.on('roomData', ({room, users}) => {
  console.log(room, users);
  const html = Mustache.render(sidebarTemplate, {
    room,
    users
  });

  $sidebar.innerHTML = html;
})

$messageForm.addEventListener('submit', (e) => {
  e.preventDefault();

  $messageFormButton.setAttribute('disabled', 'disabled');

  const message = e.target.elements.message.value;

  socket.emit('sendMessage', message, (error) => {
    $messageFormButton.removeAttribute('disabled');
    $messageFormInput.value = '';
    $messageFormInput.focus();

    if(error) {
      return console.log(error);
    }

    console.log('Message delivered');
  });
})

$sendLocationButton.addEventListener('click', (e) => {
  if(!navigator.geolocation) {
    return alert('Geolocation is not supported by your browser');
  }

  $sendLocationButton.setAttribute('disabled', 'disabled');

  navigator.geolocation.getCurrentPosition((position) => {
    const {latitude, longitude} = position.coords;

    socket.emit('sendLocation', {latitude, longitude},
      () => {
        $sendLocationButton.removeAttribute('disabled');
        console.log('Location shared!');
      })
  })
})

socket.emit('join', {username, room}, (error) => {
  if(error) {
    alert(error);
    location.href = '/';
  }
})