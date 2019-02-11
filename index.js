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
  const { height, width, food: allFood, snakes: enemySnakes } = board;
  const ourHead = ourSnake.body[0];

  const left = { x: ourHead.x - 1, y: ourHead.y, move: 'left' };
  const right = { x: ourHead.x + 1, y: ourHead.y, move: 'right' };
  const up = { x: ourHead.x, y: ourHead.y - 1, move: 'up' };
  const down = { x: ourHead.x, y: ourHead.y + 1, move: 'down' };
  const possibleDirections = [left, right, up, down];

  const atLeftBorder = ourHead.x === 0 ? 'left' : false;
  const atRightBorder = ourHead.x === width ? 'right' : false;
  const atTopBorder = ourHead.y === 0 ? 'up' : false;
  const atBottomBorder = ourHead.y === height ? 'down' : false;
  const borders = [atLeftBorder, atRightBorder, atTopBorder, atBottomBorder];

  const grid = [];
  let nextMove;

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

  function seekFood(foodPath) {
    possibleDirections.forEach((direction) => {
      if (foodPath[1].x === direction.x && foodPath[1].y === direction.y) {
        nextMove = direction.move;
        console.log('Following food.');
      } 
    });
  }

  function eat() {
    if (allFood.length) {
      let nearestFood = allFood[0];
      allFood.forEach((portion) => {
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
      console.log('No food.')
    }
  }

  function avoidBody() {
    possibleDirections.forEach((direction) => {
      ourSnake.body.forEach((segment) => {
        if (direction.x === segment.x && direction.y === segment.y) {
          const index = possibleDirections.indexOf(direction);
          possibleDirections.splice(index, 1);
        }
      });
    });
  }

  function avoidWalls() {
    possibleDirections.forEach((direction) => {
      // borders.forEach((border) => {
      //   if (direction.move === border) {
      //     const index = possibleDirections.indexOf(direction);
      //     console.log('Removing: ' + JSON.stringify(possibleDirections.splice(index, 1)));
      //   }
        if (direction.x < 0) {
          // remove left
          const index = possibleDirections.indexOf(left);
          possibleDirections.splice(index, 1);
        }

        if (direction.x > width) {
          // remove right
          const index = possibleDirections.indexOf(right);
          possibleDirections.splice(index, 1);
        }

        if (direction.y < 0) {
          // remove up
          const index = possibleDirections.indexOf(up);
          possibleDirections.splice(index, 1);
        }

        if (direction.y > height) {
          // remove down
          const index = possibleDirections.indexOf(down);
          possibleDirections.splice(index, 1);
        }
      // });
    });
  }

  avoidBody();
  avoidWalls();
  eat();

  console.log(grid)
  console.log(possibleDirections)

  if (!nextMove) {
    const random = Math.round(Math.random() * (possibleDirections.length - 1));
    console.log('Moving randomly.')
    nextMove = possibleDirections[random].move
  }

  console.log(nextMove)

  const data = {
    move: nextMove
  }

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
