const {
  avoidSnakeBody,
  avoidObstacles,
  avoidWalls,
  checkForDanger,
  createGrid,
  enemyArray,
  findEnemyTails,
  findKillableSnake,
  findLowerHealthSnakes,
  findNearestFood,
  findShortSnakes,
  followPath,
  getDistance,
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



function floodFill(grid, current, queue, pathObject) {
  try {
    queue.push(current);
    grid[current.y][current.x] = 1;
  
      if (current.x - 1 >= 0 && grid[current.y][current.x - 1] !== 1) {
        floodFill(grid, { x: current.x - 1, y: current.y }, queue, pathObject);
        return;
      }
  
      if (current.x + 1 < pathObject.width && grid[current.y][current.x + 1] !== 1) {
        floodFill(grid, { x: current.x + 1, y: current.y }, queue, pathObject);
        return;
      }
  
      if (current.y - 1 >= 0 && grid[current.y - 1][current.x] !== 1) {
        floodFill(grid, { x: current.x, y: current.y - 1 }, queue, pathObject);
        return;
      }
  
      if (current.y + 1 < pathObject.height && grid[current.y + 1][current.x] !== 1) {
        floodFill(grid, { x: current.x, y: current.y + 1 }, queue, pathObject);
        return;
      }

      return;
  } catch(e) {
    console.error(e);
  }

}

function followOwnTail(pathObject, target) {
  // console.log('followOwnTail')
  try {
    if (pathObject.turn < 3) {
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

  // console.log(enemyTails)

  if (enemyTails.length) {
    for (let i = 0; i < enemyTails.length; i++) {
      pathObject.target = { x: enemyTails[i].x, y: enemyTails[i].y };
      pathObject.start = pathObject.ourHead;
      const distanceFromHeadToTail = getDistance(pathObject.ourHead, enemyTails[i].snake.body[enemyTails[i].snake.body.length - 1]);
      const justAte = enemyTails[i].snake.body[enemyTails[i].snake.body.length - 1] === enemyTails[i].snake.body[enemyTails[i].snake.body.length - 2] && distanceFromHeadToTail <= 1;
      const direction = followPath(pathObject);

      if (direction && !justAte) {
        move = direction.move;
      }
    }
  }

  return move;
}

function kill(pathObject, ourLength, enemies) {
  let closestKillableSnake = false;
  let direction = false;
  const shortSnakes = findShortSnakes(pathObject, enemies);
  closestKillableSnake = findKillableSnake(pathObject, shortSnakes);

  if (closestKillableSnake && !(pathObject.ourHead.x === 0 || pathObject.ourHead.x === pathObject.width - 1 || pathObject.ourHead.y === 0 || pathObject.ourHead.y === pathObject.height - 1)) {
    for (let i = 0; i < enemies.length; i++) {
      if (closestKillableSnake.id === enemies[i].id) {
        pathObject.start = pathObject.ourHead;
        pathObject.target = enemies[i].body[0];
        direction = followPath(pathObject);
      }
    }
  }

  if (direction) {
    return direction.move;
  } else {
    return false;
  }
}

module.exports = {
  eat,
  floodFill,
  followEnemyTail,
  followOwnTail,
  kill
}