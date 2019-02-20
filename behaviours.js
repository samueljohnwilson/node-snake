const {
  avoidSnakeBody,
  avoidObstacles,
  avoidWalls,
  createGrid,
  enemyArray,
  findEnemyHeads,
  findEnemyTails,
  findKillableSnakes,
  findLowerHealthSnakes,
  findNearestFood,
  findShortSnakes,
  followPath,
  nextPathExists,
  randomMove,
  snakeArray,
  testPaths,
  updateGrid
} = require('./helpers.js');

function eat(pathObject, targetFood, distance = 1) {
  // console.log('eat')
  if (!targetFood) {
    return false;
  }

  let enemies = pathObject.enemySnakes;

  console.log(enemies)

  for (let i = 0; i < enemies.length; i++) {
    const enemyDistance = Math.abs(enemies[i].body[0].x - targetFood.x) + Math.abs(enemies[i].body[0].y - targetFood.y);
    const ourDistance = Math.abs(pathObject.ourSnake.body[0].x - targetFood.x) + Math.abs(pathObject.ourSnake.body[0].y - targetFood.y);
    if (enemies[i].body.length >= pathObject.ourSnake.body.length && enemyDistance === distance && ourDistance === distance) {
      return false;
    }
  }

  pathObject.target = targetFood;
  const direction = followPath(pathObject);

  const isNextPath = nextPathExists(pathObject);

  if (direction && isNextPath) {
    return direction.move;
  }

  return false;
}

function fillSpace(pathObject) {
  const head = pathObject.ourSnake.body[0];
  const grid = pathObject.grid;
  let shortest = pathObject.width;
  let coord;

  pathObject.possibleDirections.forEach((direction) => {
    if (direction.move === 'left') {
      let left = 0;
      for (let i = head.x; i > 0; i--) {
        if (grid[head.y][i] === 0) {
          left++;
        }

        if (grid[head.y][i] === 1) {
          break;
        }
      }

      if (left < shortest) {
        shortest = left;
        coord = { x: (head.x - left), y: head.y };
      }
    }

    if (direction.move === 'right') {
      let right = 0;
      for (let i = head.x; i < pathObject.width; i++) {
        if (grid[head.y][i] === 0) {
          right++;
        }

        if (grid[head.y][i] === 1) {
          break;
        }
      }

      if (right < shortest) {
        shortest = right;
        coord = { x: (head.x + right - 1), y: head.y };
      }
    }

    if (direction.move === 'up') {
      let up = 0;
      for (let i = head.y; i > 0; i--) {
        if (grid[i][head.x] === 0) {
          up++;
        }

        if (grid[i][head.x] === 1) {
          break;
        }
      }

      if (up < shortest) {
        shortest = up;
        coord = { x: head.x, y: (head.y - up)};
      }
    }

    if (direction.move === 'down') {
      let down = 0;
      for (let i = head.y; i < pathObject.height; i++) {
        if (grid[i][head.x] === 0) {
          down++;
        }

        if (grid[i][head.x] === 1) {
          break;
        }
      }

      if (down < shortest) {
        shortest = down;
        coord = { x: head.x, y: (head.y + down - 1)};
      }
    }
  });

  if (shortest < pathObject.width) {
    pathObject.target = coord;
    const pathArr = [];
    const direction = testPaths(pathObject, pathArr);
    return direction.move;
  }
}

function followOwnTail(pathObject, ourTail) {
  if (pathObject.ourSnake.body.length < 3) {
    return false;
  }

  pathObject.start = pathObject.ourSnake.body[0];
  pathObject.target = ourTail;

  const direction = followPath(pathObject);
  return direction.move;
}

function followEnemyTail(pathObject, enemies) {
  // console.log('followEnemyTail')
  const enemyTails = findEnemyTails(enemies);
  if (enemyTails.length) {
    for (let i = 0; i < enemyTails.length; i++) {
      pathObject.target = enemyTails[i];
      const direction = followPath(pathObject);
      if (direction) {
        return direction.move;
      }
    }
  }

  return false;
}

function kill(pathObject, ourLength, enemies) {
  // console.log('kill')
  const shortSnakes = findShortSnakes(pathObject, enemies);
  const closestKillableSnake = findKillableSnakes(pathObject, shortSnakes);

  if (closestKillableSnake) {
    const aggression = ourLength - closestKillableSnake.body.length;
    console.log(closestKillableSnake)

    if (Math.abs(closestKillableSnake.body[0].x) < aggression && Math.abs(closestKillableSnake.body[0].y) < aggression) {
      pathObject.target = closestKillableSnake.body[0];
      const direction = followPath(pathObject);
      return direction.move;
    }
  }

  return false;
}

module.exports = {
  eat,
  fillSpace,
  followEnemyTail,
  followOwnTail,
  kill
}