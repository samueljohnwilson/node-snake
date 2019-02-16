const assert = require('assert');
const behaviours = require('../../behaviours.js')

describe('eat()', function() {
  it('should return a valid path when there is a path to food', function() {
    assert.equal(eat(pathfinderGrid, ourHead, food), { move: 'right' });
  });

  it('should attempt to follow its tail if there is no path to food', function() {
    assert.equal(eat(pathfinderGrid, ourHead, food), { move: 'right' });
  });

  it('should attempt to follow another snake\'s tail if there is no path to food', function() {
    assert.equal(eat(pathfinderGrid, ourHead, food), { move: 'right' });
  });
});

describe('follow()', function() {
  it('should return a valid path when there is a path to follow', function() {
    assert.equal(eat(pathfinderGrid, ourHead, food), { move: 'right' });
  });

  it('should make a random move if there is no path to follow', function() {
    assert.equal(eat(pathfinderGrid, ourHead, food), { move: 'right' });
  });
});
