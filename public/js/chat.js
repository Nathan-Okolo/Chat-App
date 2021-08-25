const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = document.querySelector('input')
const $messageFormButton = document.querySelector('button')
const $messages = document.querySelector('#messages')

//Templets
const messageTemplate = document.querySelector('#message-templete').innerHTML
const locationMessageTemplate = document.querySelector('#location-templete').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //Visible Height
    const visibleHeight = $messages.offsetHeight

    //Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}
socket.on('message',(wel)=>{
    console.log(wel)
    const html = Mustache.render(messageTemplate, {
        username: wel.username,
        message: wel.text,
        createdAt: moment(wel.createdAt).format('LT')
    })
    $messages.insertAdjacentHTML("beforeend",html)
    autoscroll()

})

 
socket.on('locationMessage',(mess)=>{
    const html = Mustache.render(locationMessageTemplate, {
        username:mess.username, 
        url: mess.url,
        createdAt: moment(mess.createdAt).format('LT')
    })
    console.log(html)

    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()

})

socket.on('roomData',({room, users})=>{
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// socket.on('locationMessage',(url)=>{
//     const html = Mustache.render(locationMessageTemplate, {
//         username:url.username, 
//         url: url.url,
//         createdAt: moment(url.createdAt).format('LT')
//     })
//     $messages.insertAdjacentHTML('beforeend',html)
//     console.log(html)

// })



// SENDING A MESSAGE
$messageForm.addEventListener('submit',(e)=>{
    e.preventDefault() 

    $messageFormButton.setAttribute('disabled','disabled')
    // Disable
    const message = e.target.elements.messageInputed.value
    socket.emit('send message', message,(error)=>{
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        //enable
        
        if (error){
            return console.log(error)
        }
    })
})


//SENDING YOUR LOCATION WITH NODE

const $sendLocation = document.querySelector('#send-location')

$sendLocation.addEventListener('click',()=>{
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser')
    }
    $sendLocation.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        const location = `https://google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        console.log('this comes first')
        console.log('Your location has been shared with others')
       
        socket.emit('share location',location,  ()=>{
            console.log('location shared')
        })
        $sendLocation.removeAttribute('disabled')
    })
})
socket.emit('join', {username, room}, (error)=>{
    if (error){
        alert(error)
        location.href = '/'
    }
})