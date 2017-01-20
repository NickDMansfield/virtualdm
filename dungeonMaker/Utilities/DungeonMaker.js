'use strict';

const _ = require(`lodash`);

let dungeonType = null;
let dungeonLevel = 1;
let tileTypes = [];
let allRooms = [];
const adjacencyPercentage = 0.5;
const dungeonWidth = 15;
const dungeonHeight = 15;
const maxRoomWidth = 6;
const maxRoomHeight = 6;
const minRoomWidth = 2;
const minRoomHeight = 2;

const generateSetting = (() => {
  const dungeonTypes = ["lair", "death-trap", "mine"];
  dungeonType = _.random(dungeonTypes.length-1);
  dungeonLevel = _.random(5);
  tileTypes.push("marble");
});

const buildRooms = ((roomCount, minWidth, maxWidth, minHeight, maxHeight) => {
  //NOTE this returns an array only if more than one room is requested
  // Generates an array of rooms.  Needs to have doors applied, and connections established.
  //  Also, this does not populate or furnish the room.  It simply makes the geometry
  let rooms = [];
  while (rooms.length < roomCount) {
    const roomWidth = _.random(minWidth, maxWidth);
    const roomHeight = _.random(minHeight, maxHeight);
    const id = allRooms.length + rooms.length;
    const tiles = [];

    for (let x = 0; x < roomWidth; ++x) {
      for ( let y = 0; y < roomHeight; ++y) {
        tiles.push({ x, y, texture: tileTypes[0]});
      }
    }
    rooms.push ({id, tiles});
  }
  return rooms.length > 1 ? rooms : rooms[0];
});

const getLocalCorners = (room => {
  // returns TL->TR->BL->BR
  const lastTile = room.tiles[room.tiles.length-1];
  return [room.tiles[0], { x: lastTile.x, y: 0 }, { x: 0, y: lastTile.y }, lastTile];
});

const convertLocalCornersToAbsolute = ((room, cornersArr) => {
  const retArr = [];
  for (let zz = 0; zz < cornersArr.length; ++zz) {
    retArr.push({ x: cornersArr[zz].x + room.x, y: cornersArr[zz].y + room.y});
  }
  return retArr;
});

const getAbsoluteCornerCoords = ( room => {
  return convertLocalCornersToAbsolute(room, getLocalCorners(room));
});

const convertLocalCoordToAbsolute = ((room, coordObj) => {
  // Local coordinate refers to the coordinate within the room
  return { x: coordObj.x + room.x, y: coordObj.y + room.y};
});

const getBounds = ( room => {
  const absCorners = getAbsoluteCornerCoords(room);
  const bounds = {
    minX: _.min(absCorners, function(c) { return c.x;}),
    minY: _.min(absCorners, function(c) { return c.y;}),
    maxX: _.max(absCorners, function(c) { return c.x;}),
    maxY: _.max(absCorners, function(c) { return c.y;})
  };
  return bounds;
});

const isPointInBounds = ((bounds, point) => {
  return point.x >= bounds.minX && point.x <= bounds.maxX && point.y >= bounds.minY && point.y <= bounds.maxY;
});

const areAnyPointsInsideBounds = ((bounds, points) => {
  return _.map(points, point => isPointInBounds(bounds, point)).indexOf(true) > -1;
});

const validateRoomPlacement = (roomArr => {
  let tilesArr = [];
  roomArr.map(room => {
    room.tiles.map(tile => {
      tilesArr.push(convertLocalCoordToAbsolute(room, tile).x.toString() + ',' + convertLocalCoordToAbsolute(room, tile).y.toString());
    });
  });
  const uniqueTiles = _.uniq(tilesArr);
  console.log(`There were ${ tilesArr.length - uniqueTiles.length} overlaps`);
  return tilesArr.length === uniqueTiles.length;
});

const placeRooms = (() => {
  //NOTE this function will place the rooms at random spots.  They will not have barriers established or exits configured
  //  This simply assigns them an x and y coordinate and validates that there is no overlap
  let roomsPlaced = 0;
  let placementsValid = false;

  while (placementsValid === false) {
    for (let zz = 0; zz < allRooms.length; ++zz) {
      allRooms[zz].x = _.random(dungeonWidth);
      allRooms[zz].y = _.random(dungeonHeight);
    }
    placementsValid = validateRoomPlacement(allRooms);
  }
});
const getDistanceBetweenPoints = ((p1, p2) => {
  return Math.sqrt((p2.x-p1.x) * (p2.x-p1.x) + (p2.y-p1.y) * (p2.y-p1.y));
});

