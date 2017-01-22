'use strict';


const convertLocalCoordToAbsolute = ((room, coordObj) => {
  // Local coordinate refers to the coordinate within the room
  return { x: coordObj.x + room.x, y: coordObj.y + room.y};
});

const getDistanceBetweenPoints = ((p1, p2) => {
  return Math.sqrt((p2.x-p1.x) * (p2.x-p1.x) + (p2.y-p1.y) * (p2.y-p1.y));
});

const getCorridorLength = ((startPoint, endPoint, smartPathing) => {
  //If smartpathing is false, the corridor will just move in a straight line and bend 90 degrees
  return (Math.abs(endPoint.x - startPoint.x) + Math.abs(endPoint.y - startPoint.y));
});

module.exports = {
  convertLocalCoordToAbsolute,
  getCorridorLength,
  getDistanceBetweenPoints
};
