const {
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
  randomMove,
  snakeArray,
  testPaths,
  updateGrid
} = require('./helpers.js');

function eat(pathObject, targetFood, distance = 1) {
  try {
    // console.log('eat')
    pathObject.start = pathObject.ourHead;
    pathObject.target = targetFood;
    const foodIsDangerous = checkForDanger(pathObject, targetFood, distance);
  
    if (!targetFood || foodIsDangerous) {
      return false;
    }
  
    let direction = followPath(pathObject);
    let nextStep = false;
  
    if (direction && pathObject.ourLength > 2) {
      const path = pathObject.fullPath;
      const currentPath = [];
    
      for (let i = 0; i < path.length; i++) {
        currentPath.push({ x: path[i][0], y: path[i][1] });
      }
  
      pathObject.start = targetFood;
      for (let i = 0; i < pathObject.escapes.length; i++) {
        pathObject.target = pathObject.escapes[i];
        nextStep = followPath(pathObject, true, currentPath);
  
        if (nextStep !== false) {
          break;
        }
      }
    }
  
    if (direction && nextStep) {
      return direction.move;
    } else {
      return false;
    }
  } catch (e) {
    console.error(e);
  }
}

function fillSpace(pathObject) {
  // return 'right'
  const head = pathObject.ourSnake.body[0];
  const grid = pathObject.grid;
  let longest = 0;
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

      if (left > longest) {
        longest = left;
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

      if (right > longest) {
        longest = right;
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

      if (up > longest) {
        longest = up;
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

      if (down > longest) {
        longest = down;
        coord = { x: head.x, y: (head.y + down - 1)};
      }
    }
  });

  if (longest > 0) {
    pathObject.start = pathObject.ourSnake.body[0];
    pathObject.target = coord;

    const pathArr = [];
    const direction = testPaths(pathObject, pathArr);
    return direction.move;
  }
}

function floodFill(grid, current, queue, pathObject) {
  try {
    queue.push(current);
    grid[current.y][current.x] = 1;
  
      if (current.x - 1 >= 0 && grid[current.y][current.x - 1] === 0) {
        floodFill(grid, { x: current.x - 1, y: current.y }, queue, pathObject);
      }
  
      if (current.x + 1 < pathObject.width && grid[current.y][current.x + 1] === 0) {
        floodFill(grid, { x: current.x + 1, y: current.y }, queue, pathObject);
      }
  
      if (current.y - 1 >= 0 && grid[current.y - 1][current.x] === 0) {
        floodFill(grid, { x: current.x, y: current.y - 1 }, queue, pathObject);
      }
  
      if (current.y + 1 < pathObject.height && grid[current.y + 1][current.x] === 0) {
        floodFill(grid, { x: current.x, y: current.y + 1 }, queue, pathObject);
      }
  } catch(e) {
    console.error(e);
  }
}

function followOwnTail(pathObject, target) {
  console.log('followOwnTail')
  try {
    if (pathObject.turn < 3 || checkForDanger(pathObject, target)) {
      return false;
    }
  
    pathObject.start = pathObject.ourSnake.body[0];
    pathObject.target = target;
  
    const direction = followPath(pathObject);
  
    if (direction) {
      return direction.move;
    } else {
      return false;
    }
  } catch (e) {
    console.err(e)
  }
}


function followEnemyTail(pathObject, enemies) {
  const enemyTails = findEnemyTails(enemies);
  let move = false;

  if (enemyTails.length) {
    for (let i = 0; i < enemyTails.length; i++) {
      pathObject.target = enemyTails[i];
      const direction = followPath(pathObject);

      if (direction) {
        move = direction.move;
      }
    }
  }

  return move;
}

function kill(pathObject, ourLength, enemies) {
  const shortSnakes = findShortSnakes(pathObject, enemies);
  const closestKillableSnake = findKillableSnakes(pathObject, shortSnakes);

  if (closestKillableSnake) {
    const aggression = ourLength - closestKillableSnake.body.length;

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
  floodFill,
  followEnemyTail,
  followOwnTail,
  kill
}