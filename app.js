import { createServer } from "http";

import express from "express";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server);

const port = process.env.PORT || 3000;

app.use(express.static("public"));

let activeUsers = [];

io.on("connection", (socket) => {

    const socketExist = activeUsers.find(socketExist => socketExist === socket.id );

    if(!socketExist){
        activeUsers.push(socket.id);
    }

    socket.emit('Update-User-List',{
        users:activeUsers.filter(
            (socketExist)=>socketExist!==socket.id
        )
    });

    socket.broadcast.emit('Update-User-List',{
        users:[socket.id],
    })

    socket.on('call-user',data=>{
        socket.to(data.to).emit('call-made',{
            offer:data.offer,
            socket:socket.id,
        })
    })

    socket.on('make-answer',data=>{
        socket.to(data.to).emit('answer-made',{
            socket:socket.id,
            answer:data.answer
        })
    })

    socket.on('reject-call',data=>{
        console.log(data.from);
        socket.to(data.from).emit('call-rejected',{
            socket:socket.id,
        })
    })

    socket.on('disconnect',()=>{
        activeUsers=activeUsers.filter(
            socketExist => socketExist !== socket.id
        )

        socket.broadcast.emit('remove-user',{
            socketId:socket.id
        })
    })

});

server.listen(port, () => console.log(`Server is running on port ${port}`));
