const axios = require('axios');

function geocode(place, city, state, country) {
  const URI = 'http://nominatim.openstreetmap.org/search';
  let request = {};
  if (city || state || country) {
    request = {
      'street': place,
      'city': city,
      'state': state,
      'country': country
    };
  } else {
    request.q = place;
  }
  request.format = 'json';
  axios
      .get(URI, {params: request})
      .then((response) => {
        return response.data.shift();
      })
      .catch((error) => {
        if (error.response) {
          console.log('nominatim geocode response error');
          console.log(error.response.status);
        } else if (error.request) {
          console.log('nominatim geocode request error');
          console.log(error.request);
        } else {
          console.log('nominatim geocode error');
          console.log(error.message);
        }
        return new Error('nominatim geocoding search error');
      });
}
