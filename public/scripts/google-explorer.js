/* global google,googleMapStyle,errorMessage */
var map;
var markers = [];
var pacInput = document.getElementById('place');
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
    mapTypeControl: true,
    mapTypeId: google.maps.MapTypeId.TERRAIN,
    maxZoom: 15,
    minZoom: 4,
    rotateControl: true,
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
  (function pacSelectFirst(input) {
    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

    function addEventListenerWrapper(type, listener) {
      if (type === 'keydown') {
        var orig_listener = listener;
        listener = function(event) {
          var suggestion_selected = $('.pac-item-selected').length > 0;
          if (event.which === 13 && !suggestion_selected) {
            var simulated_downarrow = $.Event('keydown', {
              keyCode: 40,
              which: 40
            });
            orig_listener.apply(input, [simulated_downarrow]);
          }
          orig_listener.apply(input, [event]);
        };
      }
      _addEventListener.apply(input, [type, listener]);
    }

    input.addEventListener = addEventListenerWrapper;
    input.attachEvent = addEventListenerWrapper;
  })(pacInput);
  autocomplete = new google.maps.places.Autocomplete(pacInput);
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
      playVideo(element.getAttribute('data-id'));
    });
    markers.push(marker);
  });
}

document.querySelector('#search-reset-params').addEventListener('click', resetSearchParams);

document.getElementById('search-save-params').addEventListener('click', function(event) {
  var data = {};
  document.getElementById('search-params').querySelectorAll('input, select').forEach(function(control) {
    if (control.value) {
      data[control.getAttribute('name')] = control.value;
    }
  });
  document.getElementById('paramsBtn').setAttribute('class', 'btn btn-primary');
  document.getElementById('paramsBtn').setAttribute('data-json', JSON.stringify(data));
  refreshVideoList();
});

$('#search-params')
    .on('show.bs.modal', function() {
      var data = JSON.parse(document.getElementById('paramsBtn').getAttribute('data-json'));
      loadSearchParams(data);
    })
    .on('shown.bs.modal', function() {
      document.getElementById('search-params-q').focus();
    });

function resetSearchParams() {
  document.querySelectorAll('#search-params select').forEach(function(select) {
    select.value = select.getAttribute('data-default');
  });
  document.querySelectorAll('#search-params input').forEach(function(input) {
    input.value = '';
  });
}

function loadSearchParams(data) {
  resetSearchParams();
  Object.keys(data).forEach(function(prop) {
    document.querySelector('#search-params [name=' + prop + ']').value = data[prop];
  });
}

document.querySelector('#search').addEventListener('submit', function(event) {
  event.preventDefault();
});

function playVideo(id) {
  var element = document.querySelector('.video[data-id="' + id + '"]');
  var data = JSON.parse(element.getAttribute('data-json'));
  $('#player-title').text(data.title);
  $('a.videolist-media.active').removeClass('active');
  element.classList.add('visited');
  element.classList.add('active');
  $('#player-video')
      .empty()
      .append('<iframe allowfullscreen class="embed-responsive-item" src="https://www.youtube.com/embed/' + id + '?rel=0&showinfo=0&autoplay=1" />');
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
  $('#player').show();
  document.getElementById('player').scrollTo(0, 0);
}

document.querySelector('#player-headbar-close').addEventListener('click', backToMap);

/**
 * Close the video and back to map
 */
function backToMap() {
  if (window.location.hash.replace('#', '').length) {
    history.pushState('', document.title, window.location.pathname + window.location.search);
  }
  $('#player').hide();
  $('a.videolist-media.active').removeClass('active');
  $('#player-video').empty();
}

/**
 * Triggered when map bounds changed
 * refresh videolist
 */
