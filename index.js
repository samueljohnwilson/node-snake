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

const Pathfinder = require('pathfinding');

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

  console.log('Yaaaasssssssss');

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

  updateGrid();
  let pathfinderGrid = new Pathfinder.Grid(grid);

  function updateGrid() {
    for (let i = 0; i < height; i++) {
      const arr = [];
  
      for (let j = 0; j < width; j++) {
        arr.push(0);
      }
    
      gridRows[i] = arr;
    }

    gridRows[ourHead.y][ourHead.x] = 2;

    for (let i = 1; i < ourLength; i++) {
      gridRows[ourSnake.body[i].y][ourSnake.body[i].x] = 1
    }

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

  function seek(path, backupGrid) {
    console.log('seek()');
    console.log(possibleDirections);
    console.log(path);

    if (path.length) {
      possibleDirections.forEach((direction) => {
        if (path[1][0] === direction.x && path[1][1] === direction.y) {
          nextMove = direction.move;
          match = true;
        }
      });
    } else {
      console.log('backup')
      // let anotherGrid = backupGrid.clone();
      // backupGrid.setWalkableAt((width - ourHead.x), (height - ourHead.y), true);
      // const newFinder = new Pathfinder.AStarFinder();
      // const backupPath = newFinder.findPath(ourHead.x, ourHead.y, (width - ourHead.x), (height - ourHead.x.y), backupGrid);
    
      // seek(backupPath, anotherGrid);
      randomMove();
    }
  }

  function eat(pathfinderGrid, ourHead, food) {
    console.log('eat()');

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
      
      let finder = new Pathfinder.AStarFinder();
      const path = finder.findPath(ourHead.x, ourHead.y, nearestFood.x, nearestFood.y, pathfinderGrid);
      const backupGrid = pathfinderGrid.clone();

      seek(path, backupGrid);
    } else {
      console.log('No food to follow.')
    }
  }

  function removeDirection(direction) {
    const index = possibleDirections.indexOf(direction);
    possibleDirections.splice(index, 1);
    console.log(`...remove ${direction.move}`)
  }

  function avoidSnakeBody(allSnakes) {
    console.log('avoidSnakeBody()');
    allSnakes.forEach((snake) => {
      avoid(snake);
    });
  }

  function avoid(snake) {
    console.log('avoid()');
    possibleDirections.forEach((direction) => {
      snake.body.forEach((segment) => {
        if (direction.x === segment.x && direction.y === segment.y) {
          removeDirection(direction);
          avoid(snake);
        }
      });
    });
  }

  function avoidWalls() {
    console.log('avoidWalls()');
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

  function followTail(pathfinderGrid, ourHead, ourTail) {
    console.log('followTail()');
    pathfinderGrid.setWalkableAt(ourTail.x, ourTail.y, true);
    let finder = new Pathfinder.AStarFinder();
    const path = finder.findPath(ourHead.x, ourHead.y, ourTail.x, ourTail.y, pathfinderGrid);
    const backupGrid = pathfinderGrid.clone();

    seek(path, backupGrid);
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

  function randomMove() {
    console.log('randomMove()');
    const allSnakes = snakeArray(ourSnake, enemySnakes)
    avoidSnakeBody(allSnakes);
    avoidWalls();

    const random = Math.round(Math.random() * (possibleDirections.length - 1));
    if (possibleDirections[random]) {
      nextMove = possibleDirections[random].move
    } else {
      console.log('Something broke.')
    }
  }

  function kill(ourLength, ourHead, enemySnakes) {
    const shortSnakes = [];

    enemySnakes.forEach((snake) => {
      if (ourLength > snake.body.length) {
        shortSnakes.push(snake);
      }
    });

    if (shortSnakes) {
      let closestKillableDistance = 0;
      let closestKillableSnake;

      shortSnakes.forEach((shorty) => {
        const xDistance = ourHead.x - shorty.x;
        const yDistance = ourHead.y - shorty.y;


        if (xDistance + yDistance > closestKillableDistance) {
          closestKillableSnake = shorty;
        }
      });

      const aggression = ourLength - closestKillableSnake.body.length;

      if (Math.abs(xDistance) < aggression && Math.abs(yDistance) < aggression) {
        let finder = new Pathfinder.AStarFinder();
        pathfinderGrid.setWalkableAt(ourTail.x, ourTail.y, true);
        const path = finder.findPath(ourHead.x, ourHead.y, closestKillableSnake.body.x, closestKillableSnake.body.y, pathfinderGrid);
        const backupGrid = pathfinderGrid.clone();
    
        seek(path, backupGrid);
      }
    }
  }

  
  function snakeArray(ourSnake, enemySnakes) {
    const allSnakes = [];
    
    allSnakes.push(ourSnake);
    enemySnakes.forEach((snake) => {
      allSnakes.push(snake);
    });

    return allSnakes;
  }

 

  
  if (ourSnake.health < 95 || ourLength < 20 || food.length === 0) {
    eat(pathfinderGrid, ourHead, food);
  } else {
    followTail(pathfinderGrid, ourHead, ourTail);
  }
  
  if (!nextMove) {
    followTail(pathfinderGrid, ourHead, ourTail);
  }
  
  // if (!nextMove) {
  //   randomMove();
  // }

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
