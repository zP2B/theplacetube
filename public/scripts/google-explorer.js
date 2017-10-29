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
  var videos = [];
  Array.from(document.getElementsByClassName('videolist-media')).forEach(function(element) {
    videos.push(JSON.parse(element.getAttribute('data-json')));
  });
  initMarkers(videos);
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
function initMarkers(videos) {
  videos.forEach(function(data) {
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
    var element = document.querySelector('[data-id="' + data.youtubeId + '"]');
    marker.addListener('click', function(i) {
      $('#videolist-list').animate({
        scrollTop: element.getBoundingClientRect().top + element.parentElement.scrollTop - element.parentElement.getBoundingClientRect().top
      }, 500);
      var event = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
    });
    markers.push(marker);
  });
}

/**
 * Triggered when map bounds changed
 * refresh videolist
 */
function refreshVideoList() {
  spinSearch();
  $.getJSON(
      '/videos.json',
      {
        lat: map.getCenter().lat,
        lng: map.getCenter().lng,
        boundlat: map.getBounds().getNorthEast().lat,
        boundlng: map.getBounds().getNorthEast().lng
      },
      function(data) {
        $('#videolist-medias').empty();
        populateVideoList(data.videos);
        clearMarkers();
        initMarkers(data.videos);
        $('#videolist-list').animate({scrollTop: 0}, 500);
      },
      'json'
  )
      .fail(function() {
        errorMessage('Failed to refresh video list');
      })
      .always(function() {
        unspinSearch();
      })
  ;
}

document.querySelector('#search').addEventListener('submit', event => {
  event.preventDefault();
  spinSearch();
  // process the form
  $.getJSON(
      '/search.json',
      {
        'place': $('input[name=search]').val()
      })
      .done(function(data) {
        if (data.boundingbox) {
          //listenOnMove = false;
          map.fitBounds([
            [data.boundingbox[1], data.boundingbox[3]],
            [data.boundingbox[0], data.boundingbox[2]]
          ]);
          refreshVideoList(data.videos);
          initMarkers();
          //listenOnMove = true;
        }
      })
      .always(function() {
        unspinSearch();
      });
});

function spinSearch() {
  $('#searchIcon')
      .removeClass('fa-search')
      .addClass('fa-refresh')
      .addClass('fa-spin');
}

function unspinSearch() {
  $('#searchIcon')
      .removeClass('fa-refresh')
      .removeClass('fa-spin')
      .addClass('fa-search');
}

// document.querySelector('.videolist-media').addEventListener('click', event => {
jQuery('body').on('click', '.videolist-media', function(event) {
  // do some magic with $(this) element
  event.preventDefault();
  var data = JSON.parse($(this).attr('data-json'));
  $('#player-title').text(data.title);
  $(this).addClass('visited');
  $('a.videolist-media.active').removeClass('active');
  $(this).addClass('active');
  $('#player').show();
  $('#player-video')
      .empty()
      .append('<iframe allowfullscreen class="embed-responsive-item" src="https://www.youtube.com/embed/' + $(this).attr('data-id') + '?rel=0&showinfo=0&autoplay=1" />');
  $('#player-meta-title').text(data.title);
  $('#player-headbar-title').text(data.title);
  $('#player-meta-timeago-value').text(data.timeago);
  $('#player-meta-description').html(data.description.replace(/(?:\r\n|\r|\n)/g, '<br />'));
  $('#player-meta-tags').empty();
  if (data.tags) {
    var tags = data.tags.map(Function.prototype.call, String.prototype.trim).filter(String);
    tags.forEach(function(tag) {
      $('#player-meta-tags').append('<span class=\'badge badge-secondary mr-1\'><i class=\'fa fa-tag mr-1\'></i>' + tag + '</span>');
    });
  }
});

document.querySelector('#player-headbar-close').addEventListener('click', event => {
  $('#player').hide();
  $('a.videolist-media.active').removeClass('active');
  $('#player-video').empty();
});

document.querySelector('#nextPage').addEventListener('click', event => {
  var nextPageBtn = $('#nextPage');
  if (!nextPageBtn.prop('disabled')) {
    var originalNextPageTxt = nextPageBtn.text();
    nextPageBtn.prop('disabled', true);
    nextPageBtn.html('<i class="fa fa-spinner fa-pulse fa-fw"/>');
    $.getJSON(
        '/videos.json',
        {
          nextPageToken: nextPageBtn.attr('data-token'),
          lat: map.getCenter().lat,
          lng: map.getCenter().lng,
          boundlat: map.getBounds().getNorthEast().lat,
          boundlng: map.getBounds().getNorthEast().lng
        },
        function(data) {
          populateVideoList(data.videos);
          initMarkers(data.videos);
          nextPageBtn.attr('data-token', data.nextPageToken);
        },
        'json')
        .fail(function() {
          errorMessage('Failed to refresh video list');
        })
        .always(function() {
          nextPageBtn.text(originalNextPageTxt);
          nextPageBtn.prop('disabled', false);
        });
  }
});

/**
 * Populate the videolist dom element with mapped video medias
 * @param data videos data server response
 */
function populateVideoList(data) {
  $.each(data, function(index, video) {
    var media = $('<a>')
        .attr('class', 'media video videolist-media list-group-item list-group-item-action')
        .attr('data-id', video.youtubeId)
        .attr('data-json', JSON.stringify(video));
    media.prepend(
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
    $('#videolist-medias').append(media);
  });
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
        enableGeoloc();
      } else {
        errorMessage('No results found for reverse geocoding');
        enableGeoloc();
      }
    } else {
      errorMessage('Geocoder failed due to: ' + status);
      enableGeoloc();
    }
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
document.querySelector('#geolocate').addEventListener('click', event => {
  disableGeoloc();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      };
      reverseGeocode(pos);
    }, function() {
      handleLocationError(true);
      enableGeoloc();
    });
  } else {
    handleLocationError(false);
    enableGeoloc();
  }
});

function disableGeoloc() {
  $('#geolocate')
      .prop('disabled', true)
      .find('>i')
      .removeClass('fa-map-marker')
      .addClass('fa-spin')
      .addClass('fa-circle-o-notch')
  ;
}

function enableGeoloc() {
  $('#geolocate').prop('disabled', false)
      .find('>i')
      .removeClass('fa-spin')
      .removeClass('fa-circle-o-notch')
      .addClass('fa-map-marker')
  ;
}

/**
 * Geolocation error alert message
 * @param browserHasGeolocation
 */
function handleLocationError(browserHasGeolocation) {
  errorMessage(browserHasGeolocation ? 'The Geolocation service failed.' : 'Your browser doesn\'t support geolocation.');
}
