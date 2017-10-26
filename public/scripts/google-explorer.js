var map;
var markers = [];
var place;
var autocomplete;

/**
 * Initialize the map
 * async triggered on google map script load
 */
function initMap() {
  var geocode = JSON.parse(document.getElementById('place').getAttribute('data-json'));
  map = new google.maps.Map(document.getElementById('map'), {
    center: geocode.geometry.location,
    clickableIcons: false,
    disableDefaultUI: true,
    keyboardShortcuts: false,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    maxZoom: 15,
    minZoom: 4,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT
    },
    styles: googleMapStyle,
    zoom: 10
  });
  if (geocode.geometry.viewport) {
    var resultBounds = new google.maps.LatLngBounds(
        geocode.geometry.viewport.southwest,
        geocode.geometry.viewport.northeast
    );
    map.fitBounds(resultBounds);
  }
  initAutocomplete();
  initMarkers();
  google.maps.event.addListenerOnce(map, 'idle', function() {
    map.addListener('dragend', refreshVideoList);
    map.addListener('zoom_changed', refreshVideoList);
  });
}

/**
 * Initialize place input field with google places autocomplete api
 */
function initAutocomplete() {
  place = document.getElementById('place');
  autocomplete = new google.maps.places.Autocomplete(place);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.panTo(place.geometry.location);
      map.setZoom(10);
    }
  });
}

/**
 * Init map markers
 * triggered on load and after populating videolist-medias dom element
 */
function initMarkers() {
  if (markers.length) {
    clearMarkers();
  }

  Array.from(document.getElementsByClassName('videolist-media')).forEach(function(element) {
    var data = JSON.parse(element.getAttribute('data-json'));
    var marker = new google.maps.Marker({
      position: data.location,
      map: map,
      title: data.title
    });
    if (data.icon) {
      marker.setLabel({
        fontFamily: 'Fontawesome',
        text: data.icon
      });
    }

    marker.addListener('click', function(i) {
      $('#videolist-list').animate({
        scrollTop: element.getBoundingClientRect().top + element.parentElement.scrollTop - element.parentElement.getBoundingClientRect().top
      }, 500);
      var event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      //TODO
      // element.dispatchEvent(event);
    });
    markers.push(marker);
  });
}

/**
 * Triggered when map bounds changed
 * refresh videolist
 */
function refreshVideoList() {
  $.get(
      '/refresh',
      {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
        nelat: map.getBounds().getNorthEast().lat,
        nelng: map.getBounds().getNorthEast().lng
      },
      function(data) {
        populateVideoList(data);
        initMarkers();
        $('#videolist-list').animate({scrollTop: 0}, 500);
      },
      'json'
  )
      .fail(function() {
        errorMessage('Failed to refresh video list');
      });
}

/**
 * Populate the videolist dom element with mapped video medias
 * @param data videos data server response
 */
function populateVideoList(data) {
  $('#videolist-list').empty();
  $.each(data, function(index, video) {
    var media = $('<a>')
        .attr('class', 'media video videolist-media list-group-item list-group-item-action')
        .attr('data-json', JSON.stringify(video));
    media.append(
        $('<img/>').attr({
          'class': 'd-flex mr-2 img-fluid',
          'src': 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg',
          'alt': video.title
        })
    );
    var body = $('<div class="media-body"/>')
        .append($('<h5 class="h6 videolist-title"/>').text(video.title))
        .append(
            $('<div class="row"/>')
                .append($('<h6 class="videolist-footer col-7 pr-0"/>').text(video.author))
                .append($('<h6 class="videolist-footer text-right col-5 pl-0"/>').text(video.timeago))
        );
    media.append(body);
    $('#videolist-list').append(media);
  });
}

/**
 * Destroy map markers
 */
function clearMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
  markers = [];
}

/**
 * Get User geolocation (geolocation button onclick)
 */
function getGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      reverseGeocode(pos);
    }, function() {
      handleLocationError(true);
    });
  } else {
    handleLocationError(false);
  }
}

/**
 * Geolocation error alert message
 * @param browserHasGeolocation
 */
function handleLocationError(browserHasGeolocation) {
  errorMessage(browserHasGeolocation ? 'The Geolocation service failed.' : 'Your browser doesn\'t support geolocation.');
}

/**
 * Reverse geocoding used after geolocate to print address in place field
 * center the map on location viewport
 * @param latlng position of geolocation result
 * @param move if false do not trigger map move
 */
function reverseGeocode(latlng, move = true) {
  var geocoder = new google.maps.Geocoder();
  // var latlng = new google.maps.LatLng(lat, lng);
  geocoder.geocode({
    'latLng': latlng
  }, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        place.value = results[1].formatted_address;
        if (move) {
          if (results[1].geometry.viewport) {
            map.fitBounds(results[1].geometry.viewport);
          } else {
            map.panTo(latlng);
            map.setZoom(10);
          }
        }
      } else {
        errorMessage('No results found for reverse geocoding');
      }
    } else {
      errorMessage('Geocoder failed due to: ' + status);
    }
  });
}
