import uuid from 'uuid';

require('dotenv').config();

const express = require('express');
const http = require('http')
const io = require('socket.io');
const redis = require('socket.io-redis');
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'eu-central-1',
});

const db = new AWS.DynamoDB();
const dynamoDb = new db.DocumentClient();

db.listTables(function(err, data) {
  console.log(err);
  console.log(data.TableNames);
});


const app = express();
const server = http.Server(app);
const websocket = io(server);
server.listen(3000, () => console.log('listening on *:3000'));

const redisAdapter = redis({ host: 'localhost', port: 6379 });
websocket.adapter(redisAdapter);


// The event will be called when a client is connected.
websocket.on('connection', (socket) => {
  socket.on('authorize', ({ user, rooms }) => {
    rooms.forEach(room => socket.join(room));
    console.log(user)

    socket.on('send message', (room, message) => {
      dynamoDb.put({
          TableName: 'Chat',
          Item: {
            id: uuid.v1(),
            userId: user,
            message: message
          }
      });
      
      socket.broadcast.to(room).emit('receive message', message);
    });
  });
  console.log('A client just joined on', socket.id);
});