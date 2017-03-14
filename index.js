'use strict'

const five = require('johnny-five');
const Tessel = require('tessel-io');
const av = require('tessel-av');
const camera = new av.Camera({ width: 720, height: 540 })

const fs = require('fs');
const path = require('path');

const request = require('request');
const io = require('socket.io-client');

const board = new five.Board({
  io: new Tessel()
})

board.on('ready', () => {
  const socket = io.connect('http://brianjleeofcl-endpoint-test.herokuapp.com')

  socket.on('connect', () => {
    socket.emit('join', 'Board says hello')
  })

  socket.on('instruction-camera-on', (interval, loop) => {
    socket.send('instructions received')
    let total = 0;

    board.loop(interval, done => {
      if (total > loop) {
        done()
      }
      const time = Date.now()

      camera.capture()
      .pipe(fs.createWriteStream(path.join('/mnt/sda', `${time}.jpg`)))
      .on('finish', () => {
        fs.createReadStream(path.join('/mnt/sda', `${time}.jpg`))
          .pipe(request.post('http://brianjleeofcl-endpoint-test.herokuapp.com/upload'))
        console.log(`${time}.jpg`);
        socket.send(`${time}.jpg`);
      })
      total++
    })
  })
})
