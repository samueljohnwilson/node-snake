function oneEnemyLeft(allSnakes) {
  if (allSnakes.length === 2) {
    return true;
  }

  return false;
}

function longerThanAllSnakes(ourSnake, enemies) {
  let longest = ourSnake.length;

  for (let i = 0; i < enemies.length; i++) {
    if (enemies[i].length > longest) {
      return false;
    }
  }

  return true;
}

function longerThanOneSnake(ourSnake, enemy) {
  if (ourSnake.body.length < enemy.body.length) {
    return false;
  }

  return true;
}

function hasHealthBelow(snake, health) {
  if (snake.health < health) {
    return true;
  }

  return false;
}

module.exports = {
  oneEnemyLeft,
  longerThanAllSnakes,
  longerThanOneSnake,
  hasHealthBelow
}