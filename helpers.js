const PF = require("pathfinding");

function setWalkable(allSnakes, ourHead, grid) {
  try {
    allSnakes.forEach(snake => {
      snake.body.forEach(bodySegment => {
        grid.setWalkableAt(bodySegment.x, bodySegment.y, false);
        grid.setWeightAt(bodySegment.x + 1, bodySegment.y + 1, 2);
        grid.setWeightAt(bodySegment.x - 1, bodySegment.y - 1, 2);
      });
    });
    grid.setWalkableAt(ourHead.x, ourHead.y, true);

    let matrix = [];
    grid.nodes.forEach(row => {
      let rowa = [];
      row.forEach(array => {
        if (array.walkable) {
          rowa.push(0);
        } else {
          rowa.push(1);
        }
      });
      matrix.push(rowa);
    });
    console.log(matrix);
  } catch (error) {
    console.log(error);
  }
}

function checkForDanger(pathObject, targetFood, distance) {
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
  try {
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
  } catch (error) {
    console.log(error);
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
    const grid = new PF.Grid(pathObject.width, pathObject.height);
    setWalkable(pathObject.allSnakes, pathObject.ourHead, grid);
    const finder = new PF.AStarFinder();
    grid.setWalkableAt(pathObject.target.x, pathObject.target.y, true);

    // if (blocked && blocked.length) {
    //   blocked.forEach(space => {
    //     grid.setWalkableAt(space.x, space.y, false);
    //   });
    // }
    console.log(JSON.stringify(grid));
    console.log("target", pathObject.target);
    console.log("start", pathObject.start);

    const path = finder.findPath(
      pathObject.start.x,
      pathObject.start.y,
      pathObject.target.x,
      pathObject.target.y,
      grid
    );

    let move = false;
    console.log("PAAAAATH:", path);
    // if (path && path.length > 1 && !nextPath) {
    if (path && path.length) {
      pathObject.allDirections.forEach(direction => {
        if (path[1][0] === direction.x && path[1][1] === direction.y) {
          move = direction.move;
        }
      });
    }
    console.log("move", move);
    return move;
    //   }
    // } else if (path && path.length && nextPath) {
    //   move = true;
    // }
  } catch (error) {
    console.log("error", error);
  }
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

module.exports = {
  // avoidSnakeBody,
  // avoidObstacles,
  // avoidWalls,
  checkForDanger,
  // createGrid,
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
  // updateGrid,
  setWalkable
};
