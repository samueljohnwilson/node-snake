const bodyParser = require('body-parser');
const express = require('express');
const logger = require('morgan');
const {
  findEnemyHeads,
  findEnemyTails,
  findNearestFood,
  followPath,
  snakeArray,
  updateGrid
} = require('./helpers.js');

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
    color: '#d3d3d3',
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
    snakes: enemySnakes,
  } = board;
  const ourHead = ourSnake.body[0];
  const ourTail = ourSnake.body[ourSnake.body.length - 1];
  const ourLength = ourSnake.body.length;

  const left = { x: ourHead.x - 1, y: ourHead.y, move: 'left' };
  const right = { x: ourHead.x + 1, y: ourHead.y, move: 'right' };
  const up = { x: ourHead.x, y: ourHead.y - 1, move: 'up' };
  const down = { x: ourHead.x, y: ourHead.y + 1, move: 'down' };
  const possibleDirections = [left, right, up, down];

  let grid = updateGrid(height, width, ourSnake, enemySnakes);

  function eat(grid, ourHead, targetFood, possibleDirections, ourSnake, enemySnakes) {
    return followPath(grid, ourHead, targetFood, possibleDirections, ourSnake, enemySnakes);
  }

  // Need to convert this so that we follow other snake tails too
  function followTail(grid, ourHead, ourTail, possibleDirections, ourSnake, enemySnakes) {
    console.log('followTail()');
    return followPath(grid, ourHead, ourTail, possibleDirections, ourSnake, enemySnakes)
  }

  function kill(grid, ourLength, ourHead, enemies) {
    console.log('kill()');

    if (enemies.length) {
      const shortSnakes = [];

      enemies.forEach((snake) => {
        if (ourLength > snake.body.length) {
          shortSnakes.push(snake);
        }
      });
  
      if (shortSnakes.length) {
        let closestKillableDistance = 0;
        let closestKillableSnake;
  
        shortSnakes.forEach((shorty) => {
          const xDistance = ourHead.x - shorty.body[0].x;
          const yDistance = ourHead.y - shorty.body[0].y;
  
  
          if (xDistance + yDistance > closestKillableDistance) {
            closestKillableSnake = shorty;
          }
        });
  
        const aggression = ourLength - closestKillableSnake.body.length;
  
        if (Math.abs(xDistance) < aggression && Math.abs(yDistance) < aggression) {
          followPath(grid, finder, ourHead, closestKillableSnake.body[0], possibleDirections, ourSnake, enemySnakes);
        }
      }
    }
  }

  // const victims = snakeArray(ourSnake, enemySnakes);
  const nearbyFood = findNearestFood(ourHead, food);
  // const enemyTails = findEnemyTails(victims);
  // const enemyHeads = findEnemyHeads(victims);
  // kill(ourLength, ourHead, victims);

  let nextMove = false;

  if ((ourSnake.health < 95 || ourLength < 20) && nearbyFood) {
    nextMove = eat(grid, ourHead, nearbyFood, possibleDirections, ourSnake, enemySnakes);
    console.log(nextMove)
  } else {
    nextMove = followTail(grid, ourHead, ourTail, possibleDirections, ourSnake, enemySnakes);
  }
  
  if (!nextMove) {
    nextMove = followTail(grid, ourHead, ourTail, possibleDirections, ourSnake, enemySnakes);
  }
  
  if (!nextMove) {
    nextMove = 'left';
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
