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
  getDistance,
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
  floodFill,
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
let eatenFood;

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001));
app.enable('verbose errors');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(poweredByHandler);

// Handle POST request to '/start'
app.post('/start', (req, res) => {

  // console.log('Yaaaasssssssss');

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
    allDirections: [left, right, up, down],
    allSnakes: allSnakes,
    enemySnakes: enemies,
    escapes: [],
    fullPath: [],
    grid: grid,
    height: height,
    ourHead: ourHead,
    ourLength: ourLength,
    ourSnake: ourSnake,
    ourTail: ourTail,
    possibleDirections: possibleDirections,
    start: ourHead,
    turn: req.body.turn,
    width: width
  }

  const ourDistanceFromHeadToTail = getDistance(ourHead, ourTail)
  const justAte = ourSnake.body[ourSnake.body.length - 2] === ourTail && ourDistanceFromHeadToTail <= 1;
  let pathToOwnTail = false;
  let dangerousPathToOwnTail = false;
  let weAreLongest = true;

  enemies.forEach((snake) => {
    const enemyLength = snake.body.length;
    if (ourLength <= enemyLength) {
      weAreLongest = false;
    }
  });

  if (req.body.turn < 3 || !lastTailPosition || justAte) {
    pathToOwnTail = false;
  } else {
    pathToOwnTail = followOwnTail(pathObject, lastTailPosition);
  }

  const enemyTails = findEnemyTails(enemies);
  const pathToEnemyTail = followEnemyTail(pathObject, enemies);

  pathObject.escapes = [ourTail];
  enemyTails.forEach((enemyTail) => {
    pathObject.escapes.push(enemyTail);
  });

  const pathToFood = eat(pathObject, nearestFood);

  if (req.body.turn > 3 && !justAte) {
    pathObject.target = ourTail;
    dangerousPathToOwnTail = followOwnTail(pathObject, ourTail);
  }

  lastTailPosition = ourTail;
  eatenFood = nearestFood;

  let floodPath = false;
  const queue = [];
  floodFill(grid, ourHead, queue, pathObject);

  possibleDirections.forEach((direction) => {
    if (queue.length > 1 && queue[1].x === direction.x && queue[1].y === direction.y) {
      floodPath = direction.move;
    }
  });

  // console.log(queue);

  let nextMove = false;

  // Behaviour tree goes below here

  console.log(`pathToOwnFood: ${pathToFood}`)
  console.log(`pathToOwnTail: ${pathToOwnTail}`)
  console.log(`pathToEnemyTail: ${pathToEnemyTail}`)
  console.log(`dangerousPathToTail: ${dangerousPathToOwnTail}`)
  console.log(`floodPath: ${floodPath}`)

  try {
    if (nearestFood && pathToFood && ourSnake.health < 90 || nearestFood && pathToFood && !weAreLongest) {
    console.log('pathToFood');
    
    nextMove = pathToFood;
  } else if (pathToOwnTail) {
    console.log('pathToOwnTail');
    
    nextMove = pathToOwnTail;
  } else if (pathToEnemyTail) {
    console.log('pathToEnemyTail');
    
    nextMove = pathToEnemyTail;
  } else if (dangerousPathToOwnTail) {
    console.log('dangerTail');
    
    nextMove = dangerousPathToOwnTail;
  } else if (floodPath) {
    console.log('floodPath');
    
    nextMove = floodPath;
  } else {
    console.log('randomMove')
    console.log(floodPath)
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

  // console.log('Sending to server: ' + JSON.stringify(data));

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
  // // console.log('Server listening on port %s', app.get('port'))
})
