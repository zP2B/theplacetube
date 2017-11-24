'use strict';

const geolib = require('geolib');

/**
 * Return a distance between two points in meters
 * @param from coords
 * @param to coords
 * @param accuracy in meters
 * @returns {number} a distance
 */
exports.getDistanceBetween = function(from, to, accuracy = 1) {
  return geolib.getDistanceSimple(
      {latitude: from.lat, longitude: from.lng},
      {latitude: to.lat, longitude: to.lng},
      accuracy
  );
};