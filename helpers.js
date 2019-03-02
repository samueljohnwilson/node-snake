const Pathfinder = require("pathfinding");

function avoidSnakeBody(allSnakes, possibleDirections) {
  // console.log('avoidSnakeBody')
  allSnakes.forEach(snake => {
    possibleDirections.forEach(direction => {
      for (let i = 0; i < snake.body.length - 1; i++) {
        if (
          direction.x === snake.body[i].x &&
          direction.y === snake.body[i].y
        ) {
          removeDirection(possibleDirections, direction);
          avoidSnakeBody(allSnakes, possibleDirections);
        }
      }
    });
  });
}

function avoidWalls(height, width, possibleDirections) {
  // console.log('avoidWalls')
  possibleDirections.forEach(direction => {
    if (
      direction.x < 0 ||
      direction.x === width ||
      direction.y < 0 ||
      direction.y === height
    ) {
      removeDirection(possibleDirections, direction);
      avoidWalls(height, width, possibleDirections);
    }
  });
}

function avoidObstacles(height, width, allSnakes, possibleDirections) {
  avoidSnakeBody(allSnakes, possibleDirections);
  avoidWalls(height, width, possibleDirections);
}

function checkForDanger(pathObject, targetFood, distance = 1) {
  let enemies = pathObject.enemySnakes;
  let danger = false;

  for (let i = 0; i < enemies.length; i++) {
    const enemyDistance =
      Math.abs(enemies[i].body[0].x - targetFood.x) +
      Math.abs(enemies[i].body[0].y - targetFood.y);
    const ourDistance =
      Math.abs(pathObject.ourSnake.body[0].x - targetFood.x) +
      Math.abs(pathObject.ourSnake.body[0].y - targetFood.y);
    if (
      enemies[i].body.length >= pathObject.ourSnake.body.length &&
      enemyDistance <= ourDistance &&
      enemyDistance <= distance
    ) {
      danger = true;
    }
  }

  return danger;
}

function createGrid(height, width, ourSnake, enemySnakes) {
  // console.log('createGrid')
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
    gridRows[ourSnake.body[i].y][ourSnake.body[i].x] = 1;
  }

  if (enemySnakes.length) {
    enemySnakes.forEach(snake => {
      if (snake.id !== ourSnake.id) {
        snake.body.forEach((segment, index) => {
          gridRows[segment.y][segment.x] = 1;

          if (index === 0 && snake.body.length >= ourSnake.body.length) {
            if (
              segment.y - 1 >= 0 &&
              gridRows[segment.y - 1][segment.x] === 0
            ) {
              gridRows[segment.y - 1][segment.x] = 2;
            }

            if (
              segment.y + 1 <= height - 1 &&
              gridRows[segment.y + 1][segment.x] === 0
            ) {
              gridRows[segment.y + 1][segment.x] = 2;
            }

            if (
              segment.x - 1 >= 0 &&
              gridRows[segment.y][segment.x - 1] === 0
            ) {
              gridRows[segment.y][segment.x - 1] = 2;
            }

            if (
              segment.x + 1 <= width - 1 &&
              gridRows[segment.y][segment.x + 1] === 0
            ) {
              gridRows[segment.y][segment.x + 1] = 2;
            }
          }
        });
      }
    });
  }

  gridRows[ourSnake.body[0].y][ourSnake.body[0].x] = 0;

  for (row in gridRows) {
    grid.push(gridRows[row]);
  }

  return grid;
}

function enemyArray(snakes, ourSnake) {
  // console.log('enemyArray')
  const enemies = [];
  snakes.forEach(snake => {
    if (snake.id !== ourSnake.id) {
      enemies.push(snake);
    }
  });

  return enemies;
}

function findEnemyTails(snakes) {
  // console.log('findEnemyTails')
  const tails = [];
  snakes.forEach(snake => {
    const snakeTails = {};
    snakeTails.x = snake.body[snake.body.length - 1].x;
    snakeTails.y = snake.body[snake.body.length - 1].y;
    tails.push(snakeTails);
  });

  return tails;
}

function findKillableSnakes(pathObject, shortSnakes) {
  // console.log('findKillableSnakes')
  if (shortSnakes.length) {
    let closestKillableDistance = 0;

    shortSnakes.forEach(shorty => {
      const xDistance = pathObject.ourSnake.body[0].x - shorty.body[0].x;
      const yDistance = pathObject.ourSnake.body[0].y - shorty.body[0].y;

      if (xDistance + yDistance > closestKillableDistance) {
        closestKillableSnake = shorty;
      }
    });

    if (closestKillableSnake) {
      // console.log(`The closest killable snake is ${closestKillableSnake.name}`)
      return closestKillableSnake;
    }
  }

  return false;
}

