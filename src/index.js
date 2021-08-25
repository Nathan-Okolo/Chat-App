const path = require('path')
const http =require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessages, generateLocation} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT||3000
const publicDirPath = path.join(__dirname,'../public')

app.use(express.static(publicDirPath))


io.on('connection',(socket)=>{
        console.log('new WebSocket connection')

        socket.on('join',({username, room}, callback)=>{
            const {user, error}= addUser({id: socket.id, username, room})
            if(error){
               return  callback(error)
            }
            console.log(user)
            socket.join(user.room)
            const wel = `Welcome ${user.username}!!!`
            socket.emit('message',generateMessages('Admin',wel))
            socket.broadcast.to(user.room).emit('message',generateMessages('Admin',`${user.username} has joind the group chat`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            
            callback()
        })

    socket.on('send message', (message, callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()
        console.log(user)
        if(filter.isProfane(message)){
            return callback('profanity is not allowed')
        }

        io.to(user.room).emit('message', generateMessages(user.username, message))
        callback()
    })

    socket.on('share location',(location, callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username, location))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message',generateMessages('Adimin', `${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server .listen(port,()=>{
    console.log(`Server is up on port ${port} `)
})