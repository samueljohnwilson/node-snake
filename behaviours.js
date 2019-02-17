const {
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
} = require('./helpers.js');

function eat(pathObject, targetFood) {
  // console.log('eat')
  if (!targetFood) {
    return false;
  }

  pathObject.target = targetFood;
  return followPath(pathObject);
}

function followOwnTail(pathObject, ourTail) {
  if (pathObject.ourSnake.body.length < 3) {
    return false;
  }

  // console.log('followOwnTail')
  pathObject.target = ourTail;

  return followPath(pathObject)
}

function followEnemyTail(pathObject, enemies) {
  // console.log('followEnemyTail')
  const enemyTails = findEnemyTails(enemies);
  if (enemyTails.length) {
    for (let i = 0; i < enemyTails.length; i++) {
      pathObject.target = enemyTails[i];
      const move = followPath(pathObject);
      if (move) {
        return move;
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
      return followPath(pathObject);
    }
  }

  return false;
}

module.exports = {
  eat,
  followEnemyTail,
  followOwnTail,
  kill
}