const Pathfinder = require('pathfinding');

function avoidSnakeBody(allSnakes, possibleDirections) {
  allSnakes.forEach((snake) => {
    possibleDirections.forEach((direction) => {
      snake.body.forEach((segment) => {
        if (direction.x === segment.x && direction.y === segment.y) {
          removeDirection(possibleDirections, direction);
        }
      });
    });
  });
}

function avoidWalls(pathObject, possibleDirections) {
  possibleDirections.forEach((direction) => {
    if (direction.x < 0 || direction.x === pathObject.width || direction.y < 0 || direction.y === pathObject.height) {
      removeDirection(possibleDirections, direction);
      avoidWalls(pathObject, possibleDirections);
    }
  });
}

function createGrid(height, width, ourSnake, enemySnakes) {
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

function enemyArray(snakes, ourSnake) {
  const enemies = [];
  snakes.forEach((snake) => {
    if (snake.id !== ourSnake.id) {
      enemies.push(snake);
    }
  });

  return enemies;
}

function findEnemyTails(snakes) {
  const tails = [];
  snakes.forEach((snake) => {
    const snakeTails = {};
    snakeTails.x = snake.body[snake.body.length - 1].x;
    snakeTails.y = snake.body[snake.body.length - 1].y;
    tails.push(snakeTails);
  });

  return tails;
}

function findEnemyHeads(snakes) {
  const heads = [];
  snakes.forEach((snake) => {
    const snakeHead = {};
    snakeHead.x = snake.body[0].x;
    snakeHead.y = snake.body[0].y;
    heads.push(snakeHead);
  });

  return heads;
}

function findKillableSnakes(pathObject, shortSnakes) {
  let closestKillableSnake = false;
  
  if (shortSnakes.length) {
    let closestKillableDistance = 0;

    shortSnakes.forEach((shorty) => {
      const xDistance = pathObject.ourSnake.body[0].x - shorty.body[0].x;
      const yDistance = pathObject.ourSnake.body[0].y - shorty.body[0].y;

      if (xDistance + yDistance > closestKillableDistance) {
        closestKillableSnake = shorty;
      }
    });

    if (closestKillableSnake) {
      console.log(`The closest killable snake is ${closestKillableSnake.name}`)
    } else {
      console.log('All snakes are larger than me')
    }
  }

  return closestKillableSnake;
}

function findLowerHealthSnakes(ourSnake, snakes) {
  const lowHealthSnakes = [];
  snakes.forEach((snake) => {
    if (snake.health < ourSnake.health) {{
      lowHealthSnakes.push(snake);
    }}
  });

  return lowHealthSnakes;
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
    // console.log('No food to follow.')
    return false;
  }
}

function findShortSnakes(pathObject, snakes) {
  const shortSnakes = [];

  snakes.forEach((snake) => {
    if (pathObject.ourSnake.body.length > snake.body.length) {
      shortSnakes.push(snake);
    }
  });

  return shortSnakes;
}

function followPath(pathObject) {
  let grid = new Pathfinder.Grid(pathObject.grid);
  let finder = new Pathfinder.AStarFinder();
  grid.setWalkableAt(pathObject.start.x, pathObject.start.y, true);
  grid.setWalkableAt(pathObject.target.x, pathObject.target.y, true);
  const path = finder.findPath(pathObject.start.x, pathObject.start.y, pathObject.target.x, pathObject.target.y, grid);
  let move = false;

  if (path.length) {
    pathObject.possibleDirections.forEach((direction) => {
      if (path[1][0] === direction.x && path[1][1] === direction.y) {
        move = direction.move;
      }
    });
  }

  return move;
}

function randomMove(pathObject) {
  try {
    let moves = pathObject.possibleDirections;

    avoidSnakeBody(pathObject.allSnakes, moves);
    avoidWalls(pathObject, moves);
  
    if (moves.length) {
      const random = Math.round(Math.random() * (moves.length - 1));
      move = moves[random].move
    } else {
      // console.log('Dead end!')
    }
  
    return move;
  } catch(err) {
    console.log(err);
  }
}

function removeDirection(possibleDirections, direction) {
  const index = possibleDirections.indexOf(direction);
  if (index >= 0) {
    possibleDirections.splice(index, 1);
    // console.log(`...removing ${direction.move}`)
  }
}

function snakeArray(snakes) {
  const allSnakes = [];
  snakes.forEach((snake) => {
    allSnakes.push(snake);
  });

  return allSnakes;
};

function updateGrid(height, width, ourSnake, enemySnakes) {
  const enemyHeads = findEnemyHeads(enemySnakes);
  const enemyTails = findEnemyTails(enemySnakes);
  const headsAndTails = enemyHeads.concat(enemyTails);
  const gridRows = {};
  const grid = [];

  for (let i = 0; i < height; i++) {
    const arr = [];

    for (let j = 0; j < width; j++) {
      arr.push(0);
    }

    gridRows[i] = arr;
  }

  for (let i = 1; i < ourSnake.body.length - 1; i++) {
    gridRows[ourSnake.body[i].y][ourSnake.body[i].x] = 1
  }

  if (enemySnakes.length) {
    enemySnakes.forEach((snake) => {
      if (snake.id !== ourSnake.id) {
        for (let i = 1; i < snake.body.length - 1; i++) {
          gridRows[snake.body[i].y][snake.body[i].x] = 1;

          if (index === 0) {
            if (snake.body[i].y - 1 >= 0 && gridRows[snake.body[i].y - 1][snake.body[i].x] === 0) {
              gridRows[snake.body[i].y - 1][snake.body[i].x] = 1;
            }

            if (segment.y + 1 <= height - 1 && gridRows[segment.y + 1][segment.x] === 0) {
              gridRows[snake.body[i].y + 1][snake.body[i].x] = 1;
            }

            if (snake.body[i].x - 1 >= 0 && gridRows[snake.body[i].y][snake.body[i].x - 1] === 0) {
              gridRows[snake.body[i].y][snake.body[i].x - 1] = 1
            }

            if (snake.body[i].x + 1 <= width - 1 && gridRows[snake.body[i].y][snake.body[i].x + 1] === 0) {
              gridRows[snake.body[i].y][snake.body[i].x + 1] = 1;
            }
          }

          // Need to also check if the enemy's head is 1 step from food here
          if (index === snake.length - 1) {
            gridRows[snake.body[i].y][snake.body[i].x] = 0;
          }
        }
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
}