function findLowerHealthSnakes(ourSnake, snakes) {
  // console.log('findLowerHealthSnakes')
  const lowHealthSnakes = [];
  snakes.forEach(snake => {
    if (snake.health < ourSnake.health) {
      {
        lowHealthSnakes.push(snake);
      }
    }
  });

  return lowHealthSnakes;
}

function findNearestFood(ourHead, food) {
  // console.log('findNearestFood')
  if (food.length) {
    let nearestFood = food[0];

    food.forEach(portion => {
      const xDistance = Math.abs(portion.x - ourHead.x);
      const yDistance = Math.abs(portion.y - ourHead.y);
      const totalDistance = xDistance + yDistance;
      const currentNearest =
        Math.abs(nearestFood.x - ourHead.x) +
        Math.abs(nearestFood.y - ourHead.y);

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
  // console.log('findShortestSnake');
  const shortSnakes = [];

  snakes.forEach(snake => {
    if (pathObject.ourSnake.body.length > snake.body.length) {
      shortSnakes.push(snake);
    }
  });

  return shortSnakes;
}

function followPath(pathObject, nextPath = false, blocked = []) {
  try {
    let grid = new Pathfinder.Grid(pathObject.grid);
    let finder = new Pathfinder.AStarFinder();

    pathObject.grid.forEach((row, y) => {
      row.forEach((node, x) => {
        if (node === 2) {
          grid.setWeightAt(x, y, 16);
          console.log(grid.nodes[y][x]);
        }
      });
    });

    for (let i = 0; i < pathObject.height; i++) {
      grid.setWeightAt(0, i, 8);
      grid.setWeightAt(i, 0, 8);
      grid.setWeightAt(pathObject.height - 1, 0, 8);
      grid.setWeightAt(0, pathObject.height - 1, 8);
    }

    console.log(JSON.stringify(grid));

    if (blocked && blocked.length) {
      blocked.forEach(space => {
        grid.setWalkableAt(space.x, space.y, false);
      });
    }

    grid.setWalkableAt(pathObject.start.x, pathObject.start.y, true);
    grid.setWalkableAt(pathObject.target.x, pathObject.target.y, true);

    const path = finder.findPath(
      pathObject.start.x,
      pathObject.start.y,
      pathObject.target.x,
      pathObject.target.y,
      grid
    );
    let move = false;

    if (path && path.length > 1 && !nextPath) {
      for (let i = 0; i < pathObject.allDirections.length; i++) {
        if (
          path[1][0] === pathObject.allDirections[i].x &&
          path[1][1] === pathObject.allDirections[i].y
        ) {
          pathObject.fullPath = path;
          move = pathObject.allDirections[i];
        }
      }
    } else if (path && path.length && nextPath) {
      move = true;
    }

    return move;
  } catch (e) {
    console.log(e);
  }
}

function getDistance(point1, point2) {
  return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
}

function randomMove(pathObject) {
  // console.log('randomMove');
  let moves = pathObject.possibleDirections;

  if (moves.length) {
    const random = Math.round(Math.random() * (moves.length - 1));
    return moves[random].move;
  } else {
    // console.log('Dead end!')
  }
}

function removeDirection(possibleDirections, direction) {
  // console.log('removeDirection')
  const index = possibleDirections.indexOf(direction);
  if (index >= 0) {
    possibleDirections.splice(index, 1);
    // console.log(`...removing ${direction.move}`)
  }
}

function snakeArray(snakes) {
  // console.log('snakeArray');
  const allSnakes = [];
  snakes.forEach(snake => {
    allSnakes.push(snake);
  });

  return allSnakes;
}

function testPaths(pathObject, pathArr) {
  const path = followPath(pathObject, false, pathArr);

  // if (path) {
  //   pathArr.push(path);
  //   pathObject.target = { x: path.x, y: path.y };
  //   testPaths(pathObject, pathArr);
  // }

  return path;
}

function updateGrid(height, width, ourSnake, enemySnakes) {
  // console.log('updateGrid');
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
    gridRows[ourSnake.body[i].y][ourSnake.body[i].x] = 1;
  }

  enemySnakes.forEach(snake => {
    if (snake.id !== ourSnake.id) {
      for (let i = 1; i < snake.body.length - 1; i++) {
        gridRows[snake.body[i].y][snake.body[i].x] = 1;
      }
    }
  });

  gridRows[ourSnake.body[0].y][ourSnake.body[0].x] = 0;

  for (row in gridRows) {
    grid.push(gridRows[row]);
  }

  return grid;
}

module.exports = {
  avoidSnakeBody,
  avoidObstacles,
  avoidWalls,
  checkForDanger,
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
};
