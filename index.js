const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js')

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))

app.enable('verbose errors')

app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// --- SNAKE LOGIC GOES BELOW THIS LINE ---

// Handle POST request to '/start'
app.post('/start', (request, response) => {
  // NOTE: Do something here to start the game

  // Response data
  const data = {
    color: '#d3d3d3',
  }

  return response.json(data)
})

// Handle POST request to '/move'
app.post('/move', (req, response) => {
  // NOTE: Do something here to generate your move

  // Response data

  const data = {
    move: 'right' // one of: ['up','down','left','right']
  }

  // if (req.you.body[0].x === 1) {
  //   data.move = 'down';
  // }

  // if (req.you.body[0].x === req.board.width) {
  //   data.move = 'up';
  // }

  // if (req.you.body[0].y === 1) {
  //   data.move = 'left';
  // }

  // if (req.you.body[0].y === req.board.height) {
  //   data.move = 'right';
  // }

  return response.json(data.move)
})

app.post('/end', (request, response) => {
  // NOTE: Any cleanup when a game is complete.

  return response.json({})
})

app.post('/ping', (request, response) => {
  // Used for checking if this snake is still alive.
  return response.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
