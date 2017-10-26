const googlemaps = require('@google/maps');
const nconf = require('nconf');
nconf
    .argv()
    .env()
    .file({file: '../config.json'});

exports.geocode = function(address, city, country) {
  const googleMapsClient = googlemaps.createClient({
    key: nconf.get('google_api_key'),
    Promise: Promise
  });
  // Geocode an address.
  return googleMapsClient.geocode({
    address: address,
    components: {
      locality: city,
      country: country
    }
  }).asPromise();
};