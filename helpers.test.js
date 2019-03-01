const { findShortSnakes, findKillableSnakes } = require("./helpers");

describe("findShortSnakes", () => {
  it("returns an array of snakes that are shorter than our snake", () => {
    const mockPathObject = {
      ourSnake: {
        body: [1, 2, 3]
      }
    };
    const mockSnakes = [
      {
        body: [{ x: 1, y: 1 }, { x: 2, y: 1 }]
      },
      {
        body: [{ x: 3, y: 3 }, { x: 3, y: 3 }, { x: 3, y: 3 }]
      }
    ];

    const response = findShortSnakes(mockPathObject, mockSnakes);

    expect(response).toEqual([mockSnakes[0]]);
  });
});

describe("findKillableSnakes", () => {
  it("returns the closest killable snake", () => {
    const mockPathObject = {
      ourSnake: {
        body: [{ x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 3 }]
      }
    };
    const mockSnakes = [
      {
        body: [{ x: 1, y: 1 }, { x: 2, y: 1 }]
      },
      {
        body: [{ x: 10, y: 4 }, { x: 10, y: 5 }, { x: 10, y: 6 }]
      }
    ];

    const closestKillable = findKillableSnakes(mockPathObject, mockSnakes);

    expect(closestKillable).toEqual(mockSnakes[0]);
  });
});

// describe("followPath", )
