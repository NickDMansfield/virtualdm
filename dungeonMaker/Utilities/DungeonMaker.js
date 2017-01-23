'use strict';

const _ = require(`lodash`);
const roomEngine = require(`./roomEngine`);
const mapTools = require(`./mapTools`);

let dungeonType = null;
let dungeonLevel = 1;
let tileTypes = [];
let allRooms = [];
const adjacencyPercentage = 0.5;
const dungeonWidth = 30;
const dungeonHeight = 30;
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
    const tiles = roomEngine.getTileSet(roomWidth, roomHeight);
    rooms.push ({id, tiles});
  }
  return rooms.length > 1 ? rooms : rooms[0];
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
      tilesArr.push(mapTools.convertLocalCoordToAbsolute(room, tile).x.toString() + ',' + mapTools.convertLocalCoordToAbsolute(room, tile).y.toString());
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
        const moddedCurTile = _.clone(curTile);
        moddedCurTile.x += room.x;
        moddedCurTile.y += room.y;
        evalTiles.map(evalTile => {
          const moddedEvalTile = _.clone(evalTile);
          moddedEvalTile.x += evalRoom.x;
          moddedEvalTile.y += evalRoom.y;
          const measureValue = measureMethod(moddedCurTile, moddedEvalTile);
          if ( (moddedCurTile !== moddedEvalTile) && measureValue < pairing.distance || !pairing.distance) {
            pairing.distance = measureValue || pairing.distance;
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

const getRoomPairs = (rooms => {
  //NOTE this determintes which rooms should connect to one another
  return _.map(rooms, room => {
    return getClosestRoom(room, getMiddleCoords, mapTools.getDistanceBetweenPoints);
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
    console.log(row.join("-"));
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
  allRooms = buildRooms(configData.roomCount || 10, minRoomWidth, maxRoomWidth, minRoomHeight, maxRoomHeight);
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
