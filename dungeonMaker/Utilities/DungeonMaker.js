'use strict';

const _ = require(`lodash`);

let dungeonType = null;
let dungeonLevel = 1;
let tileTypes = [];
let allRooms = [];
const adjacencyPercentage = 0.5;
const dungeonWidth = 40;
const dungeonHeight = 40;
const maxRoomWidth = 8;
const maxRoomHeight = 8;
const minRoomWidth = 4;
const minRoomHeight = 4;

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

const getClosestRoomByCorners = (room => {
  const cornersArr = getAbsoluteCornerCoords(room);
  const pairing = { distance: null, startRoom: room.id, endRoom: null };
  for (let roomIndex = 0; roomIndex < allRooms.length; ++roomIndex) {
    const roomConnections = [];
    const evalRoom = allRooms[roomIndex];
    if (room.id !== evalRoom.id) {
      const evalCorners = getAbsoluteCornerCoords(evalRoom);
      cornersArr.map(curCorner => {
        evalCorners.map(evalCorner => {
          const cornerDistance = getDistanceBetweenPoints(curCorner, evalCorner);
          if (cornerDistance < pairing.distance || !pairing.distance) {
            pairing.distance = cornerDistance;
            pairing.endRoom = evalRoom.id;
          }
        });
      });
    }
  }
  return pairing;
});

const pairRooms = (rooms => {
  //NOTE this determintes which rooms should connect to one another
  const matches = _.map(rooms, room => {
    return getClosestRoomByCorners(room);
  });
  console.log(JSON.stringify(matches, null, 2));
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
      col.push(` `);
    }
    imgMapArr.push(col);
  }
  allRooms.map(room => {
    room.tiles.map(tile => {
      imgMapArr[tile.y + room.y][tile.x + room.x] = room.id.toString().charAt(room.id.toString().length-1);
    })
  });

  imgMapArr.map(row => {
    console.log(row.join(" "));
  })
});

const buildDungeon = (_configData => {

  const configData = _configData || {};

  generateSetting();
  allRooms = buildRooms(configData.roomCount || 12, minRoomWidth, maxRoomWidth, minRoomHeight, maxRoomHeight);
  placeRooms();
  pairRooms(allRooms);
//  console.log(JSON.stringify(allRooms));
  drawDungeon();
});

buildDungeon();
module.exports = {
    buildDungeon
};
