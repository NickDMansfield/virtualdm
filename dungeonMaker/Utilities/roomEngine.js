'use strict';

const _ = require(`lodash`);

const getTileSet = ((roomWidth, roomHeight, _tileTypes) => {
  const tileTypes = _tileTypes || ['stone']
  const tiles = [];

  for (let x = 0; x < roomWidth; ++x) {
    for ( let y = 0; y < roomHeight; ++y) {
      tiles.push({ x, y, texture: tileTypes[0] });
    }
  }
  return tiles;
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

const getDefaultRandomConfig = (() => {
  const width = _.random(4, 8);
  const height = _.random(4, 8);
  const challengeRating = _.random(1, 7);
  const roomType = "any";

  return {
    x: 0,
    y: 0,
    width,
    height,
    challengeRating,
    roomType
  };
});

const makeRoom = (_config => {
  //Config should be a JSON object
  const roomConfig = _config || getDefaultRandomConfig();

  return {
    x: roomConfig.x,
    y: roomConfig.y,
    tiles: getTileSet(roomConfig.width, roomConfig.height),
    exits: []
  }
});

module.exports = {
  convertLocalCornersToAbsolute,
  getAbsoluteCornerCoords,
  getLocalCorners,
  getTileSet
}
