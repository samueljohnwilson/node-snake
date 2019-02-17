const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');
const {
  createGrid,
  enemyArray,
  findEnemyHeads,
  findEnemyTails,
  findKillableSnakes,
  findLowerHealthSnakes,
  findNearestFood,
  findShortSnakes,
  followPath,
  randomMove,
  snakeArray,
  updateGrid
} = require('./helpers.js');

const {
  eat,
  followEnemyTail,
  followOwnTail,
  kill
} = require('./behaviours.js');

const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler,
} = require('./handlers.js');

const app = express();

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001));
app.enable('verbose errors');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(poweredByHandler);

// Handle POST request to '/start'
app.post('/start', (req, res) => {

  console.log('Yaaaasssssssss');

  const data = {
    color: '#770001'
  };

  return res.json(data);
});

// Handle POST request to '/move'
app.post('/move', (req, res) => {
  const { board, you: ourSnake } = req.body;
  const { 
    height,
    width,
    food,
    snakes: allSnakes,
  } = board;
  const ourHead = ourSnake.body[0];
  const ourTail = ourSnake.body[ourSnake.body.length - 1];
  const ourLength = ourSnake.body.length;

  const left = { x: ourHead.x - 1, y: ourHead.y, move: 'left' };
  const right = { x: ourHead.x + 1, y: ourHead.y, move: 'right' };
  const up = { x: ourHead.x, y: ourHead.y - 1, move: 'up' };
  const down = { x: ourHead.x, y: ourHead.y + 1, move: 'down' };
  const possibleDirections = [left, right, up, down];

  const enemies = enemyArray(allSnakes, ourSnake);
  let grid = createGrid(height, width, ourSnake, enemies);
  const pathObject = {
    grid: grid,
    start: ourHead,
    possibleDirections: possibleDirections,
    ourSnake: ourSnake,
    allSnakes: allSnakes,
    height: height,
    width: width
  }

  const nearbyFood = findNearestFood(ourHead, food);
  const lowerHealthEnemies = findLowerHealthSnakes(ourSnake, enemies);
  
  let pathToFood = eat(pathObject, nearbyFood);
  let pathToOwnTail = followOwnTail(pathObject, ourTail);
  let pathToEnemyTail = followEnemyTail(pathObject, enemies);
  let pathToVictim = kill(pathObject, ourLength, enemies);
  let nextMove = false;

  if (pathToVictim) {
    nextMove = pathToVictim;
  } else if (nearbyFood && pathToFood) {
    nextMove = pathToFood;
  } else if (pathToOwnTail) {
    nextMove = pathToOwnTail;
  } else if (pathToEnemyTail) {
    nextMove = pathToEnemyTail;
  } else {
    nextMove = randomMove(pathObject);
  }

  if (!nextMove) {
    objectPath.grid = updateGrid(height, width, ourSnake, enemies);

    pathToFood = eat(pathObject, nearbyFood);
    pathToOwnTail = followOwnTail(pathObject, ourTail);
    pathToEnemyTail = followEnemyTail(pathObject, enemies);
    pathToVictim = kill(pathObject, ourLength, enemies);

  }

  const data = {
    move: nextMove
  }

  console.log('Sending to server: ' + JSON.stringify(data));

  return res.json(data);
});

app.post('/end', (req, res) => {
  // NOTE: Any cleanup when a game is complete.

  return res.json({})
})

app.post('/ping', (req, res) => {
  // Used for checking if this snake is still alive.
  return res.json({});
})

// --- SNAKE LOGIC GOES ABOVE THIS LINE ---

app.use('*', fallbackHandler)
app.use(notFoundHandler)
app.use(genericErrorHandler)

app.listen(app.get('port'), () => {
  console.log('Server listening on port %s', app.get('port'))
})