const getRoomById = (id => {
  _.find(allRooms, { id })
});

const getClosestRoom = ((room, gatheringMethod, measureMethod) => {
  //gatheringMethod should be a method which returns an array of tile objects
  //measuremethod Requires a method which generates a number from two tile objects
  const tilesArr = gatheringMethod(room);
  const pairing = { startRoom: room.id, startTile: null, endRoom: null, endTile: null, distance: null };
  for (let roomIndex = 0; roomIndex < allRooms.length; ++roomIndex) {
    const roomConnections = [];
    const evalRoom = allRooms[roomIndex];
    if (room.id !== evalRoom.id) {
      const evalTiles = gatheringMethod(evalRoom);
      tilesArr.map(curTile => {
        evalTiles.map(evalTile => {
          const measureValue = measureMethod(curTile, evalTile);
          console.log(`CTILE: ${JSON.stringify(curTile)}`);
          console.log(`eTILE: ${JSON.stringify(evalTile)}`);
          console.log(`MV: ${measureValue}`);
          if (measureValue < pairing.distance || !pairing.distance) {
            pairing.distance = measureValue;
            pairing.endRoom = evalRoom.id;
            pairing.startTile = curTile;
            pairing.endTile = evalTile;
          }
        });
      });
    }
  }
  return pairing;
});

const getMiddleCoords = ((room, _absolute) => {
  // Returns the coordinates for the top, right, bottom, and left middle blocks.  Used for door placement
  const absolute = _absolute || true;
  const xMod = absolute ? room.x : 0;
  const yMod = absolute ? room.y : 0;
  const lastTile = room.tiles[room.tiles.length - 1];
  const midY = Math.ceil(lastTile.y / 2);
  const midX = Math.ceil(lastTile.x / 2);
  // [T, R, B, L]
  return [
    { x: midX + xMod, y: 0 + xMod},
    { x: lastTile.x + xMod, y: midY + yMod},
    { x: midX + xMod, y: lastTile.y + xMod},
    { x: 0 + xMod, y: midY +xMod}
  ];
});
const getCorridorLength = ((startPoint, endPoint, smartPathing) => {
  //If smartpathing is false, the corridor will just move in a straight line and bend 90 degrees
  return (Math.abs(endPoint.x - startPoint.x) + Math.abs(endPoint.y - startPoint.y));
});

const getRoomPairs = (rooms => {
  //NOTE this determintes which rooms should connect to one another
  return _.map(rooms, room => {
    return getClosestRoom(room, getMiddleCoords, getCorridorLength);
  });
});

const drawDungeon = (() => {
  const imgMapArr = [];
  let widestRoom = 0;
  let tallestRoom = 0;

  // These are switched like this to account for the rotation when converting to a dual array
  const adjustedHeight = dungeonWidth + maxRoomWidth;
  const adjustedWidth = dungeonHeight + maxRoomHeight;
  for (let xx = 0; xx <= adjustedWidth; ++xx) {
    const col = [];
    for (let yy = 0; yy <= adjustedHeight; ++yy) {
      col.push(' ');
    }
    imgMapArr.push(col);
  }
  allRooms.map(room => {
    room.tiles.map((tile, i) => {
      imgMapArr[tile.y + room.y][tile.x + room.x] = i === 0 ? room.id : 'R';
    })
  });

  imgMapArr.map(row => {
    console.log(row.join(" "));
  })
});

const getAbsPointDiff = ((tile1, tile2) => {
  return {
    x: Math.abs(tile2.x - tile1.x),
    y: Math.abs(tile2.y - tile1.y)
  };
});

const createCorridor = ((tile1, tile2, smartPathing) => {
  //TODO This should just generate an array and pass it to a room factory at some point
  const room = {
    x: tile1.x,
    y: tile1.y,
    tiles: []
  };
});

const buildDungeon = (_configData => {

  const configData = _configData || {};

  generateSetting();
  allRooms = buildRooms(configData.roomCount || 5, minRoomWidth, maxRoomWidth, minRoomHeight, maxRoomHeight);
  placeRooms();
  let roomPairs = getRoomPairs(allRooms);
  console.log(roomPairs);
//  console.log(JSON.stringify(allRooms));
  drawDungeon();
});

buildDungeon();
module.exports = {
    buildDungeon
};
