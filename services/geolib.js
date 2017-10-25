const geolib = require('geolib');

exports.getDistanceBetween = function(coords1, coords2, accuracy = 10) {
  return geolib.getDistanceSimple(
      {latitude: coords1.lat, longitude: coords1.lng},
      {latitude: coords2.lat, longitude: coords2.lng},
      accuracy
  );
};