function refreshVideoList() {
  spinSearch();
  var params = {
    lat: map.getCenter().lat,
    lng: map.getCenter().lng,
    boundlat: map.getBounds().getNorthEast().lat,
    boundlng: map.getBounds().getNorthEast().lng
  };
  var paramsBtn = $('#paramsBtn');
  if (paramsBtn.attr('data-json')) {
    params.params = paramsBtn.attr('data-json');
  }
  $.getJSON(
      '/search.json',
      params,
      function(data) {
        document.getElementById('videolist-medias').innerHTML = '';
        clearMarkers();
        if (data.nextPageToken) {
          $('#nextPage')
              .show()
              .attr('data-token', data.nextPageToken);
        } else {
          $('#nextPage').hide();
        }
        if (data.videos.length === 0) {
          document.getElementById('videolist-medias').innerHTML = '<p class="text-center alert alert-dark"><i class="fa fa-frown-o"></i>&nbsp;No results</p>';
        } else {
          populateVideoList(data.videos);
          initMarkers(data.videos);
          $('#videolist-list').animate({scrollTop: 0}, 500);
        }
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

document.querySelector('#nextPage').addEventListener('click', function(event) {
  event.preventDefault();
  var nextPageBtn = $('#nextPage');
  if (!nextPageBtn.prop('disabled')) {
    var originalNextPageTxt = nextPageBtn.text();
    nextPageBtn.prop('disabled', true);
    nextPageBtn.html('<i class="fa fa-spinner fa-pulse fa-fw"/>');
    var params = {
      nextPageToken: nextPageBtn.attr('data-token'),
      lat: map.getCenter().lat,
      lng: map.getCenter().lng,
      boundlat: map.getBounds().getNorthEast().lat,
      boundlng: map.getBounds().getNorthEast().lng
    };
    var paramsBtn = $('#paramsBtn');
    if (paramsBtn.attr('data-json')) {
      params.params = paramsBtn.attr('data-json');
    }
    $.getJSON(
        '/search.json',
        params,
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
        .attr('href', '#' + video.youtubeId)
        .attr('data-id', video.youtubeId)
        .attr('data-json', JSON.stringify(video));
    media.prepend(
        $('<img/>').attr({
          'class': 'd-flex mr-2 img-fluid',
          'src': 'https://img.youtube.com/vi/' + video.youtubeId + '/hqdefault.jpg',
          'alt': ''
        })
    );
    var body = $('<div class="media-body"/>')
        .append($('<h2 class="videolist-title h6"/>').text(video.title))
        .append(
            $('<div class="row"/>')
                .append($('<p class="videolist-footer h6 col-7 pr-0"/>').text(video.author))
                .append($('<p class="videolist-footer h6 text-right col-5 pl-0"/>').text(video.timeago))
        );
    media.append(body);
    $('#videolist-medias').append(media);
  });
}

/**
 * Reverse geocoding used after geolocate to print address in place field
 * center the map on location viewport
 * @param latlng position of geolocation result
 */
function reverseGeocode(latlng) {
  var geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    'latLng': latlng
  }, function(results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        pacInput.value = results[1].formatted_address;
        if (results[1].geometry.viewport) {
          map.fitBounds(results[1].geometry.viewport);
        } else {
          map.panTo(latlng);
          map.setZoom(10);
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
document.querySelector('#geolocate').addEventListener('click', function(event) {
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

function spinSearch() {
  $('#paramsIcon')
      .removeClass('fa-cog')
      .addClass('fa-refresh')
      .addClass('fa-spin');
}

function unspinSearch() {
  $('#paramsIcon')
      .removeClass('fa-refresh')
      .removeClass('fa-spin')
      .addClass('fa-cog');
}

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

window.onpopstate = handleNavigation;

/**
 * Handle navigation - window.onpopstate event handler
 * @param event
 */
function handleNavigation(event) {
  var state = event.state;
  var hash = window.location.hash.replace('#', '');
  var active = document.querySelector('.video.active');
  var current = active ? active.getAttribute('data-id') : null;
  if (hash && !(current && hash === current)) {
    playVideo(hash);
  } else {
    backToMap();
  }
}

document.getElementById('player').onscroll = playerScrollHandler;

function playerScrollHandler() {
  var container = document.getElementById('player');
  if (container.scrollTop > 100) {
    document.getElementById('player-scroll-handler').style.display = 'block';
  } else {
    document.getElementById('player-scroll-handler').style.display = 'none';
  }
}
