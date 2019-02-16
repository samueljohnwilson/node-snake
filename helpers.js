const Pathfinder = require('pathfinding');

function avoidSnakeBody(allSnakes, possibleDirections) {
  console.log('avoidSnakeBody()');
  allSnakes.forEach((snake) => {
    possibleDirections.forEach((direction) => {
      snake.body.forEach((segment) => {
        if (direction.x === segment.x && direction.y === segment.y) {
          removeDirection(direction);
        }
      });
    });
  });
}

function avoidWalls(possibleDirections) {
  console.log('avoidWalls()');
  possibleDirections.forEach((direction) => {
    if (direction.x < 0) {
      removeDirection(left);
    }

    if (direction.x >= width) {
      removeDirection(right);
    }

    if (direction.y < 0) {
      removeDirection(up);
    }

    if (direction.y >= height) {
      removeDirection(down);
    }
  });
}

function findEnemyTails(snakes) {
  const tails = [];
  snakes.forEach((snake) => {
    const snakeHead = {};
    snakeHead.x = snake.body[0].x;
    snakeHead.y = snake.body[0].y;
    tails.push(snakeHead);
  });
}

function findEnemyHeads(snakes) {
  const heads = [];
  snakes.forEach((snake) => {
    const snakeHead = {};
    snakeHead.x = snake.body[snake.length - 1].x;
    snakeHead.y = snake.body[snake.length - 1].y;
    heads.push(snakeHead);
  });
}

function findNearestFood(ourHead, food) {
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

    return nearestFood;
  } else {
    console.log('No food to follow.')
    return false;
  }
}

function followPath(gridArray, start, target, possibleDirections, ourSnake, enemySnakes) {
  let grid = new Pathfinder.Grid(gridArray);
  let finder = new Pathfinder.AStarFinder();
  grid.setWalkableAt(start.x, start.y, true);
  grid.setWalkableAt(target.x, target.y, true);
  const path = finder.findPath(start.x, start.y, target.x, target.y, grid);
  let move;

  if (path.length) {
    possibleDirections.forEach((direction) => {
      if (path[1][0] === direction.x && path[1][1] === direction.y) {
        console.log('Next move is x: ' + direction.move);
        move = direction.move;
      }
    });
    return move;
  } else {
    console.log('No paths!')
    return randomMove(possibleDirections, ourSnake, enemySnakes);
  }
}

function randomMove(possibleDirections, ourSnake, enemySnakes) {
  console.log('randomMove()');
  const allSnakes = snakeArray(ourSnake, enemySnakes)
  let moves = possibleDirections;

  avoidSnakeBody(moves, allSnakes);
  avoidWalls(moves);

  const random = Math.round(Math.random() * (moves.length - 1));
  let move;

  if (moves[random]) {
    move = moves[random].move
  }

  return move;
}

function removeDirection(possibleDirections) {
  const index = possibleDirections.indexOf(direction);
  possibleDirections.splice(index, 1);
  console.log(`...removing ${direction.move}`)
}

function snakeArray(us, enemies) {
  const allSnakes = [];
  allSnakes.push(us);
  enemies.forEach((snake) => {
    allSnakes.push(snake);
  });

  return allSnakes;
};

function updateGrid(height, width, ourSnake, enemySnakes) {
  const gridRows = {};
  const grid = [];

  for (let i = 0; i < height; i++) {
    const arr = [];

    for (let j = 0; j < width; j++) {
      arr.push(0);
    }

    gridRows[i] = arr;
  }

  for (let i = 1; i < ourSnake.body.length; i++) {
    gridRows[ourSnake.body[i].y][ourSnake.body[i].x] = 1
  }

  if (enemySnakes.length) {
    enemySnakes.forEach((snake) => {
      if (snake.id !== ourSnake.id) {
        snake.body.forEach((segment, index) => {
          gridRows[segment.y][segment.x] = 1;

          if (index === 0) {
            if (segment.y - 1 >= 0 && gridRows[segment.y - 1][segment.x] === 0) {
              gridRows[segment.y - 1][segment.x] = 1;
            }

            if (segment.y + 1 <= height - 1 && gridRows[segment.y + 1][segment.x] === 0) {
              gridRows[segment.y + 1][segment.x] = 1;
            }

            if (segment.x - 1 >= 0 && gridRows[segment.y][segment.x - 1] === 0) {
              gridRows[segment.y][segment.x - 1] = 1
            }

            if (segment.x + 1 <= width - 1 && gridRows[segment.y][segment.x + 1] === 0) {
              gridRows[segment.y][segment.x + 1] = 1;
            }
          }

          // Need to also check if the enemy's head is 1 step from food here
          if (index === snake.length - 1) {
            gridRows[segment.y][segment.x] = 0;
          }
        });
      }
    });
  };

  gridRows[ourSnake.body[0].y][ourSnake.body[0].x] = 0;

  for (row in gridRows) {
    grid.push(gridRows[row]);
  }

  return grid;
}

module.exports = {
  avoidSnakeBody,
  avoidWalls,
  findEnemyHeads,
  findEnemyTails,
  findNearestFood,
  followPath,
  snakeArray,
  updateGrid
}