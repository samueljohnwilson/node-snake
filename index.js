const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');
const {
  avoidSnakeBody,
  avoidObstacles,
  avoidWalls,
  createGrid,
  enemyArray,
  findEnemyTails,
  findKillableSnakes,
  findLowerHealthSnakes,
  findNearestFood,
  findShortSnakes,
  followPath,
  randomMove,
  snakeArray,
  testPaths,
  updateGrid
} = require('./helpers.js');

const {
  eat,
  fillSpace,
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

let lastTailPosition;

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
  console.log(req.body.turn);
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
  let possibleDirections = [left, right, up, down];
  avoidObstacles(height, width, allSnakes, possibleDirections);

  const nearestFood = findNearestFood(ourHead, food);
  const enemies = enemyArray(allSnakes, ourSnake);
  let grid = createGrid(height, width, ourSnake, enemies);
  const pathObject = {
    grid: grid,
    start: ourHead,
    possibleDirections: possibleDirections,
    escapes: [],
    fullPath: [],
    ourHead: ourHead,
    ourLength: ourLength,
    ourSnake: ourSnake,
    ourTail: ourTail,
    enemySnakes: enemies,
    allSnakes: allSnakes,
    height: height,
    width: width
  }

  let pathToOwnTail;

  if (!lastTailPosition) {
    pathToOwnTail = false;
  } else {
    pathToOwnTail = followOwnTail(pathObject, lastTailPosition);
  }
  
  let pathToEnemyTail = followEnemyTail(pathObject, enemies);
  const fillingSpace = fillSpace(pathObject);
  pathObject.escapes = [ourTail];
  const enemyTails = findEnemyTails(enemies);

  enemyTails.forEach((enemyTail) => {
    pathObject.escapes.push(enemyTail);
  });

  const pathToFood = eat(pathObject, nearestFood);

  if (!pathToOwnTail) {
    possibleDirections = [left, right, up, down];
    avoidObstacles(height, width, allSnakes, possibleDirections, 1);
    pathObject.grid = updateGrid(height, width, ourSnake, enemies);
    pathObject.possibleDirections = possibleDirections;
    pathObject.target = ourTail;
    pathToOwnTail = followOwnTail(pathObject, ourTail);
  }

  let nextMove = false;

  try {
    if (nearestFood && pathToFood && ourSnake.health < 90) {
    console.log('pathToFood');
    nextMove = pathToFood;
  } else if (pathToOwnTail) {
    console.log('pathToOwnTail');
    nextMove = pathToOwnTail;
  } else if (pathToEnemyTail) {
    console.log('pathToEnemyTail');
    nextMove = pathToEnemyTail;
  } else if (fillingSpace) {
    console.log('fillingSpace');
    nextMove = fillingSpace;
  } else {
    console.log('randomMove')
    nextMove = randomMove(pathObject);
  }
} catch(err) {
  console.error(err)
  nextMove = randomMove(pathObject);
}

  if (!nextMove) {
    nextMove = 'right';
  }

  const data = {
    move: nextMove
  }

  lastTailPosition = ourTail;

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
