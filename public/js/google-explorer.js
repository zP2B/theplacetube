var map, markers;

function initMap() {
  var geocode = JSON.parse(document.getElementById('place').getAttribute('data-json'));
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: geocode.geometry.location,
    // streetViewControl: false,
    clickableIcons: false,
    disableDefaultUI: true,
    keyboardShortcuts: false,
    // mapTypeControl: false,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    // rotateControl: true,
    // scaleControl: true,
    zoomControl: true,
    // zoomControlOptions: google.maps.ControlPosition.TOP_LEFT,
    styles: googleMapStyle
  });
  if (geocode.geometry.viewport) {
    var resultBounds = new google.maps.LatLngBounds(
        geocode.geometry.viewport.southwest,
        geocode.geometry.viewport.northeast
    );
    map.fitBounds(resultBounds);
  }

  //init autocomplete
  var input = document.getElementById('place');
  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', function() {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      return;
    }
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  });

  //init markers
  markers = [];
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
        // color: '#fff'
        // fontWeight: '500',
        // fontSize: '15px'
      });
      // marker.setIcon({
      //   path: google.maps.SymbolPath.CIRCLE,
      //   scale: 13,
      //   strokeWeight: 1,
      //   fillColor: '#fff',
      //   fillOpacity: 0.5
      // });
    }

    //init marker click event
    marker.addListener('click', function(i) {
      $('#videolist-list').animate({
        scrollTop: element.getBoundingClientRect().top + element.parentElement.scrollTop - element.parentElement.getBoundingClientRect().top
      }, 500);
      var event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      // element.dispatchEvent(event);
    });
    markers.push(marker);
  });
}

function getGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      map.setCenter(pos);
    }, function() {
      handleLocationError(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false);
  }
}

function handleLocationError(browserHasGeolocation) {
  var cause = browserHasGeolocation ? 'The Geolocation service failed.' : 'Your browser doesn\'t support geolocation.';
  errorMessage(cause);
}