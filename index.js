const bodyParser = require('body-parser')
const express = require('express')
const logger = require('morgan')
const app = express()
const {
  fallbackHandler,
  notFoundHandler,
  genericErrorHandler,
  poweredByHandler
} = require('./handlers.js');

const easystarjs = require('easystarjs');

// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env
app.set('port', (process.env.PORT || 9001))
app.enable('verbose errors')
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(poweredByHandler)

// Initializes a grid object for the easystar library
const gridRows = {};

// Handle POST request to '/start'
app.post('/start', (req, res) => {

  const { height, width, snakes: enemySnakes } = req.body.board;
  const ourSnake = req.body.you;
  const ourHead = ourSnake.body[0];
  const grid = [];

// Builds grid based on board size of format:
//  [
//    [0,0,0]
//    [0,0,0]
//    [0,0,0]
//  ]

  for (let i = 0; i < height; i++){
    const arr = [];

    for (let j = 0; j < width; j++) {
      arr.push(0);
    }
  
    gridRows[i] = arr;
  }

// Adds 1 to any point on the grid with a snake head:
//  [
//    [0,0,0]
//    [0,1,0]
//    [0,0,0]
//  ]

  gridRows[ourHead.y][ourHead.x] = 1

  if (enemySnakes) {
    enemySnakes.forEach((enemy) => {
      const enemyHead = enemy.body[0];
      gridRows[enemyHead.y][enemyHead.x];
    });
  };

  for (row in gridRows) {
    grid.push(gridRows[row]);
  }

  const data = {
    color: '#d3d3d3',
  }

  return res.json(data)
});

// Handle POST request to '/move'
app.post('/move', (req, res) => {
  const { board, you: ourSnake } = req.body
  const { height, width, food, snakes: enemySnakes } = board;
  const ourHead = ourSnake.body[0];
  const ourTail = ourSnake.body[ourSnake.body.length - 1];
  const ourLength = ourSnake.body.length;

  const left = { x: ourHead.x - 1, y: ourHead.y, move: 'left' };
  const right = { x: ourHead.x + 1, y: ourHead.y, move: 'right' };
  const up = { x: ourHead.x, y: ourHead.y - 1, move: 'up' };
  const down = { x: ourHead.x, y: ourHead.y + 1, move: 'down' };
  const possibleDirections = [left, right, up, down];

  const grid = [];
  let nextMove = false;

  const easystar = new easystarjs.js();
  updateGrid();
  easystar.setGrid(grid);
  easystar.setAcceptableTiles([0]);
  easystar.enableSync();

  function updateGrid() {
    for (let i = 0; i < height; i++){
      const arr = [];
  
      for (let j = 0; j < width; j++) {
        arr.push(0);
      }
    
      gridRows[i] = arr;
    }

    ourSnake.body.forEach((segment) => {
      gridRows[segment.y][segment.x] = 1
    });

    if (enemySnakes) {
      enemySnakes.forEach((enemy) => {
        enemy.body.forEach((segment) => {
          gridRows[segment.y][segment.x];
        });
      });
    };

    for (row in gridRows) {
      grid.push(gridRows[row]);
    }
  }

  function seekFood(path) {
    possibleDirections.forEach((direction) => {
      if (path[1].x === direction.x && path[1].y === direction.y) {
        nextMove = direction.move;
        console.log('Following food.');
      } 
    });
  }

  function eat(easystar, ourHead, food) {
    if (food.length) {
      let nearestFood = food[0];
      food.forEach((portion) => {
        const xDistance = Math.abs(portion.x - ourHead.x);
        const yDistance = Math.abs(portion.y - ourHead.y);
        const totalDistance = xDistance + yDistance;
        const currentNearest = Math.abs(nearestFood.x - ourHead.x) + Math.abs(nearestFood.y - ourHead.y);
  
        if (totalDistance < currentNearest) {
          nearestFood = portion;
        }
      });
      
      easystar.findPath(ourHead.x, ourHead.y, nearestFood.x, nearestFood.y, function(path) {
        seekFood(path);
      });
      easystar.calculate();
    } else {
      console.log('No food to follow.')
      return false;
    }
  }

  function removeDirection(direction) {
    const index = possibleDirections.indexOf(direction);
    possibleDirections.splice(index, 1);
  }

  function avoidBody() {
    possibleDirections.forEach((direction) => {
      ourSnake.body.forEach((segment) => {
        if (direction.x === segment.x && direction.y === segment.y) {
          removeDirection(direction);
          avoidBody();
        }
      });
    });
  }

  function avoidWalls() {
    possibleDirections.forEach((direction) => {
      if (direction.x < 0) {
        removeDirection(left);
        avoidWalls();
      }

      if (direction.x >= width) {
        removeDirection(right);
        avoidWalls();
      }

      if (direction.y < 0) {
        removeDirection(up);
        avoidWalls();
      }

      if (direction.y >= height) {
        removeDirection(down);
        avoidWalls();
      }
    });
  }

  function followTail(possibleDirections, ourHead, ourTail) {
    const xMove = ourHead.x - ourTail.x > 0 ? 'left' : 'right';
    const yMove = ourHead.y - ourTail.y > 0 ? 'up' : 'down';
    const moves = [];
    
    possibleDirections.forEach((direction) => {
      if (direction.move === xMove) {
        moves.push(xMove);
      }

      if (direction.move === yMove) {
        moves.push(yMove);
      }
    });

    if (moves.length === 1) {
      return moves[0];
    }

    if (moves.length > 1){
      const random = Math.round(Math.random() * (moves.length - 1));
      return moves[random];
    }

    if (!moves) {
      return false;
    }
  }

  function mode(array) {
    const modeMap = {};
    let maxEl = array[0];
    let maxCount = 0;

    array.forEach((el) => {
      if (!modeMap[el]) {
        modeMap[el] = 1;
      } else {
        modeMap[el]++;  
      }
          
      if (modeMap[el] > maxCount) {
        maxEl = el;
        maxCount = modeMap[el];
      }
      
    });

    return maxEl;
  }

// function avoidTurnTowardMass(snake) {
//   const xArr = [];
//   const yArr = [];
//   let coords = {};

//   snake.body.forEach((segment) => {
//     xArr.push(segment.x);
//     yArr.push(segment.y);
//   });

//   let x = 0;
//   let y = 0;
//   for (let i = 0; i < xArr.length; i++ ) {
//     x += xArr[i];
//     y += yArr[i];
//   }

//   coords.x = x / xArr.length;
//   coords.y = y / yArr.length;

//   possibleDirections.forEach((direction) => {
//     if (coords.x > direction.x && possibleDirections.length > 1) {
//       removeDirection(right);
//       avoidTurnTowardMass(snake);
//       console.log('Do not move right');
//     }

//     if (coords.x < direction.x && possibleDirections.length > 1) {
//       removeDirection(left);
//       avoidTurnTowardMass(snake);
//       console.log('Do not move left');
//     }

//     if (coords.y > direction.y && possibleDirections.length > 1) {
//       removeDirection(down);
//       avoidTurnTowardMass(snake);
//       console.log('Do not move down');
//     }

//     if (coords.y < direction.y && possibleDirections.length > 1) {
//       removeDirection(up);
//       avoidTurnTowardMass(snake);
//       console.log('Do not move up');
//     }
//   });
// }

  function randomMove() {
    const random = Math.round(Math.random() * (possibleDirections.length - 1));
    console.log('Moving randomly.')
    nextMove = possibleDirections[random].move
  }

  function kill(ourLength, ourHead, enemySnakes) {
    const shortSnakes = [];

    enemySnakes.forEach((snake) => {
      if (ourLength > snake.body.length) {
        shortSnakes.push(snake.id);
      }
    });

    if (shortSnakes) {
      let closestKillableDistance = 0;
      let closestKillableSnake;

      shortSnakes.forEach((shorty) => {
        const xDistance = ourHead.x - shortSnakes.x;
        const yDistance = ourHead.y - shortSnakes.y;


        if (xDistance + yDistance > closestKillableDistance) {
          closestKillableSnake = shorty.id;
        }
      });

      const aggression = ourLength - closestKillableSnake.body.length;

      if (Math.abs(xDistance) < aggression && Math.abs(yDistance) < aggression) {
        // Move toward killable snake
      }
    }
  }
 
  avoidBody();
  avoidWalls();

  if (ourSnake.health < 30 || ourLength < 7) {
    eat(easystar, ourHead, food);
  } else {
    nextMove = followTail(possibleDirections, ourHead, ourTail);
  }

  if (!nextMove) {
    randomMove();
  }

  console.log(grid);
  // console.log('Possible moves:')
  // console.log(possibleDirections)
  // console.log('Move chosen:')
  // console.log(nextMove)

  const data = {
    move: nextMove
  }

  console.log(data);

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
